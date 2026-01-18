<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'warning' : 'success'"
        class="mb-4 text-center"
      >
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Trust Documents Section -->
      <NeoCard variant="erobo">
        <view v-for="trust in trusts" :key="trust.id">
          <TrustCard
            :trust="trust"
            :t="t as any"
            @heartbeat="heartbeatTrust"
            @claimYield="claimYield"
            @execute="executeTrust"
          />
        </view>
        <view v-if="trusts.length === 0" class="text-center p-4">
          <text>{{ t("noTrusts") }}</text>
        </view>
      </NeoCard>

      <!-- Create Trust Form -->
      <CreateTrustForm
        v-model:name="newTrust.name"
        v-model:beneficiary="newTrust.beneficiary"
        v-model:neo-value="newTrust.neoValue"
        v-model:interval-days="newTrust.intervalDays"
        v-model:notes="newTrust.notes"
        :is-loading="isLoading"
        :t="t as any"
        @create="create"
      />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <StatsCard :stats="stats" :t="t as any" />
    </view>

    <!-- Docs Tab -->
    <view v-if="activeTab === 'docs'" class="tab-content scrollable">
      <NeoDoc
        :title="t('title')"
        :subtitle="t('docSubtitle')"
        :description="t('docDescription')"
        :steps="docSteps"
        :features="docFeatures"
      />
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, useEvents, usePayments } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoDoc, NeoCard } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";

import TrustCard, { type Trust } from "./components/TrustCard.vue";
import CreateTrustForm from "./components/CreateTrustForm.vue";
import StatsCard from "./components/StatsCard.vue";


const { t } = useI18n();

const navTabs = computed<NavTab[]>(() => [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const activeTab = ref("main");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-heritage-trust";
const { address, connect, invokeContract, invokeRead, getBalance, chainType, switchChain, getContractAddress } =
  useWallet() as any;
const { list: listEvents } = useEvents();
const { payGAS } = usePayments(APP_ID);
const isLoading = ref(false);
const contractAddress = ref<string | null>(null);

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("error"));
  }
  return contractAddress.value;
};

const TRUST_NAME_KEY = "heritage-trust-names";
const loadTrustNames = () => {
  try {
    const raw = uni.getStorageSync(TRUST_NAME_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const trustNames = ref<Record<string, string>>(loadTrustNames());
const saveTrustName = (id: string, name: string) => {
  if (!id || !name) return;
  trustNames.value = { ...trustNames.value, [id]: name };
  try {
    uni.setStorageSync(TRUST_NAME_KEY, JSON.stringify(trustNames.value));
  } catch {
    // ignore storage errors
  }
};

const trusts = ref<Trust[]>([]);
const newTrust = ref({ name: "", beneficiary: "", neoValue: "", intervalDays: "30", notes: "" });
const status = ref<{ msg: string; type: string } | null>(null);
const isLoadingData = ref(false);

const stats = computed(() => ({
  totalTrusts: trusts.value.length,
  totalNeoValue: trusts.value.reduce((sum, t) => sum + (t.neoValue || 0), 0),
  activeTrusts: trusts.value.filter((t) => t.status === "active" || t.status === "triggered").length,
}));

const ownerMatches = (value: unknown) => {
  if (!address.value) return false;
  const val = String(value || "");
  if (val === address.value) return true;
  const normalized = normalizeScriptHash(val);
  const addrHash = addressToScriptHash(address.value);
  return Boolean(normalized && addrHash && normalized === addrHash);
};

const toTimestampMs = (value: unknown) => {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return num > 1e12 ? num : num * 1000;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const waitForEvent = async (txid: string, eventName: string) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await listEvents({ app_id: APP_ID, event_name: eventName, limit: 25 });
    const match = res.events.find((evt) => evt.tx_hash === txid);
    if (match) return match;
    await sleep(1500);
  }
  return null;
};

// Fetch trusts data from smart contract
const fetchData = async () => {
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) return;

    isLoadingData.value = true;
    const contract = await ensureContractAddress();

    // Get total trusts count from contract
    const totalResult = await invokeRead({
      contractAddress: contract,
      operation: "totalTrusts",
      args: [],
    });
    const totalTrusts = Number(parseInvokeResult(totalResult) || 0);
    const userTrusts: Trust[] = [];
    const now = Date.now();

    // Iterate through all trusts and find ones owned by current user
    for (let i = 1; i <= totalTrusts; i++) {
      const trustResult = await invokeRead({
        contractAddress: contract,
        operation: "getTrustDetails",
        args: [{ type: "Integer", value: i.toString() }],
      });
      const parsed = parseInvokeResult(trustResult);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
      const trustData = parsed as Record<string, unknown>;
      const owner = trustData.owner;
      if (!ownerMatches(owner)) continue;

      const deadlineMs = toTimestampMs(trustData.deadline);
      const rawStatus = String(trustData.status || "");
      let status: Trust["status"] = "pending";
      if (rawStatus === "active") status = "active";
      else if (rawStatus === "grace_period") status = "pending";
      else if (rawStatus === "executable") status = "triggered";
      else if (rawStatus === "executed") status = "executed";
      else status = "pending";
      const daysRemaining = deadlineMs ? Math.max(0, Math.ceil((deadlineMs - now) / 86400000)) : 0;

      userTrusts.push({
        id: i.toString(),
        name: String(trustData.trustName || trustNames.value?.[String(i)] || t("trustFallback", { id: i })),
        beneficiary: String(trustData.primaryHeir || t("unknown")),
        neoValue: Number(trustData.principal || 0),
        icon: "📜",
        status,
        daysRemaining,
        deadline: deadlineMs ? new Date(deadlineMs).toISOString().split("T")[0] : t("notAvailable"),
        canExecute: status === "triggered",
      });
    }

    trusts.value = userTrusts.sort((a, b) => Number(b.id) - Number(a.id));
  } catch {
  } finally {
    isLoadingData.value = false;
  }
};

const create = async () => {
  const neoAmount = Math.floor(parseFloat(newTrust.value.neoValue));
  const intervalDays = Math.floor(parseFloat(newTrust.value.intervalDays));
  if (
    isLoading.value ||
    !newTrust.value.name ||
    !newTrust.value.beneficiary ||
    !(neoAmount > 0) ||
    !(intervalDays > 0)
  ) {
    return;
  }

  try {
    status.value = { msg: t("creating"), type: "loading" };

    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }

    const neo = await getBalance("NEO");
    const balance = typeof neo === "string" ? parseFloat(neo) || 0 : typeof neo === "number" ? neo : 0;
    if (neoAmount > balance) {
      throw new Error(t("insufficientNeo"));
    }

    const contract = await ensureContractAddress();
    const payment = await payGAS(String(neoAmount), `trust:create:${newTrust.value.beneficiary}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "createTrust",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Hash160", value: newTrust.value.beneficiary },
        { type: "Integer", value: neoAmount },
        { type: "Integer", value: intervalDays },
        { type: "String", value: newTrust.value.name.trim().slice(0, 100) },
        { type: "String", value: newTrust.value.notes.trim().slice(0, 300) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    if (txid) {
      const event = await waitForEvent(txid, "TrustCreated");
      if (event?.state) {
        const values = Array.isArray(event.state) ? event.state.map(parseStackItem) : [];
        const trustId = String(values[0] || "");
        if (trustId) {
          saveTrustName(trustId, newTrust.value.name);
        }
      }
    }

    status.value = { msg: t("trustCreated"), type: "success" };
    newTrust.value = { name: "", beneficiary: "", neoValue: "", intervalDays: "30", notes: "" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const heartbeatTrust = async (trust: Trust) => {
  if (isLoading.value) return;
  try {
    isLoading.value = true;
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("error"));
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "heartbeat",
      args: [{ type: "Integer", value: trust.id }],
    });
    status.value = { msg: t("heartbeat"), type: "success" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

const claimYield = async (trust: Trust) => {
  if (isLoading.value) return;
  try {
    isLoading.value = true;
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("error"));
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "claimYield",
      args: [{ type: "Integer", value: trust.id }],
    });
    status.value = { msg: t("claimYield"), type: "success" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

const executeTrust = async (trust: Trust) => {
  if (isLoading.value) return;
  try {
    isLoading.value = true;
    const contract = await ensureContractAddress();
    await invokeContract({
      scriptHash: contract,
      operation: "executeTrust",
      args: [{ type: "Integer", value: trust.id }],
    });
    status.value = { msg: t("executeTrust"), type: "success" };
    await fetchData();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchData();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$library-bg: #2b2118;
$library-parchment: #f0e6d2;
$library-leather: #5c4033;
$library-gold: #c5a059;
$library-ink: #3e2723;

:global(page) {
  background: $library-bg;
}

.app-container {
  padding: 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
  background-color: $library-bg;
  /* Leather Texture */
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMmIyMTE4Ii8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMzZTI3MjMiIG9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=');
  min-height: 100vh;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Library Component Overrides */
:deep(.neo-card) {
  background: $library-parchment !important;
  border: 8px solid $library-leather !important;
  border-radius: 4px !important;
  box-shadow: 10px 10px 20px rgba(0,0,0,0.5), inset 0 0 40px rgba(92, 64, 51, 0.2) !important;
  color: $library-ink !important;
  position: relative;
  
  /* Book Spine Effect */
  &::before {
    content: '';
    position: absolute;
    left: -8px; top: -8px; bottom: -8px;
    width: 20px;
    background: linear-gradient(to right, #3e2723, #5c4033, #3e2723);
    border-radius: 4px 0 0 4px;
    box-shadow: 2px 0 5px rgba(0,0,0,0.5);
  }

  &.variant-danger {
    border-color: #8b0000 !important;
    background: #ffebee !important;
  }
}

:deep(.neo-button) {
  border-radius: 4px !important;
  font-family: 'Times New Roman', serif !important;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700 !important;
  
  &.variant-primary {
    background: linear-gradient(135deg, $library-leather, #3e2723) !important;
    color: $library-gold !important;
    border: 1px solid $library-gold !important;
    box-shadow: 0 4px 8px rgba(0,0,0,0.4) !important;
    
    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 4px rgba(0,0,0,0.4) !important;
    }
  }
  
  &.variant-secondary {
    background: transparent !important;
    border: 1px solid $library-ink !important;
    color: $library-ink !important;
  }
}

:deep(input), :deep(.neo-input) {
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid $library-leather !important;
  border-radius: 2px !important;
  color: $library-ink !important;
  font-family: 'Courier New', monospace !important;
}

:deep(text), :deep(view) {
  font-family: 'Times New Roman', serif;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
