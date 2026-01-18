<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
            t("switchToNeo")
          }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'create' || activeTab === 'claim'" class="app-container">
      <LuckyOverlay :lucky-message="luckyMessage" :t="t as any" @close="luckyMessage = null" />
      <Fireworks :active="!!luckyMessage" :duration="3000" />
      <OpeningModal
        :visible="showOpeningModal"
        :envelope="openingEnvelope"
        :is-connected="!!address"
        :is-opening="!!openingId"
        @connect="handleConnect"
        @open="() => openingEnvelope && claim(openingEnvelope, true)"
        @close="showOpeningModal = false"
      />

      <AppStatus :status="status" />

      <view v-if="activeTab === 'create'" class="tab-content">
        <CreateEnvelopeForm
          v-model:name="name"
          v-model:description="description"
          v-model:amount="amount"
          v-model:count="count"
          v-model:expiryHours="expiryHours"
          :is-loading="isLoading"
          :t="t as any"
          @create="create"
        />
      </view>

      <view v-if="activeTab === 'claim'" class="tab-content">
        <EnvelopeList
          :envelopes="envelopes"
          :loading-envelopes="loadingEnvelopes"
          :opening-id="openingId"
          :t="t as any"
          @claim="openFromList"
          @share="handleShare"
        />
      </view>
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { AppLayout, NeoDoc, NeoCard, NeoButton, Fireworks } from "@/shared/components";
import EnvelopeHeader from "./components/EnvelopeHeader.vue";
import LuckyOverlay from "./components/LuckyOverlay.vue";
import OpeningModal from "./components/OpeningModal.vue";
import AppStatus from "./components/AppStatus.vue";
import CreateEnvelopeForm from "./components/CreateEnvelopeForm.vue";
import EnvelopeList from "./components/EnvelopeList.vue";

const { t } = useI18n();

const APP_ID = "miniapp-redenvelope";
const { address, connect, invokeContract, invokeRead, chainType, switchChain, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

// ============================================
// Hybrid Mode: Frontend Distribution Preview
// ============================================

// Contract constants (matches MiniAppRedEnvelope.Hybrid.cs)
const MIN_AMOUNT = 10000000n; // 0.1 GAS in fixed8
const MAX_PACKETS = 100;
const MIN_PER_PACKET = 1000000n; // 0.01 GAS in fixed8
const BEST_LUCK_BONUS_RATE = 5n; // 5%

/**
 * Generate deterministic seed from user input (for preview only).
 * Actual distribution uses TEE RNG service.
 */
const generatePreviewSeed = (totalAmount: string, packetCount: string): Uint8Array => {
  const data = `preview:${totalAmount}:${packetCount}:${Date.now()}`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);
  // Simple hash for preview (not cryptographically secure, just for UI)
  const hash = new Uint8Array(32);
  for (let i = 0; i < bytes.length; i++) {
    hash[i % 32] ^= bytes[i];
  }
  return hash;
};

/**
 * Get random value from seed at index (matches contract logic).
 */
const getRandFromSeed = (seed: Uint8Array, index: number): bigint => {
  // Combine seed with index
  const combined = new Uint8Array(seed.length + 4);
  combined.set(seed);
  combined[seed.length] = index & 0xff;
  combined[seed.length + 1] = (index >> 8) & 0xff;
  combined[seed.length + 2] = (index >> 16) & 0xff;
  combined[seed.length + 3] = (index >> 24) & 0xff;

  // Simple hash (for preview)
  let hash = 0n;
  for (let i = 0; i < combined.length; i++) {
    hash = (hash * 31n + BigInt(combined[i])) % (2n ** 256n);
  }
  return hash < 0n ? -hash : hash;
};

/**
 * Preview distribution calculation (matches contract PreviewDistribution).
 * Returns array of amounts in fixed8 format.
 */
const previewDistribution = (totalAmountGas: number, packetCount: number): bigint[] => {
  if (packetCount <= 0 || packetCount > MAX_PACKETS) return [];

  const totalAmount = BigInt(Math.floor(totalAmountGas * 1e8));
  if (totalAmount < BigInt(packetCount) * MIN_PER_PACKET) return [];

  const seed = generatePreviewSeed(totalAmountGas.toString(), packetCount.toString());
  const amounts: bigint[] = [];
  let remaining = totalAmount;

  for (let i = 0; i < packetCount - 1; i++) {
    const packetsLeft = BigInt(packetCount - i);
    const maxForThis = remaining - (packetsLeft - 1n) * MIN_PER_PACKET;

    const randValue = getRandFromSeed(seed, i);
    const range = maxForThis - MIN_PER_PACKET;
    let amount = MIN_PER_PACKET;

    if (range > 0n) {
      amount = MIN_PER_PACKET + (randValue % range);
    }

    amounts.push(amount);
    remaining -= amount;
  }

  // Last packet gets remainder
  amounts.push(remaining);

  return amounts;
};

/**
 * Calculate best luck bonus amount.
 */
const calculateBestLuckBonus = (bestLuckAmount: bigint): bigint => {
  return bestLuckAmount * BEST_LUCK_BONUS_RATE / 100n;
};

const activeTab = ref<string>("create");
const navTabs = computed(() => [
  { id: "create", label: t("createTab"), icon: "envelope" },
  { id: "claim", label: t("claimTab"), icon: "gift" },
  { id: "docs", label: t("docs"), icon: "book" },
]);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const name = ref("");
const description = ref("");
const amount = ref("");
const count = ref("");
const expiryHours = ref("24");
const status = ref<{ msg: string; type: "success" | "error" } | null>(null);
const luckyMessage = ref<{ amount: number; from: string } | null>(null);
const openingId = ref<string | null>(null);
const contractAddress = ref<string | null>(null);
const loadingEnvelopes = ref(false);

const showOpeningModal = ref(false);
const openingEnvelope = ref<EnvelopeItem | null>(null);

type EnvelopeItem = {
  id: string;
  creator: string;
  from: string;
  name?: string;
  description?: string;
  total: number;
  remaining: number;
  totalAmount: number;
  bestLuckAddress?: string;
  bestLuckAmount?: number;
  ready: boolean;
  expired: boolean;
  canClaim: boolean;
};

const envelopes = ref<EnvelopeItem[]>([]);

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const fromFixed8 = (value: string | number) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return num / 1e8;
};

const formatHash = (value: string) => {
  const clean = String(value || "").trim();
  if (!clean) return "";
  if (clean.length <= 10) return clean;
  return `${clean.slice(0, 6)}...${clean.slice(-4)}`;
};

const parseEnvelopeData = (data: any) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return {
      creator: String(data[0] ?? ""),
      totalAmount: Number(data[1] ?? 0),
      packetCount: Number(data[2] ?? 0),
      claimedCount: Number(data[3] ?? 0),
      remainingAmount: Number(data[4] ?? 0),
      bestLuckAddress: String(data[5] ?? ""),
      bestLuckAmount: Number(data[6] ?? 0),
      ready: Boolean(data[7]),
      expiryTime: Number(data[8] ?? 0),
    };
  }
  if (typeof data === "object") {
    return {
      creator: String(data.creator ?? ""),
      totalAmount: Number(data.totalAmount ?? 0),
      packetCount: Number(data.packetCount ?? 0),
      claimedCount: Number(data.claimedCount ?? 0),
      remainingAmount: Number(data.remainingAmount ?? 0),
      bestLuckAddress: String(data.bestLuckAddress ?? ""),
      bestLuckAmount: Number(data.bestLuckAmount ?? 0),
      ready: Boolean(data.ready ?? false),
      expiryTime: Number(data.expiryTime ?? 0),
    };
  }
  return null;
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

const ensureContractAddress = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await getContractAddress();
  }
  if (!contractAddress.value) {
    throw new Error(t("contractUnavailable"));
  }
  return contractAddress.value;
};

const fetchEnvelopeDetails = async (contract: string, envelopeId: string, eventData?: any): Promise<EnvelopeItem | null> => {
    try {
        const envRes = await invokeRead({
          scriptHash: contract,
          operation: "getEnvelope",
          args: [{ type: "Integer", value: envelopeId }],
        });
        const parsed = parseEnvelopeData(parseInvokeResult(envRes));
        if (!parsed) return null;

        const packetCount = Number(parsed.packetCount || eventData?.packetCount || 0);
        const claimedCount = Number(parsed.claimedCount || 0);
        const remainingPackets = Math.max(0, packetCount - claimedCount);
        const ready = Boolean(parsed.ready);
        const expiryTime = Number(parsed.expiryTime || 0);
        const expired = expiryTime > 0 && Date.now() > expiryTime * 1000;
        const totalAmount = fromFixed8(parsed.totalAmount || eventData?.totalAmount || 0);
        const canClaim = ready && !expired && remainingPackets > 0;
        const creator = parsed.creator || eventData?.creator || "";

        return {
          id: envelopeId,
          creator,
          from: formatHash(creator),
          total: packetCount,
          remaining: remainingPackets,
          totalAmount,
          bestLuckAddress: parsed.bestLuckAddress || undefined,
          bestLuckAmount: parsed.bestLuckAmount || undefined,
          ready,
          expired,
          canClaim,
          // Hydrate description from event if possible, typically description is not on-chain in state but in event
          // For this demo we'll skip description if not available, or fetch from event if we have event list
        } as EnvelopeItem;
    } catch {
        return null;
    }
}

const loadEnvelopes = async () => {
  if (!contractAddress.value) {
    contractAddress.value = await ensureContractAddress();
  }
  if (!contractAddress.value) return;
  loadingEnvelopes.value = true;
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "EnvelopeCreated", limit: 25 });
    const seen = new Set<string>();
    const list = await Promise.all(
      res.events.map(async (evt) => {
        const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
        const envelopeId = String(values[0] ?? "");
        if (!envelopeId || seen.has(envelopeId)) return null;
        seen.add(envelopeId);
        
        return fetchEnvelopeDetails(contractAddress.value!, envelopeId, {
            creator: String(values[1] ?? ""),
            totalAmount: Number(values[2] ?? 0),
            packetCount: Number(values[3] ?? 0)
        });
      }),
    );
    envelopes.value = list.filter(Boolean).sort((a, b) => Number(b!.id) - Number(a!.id)) as EnvelopeItem[];
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  } finally {
    loadingEnvelopes.value = false;
  }
};

const defaultBlessing = computed(() => t("defaultBlessing"));

const create = async () => {
  if (isLoading.value) return;
  try {
    status.value = null;
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("connectWallet"));
    }
    const contract = await ensureContractAddress();

    const totalValue = Number(amount.value);
    const packetCount = Number(count.value);
    if (!Number.isFinite(totalValue) || totalValue < 0.1) throw new Error(t("invalidAmount"));
    if (!Number.isFinite(packetCount) || packetCount < 1 || packetCount > 100) throw new Error(t("invalidPackets"));
    if (totalValue < packetCount * 0.01) throw new Error(t("invalidPerPacket"));

    const expiryValue = Number(expiryHours.value);
    if (!Number.isFinite(expiryValue) || expiryValue <= 0) throw new Error(t("invalidExpiry"));
    const expirySeconds = Math.round(expiryValue * 3600);

    const payment = await payGAS(amount.value, `redenvelope:${count.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error(t("receiptMissing"));
    }

    // Default description to "Best Wishes" if empty
    const finalDescription = description.value.trim() || defaultBlessing.value;

    const tx = await invokeContract({
      scriptHash: contract,
      operation: "createEnvelope",
      args: [
        { type: "Hash160", value: address.value },
        { type: "String", value: name.value || "" },
        { type: "String", value: finalDescription },
        { type: "Integer", value: toFixed8(amount.value) },
        { type: "Integer", value: String(packetCount) },
        { type: "Integer", value: String(expirySeconds) },
        { type: "Integer", value: receiptId },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const createdEvt = txid ? await waitForEvent(txid, "EnvelopeCreated") : null;
    if (!createdEvt) {
      throw new Error(t("envelopePending"));
    }

    status.value = { msg: t("envelopeSent"), type: "success" };
    name.value = "";
    description.value = "";
    amount.value = "";
    count.value = "";
    await loadEnvelopes();
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  }
};

const handleConnect = async () => {
  try {
    await connect();
  } catch {
  }
};

const claim = async (env: EnvelopeItem, fromModal = false) => {
  if (openingId.value) return;
  
  if (!address.value) {
      await connect();
      if (!address.value) return; // User cancelled
  }
  
  try {
    status.value = null;
    const contract = await ensureContractAddress();

    if (env.expired) throw new Error(t("envelopeExpired"));
    if (!env.ready) throw new Error(t("envelopeNotReady"));
    if (env.remaining <= 0) throw new Error(t("envelopeEmpty"));

    const hasClaimedRes = await invokeRead({
      scriptHash: contract,
      operation: "hasClaimed",
      args: [
        { type: "Integer", value: env.id },
        { type: "Hash160", value: address.value },
      ],
    });
    if (Boolean(parseInvokeResult(hasClaimedRes))) {
      throw new Error(t("alreadyClaimed"));
    }

    openingId.value = env.id;
    const tx = await invokeContract({
      scriptHash: contract,
      operation: "claim",
      args: [
        { type: "Integer", value: env.id },
        { type: "Hash160", value: address.value },
      ],
    });

    const txid = String((tx as any)?.txid || (tx as any)?.txHash || "");
    const claimedEvt = txid ? await waitForEvent(txid, "EnvelopeClaimed") : null;
    if (!claimedEvt) {
      throw new Error(t("claimPending"));
    }
    const values = Array.isArray((claimedEvt as any)?.state) ? (claimedEvt as any).state.map(parseStackItem) : [];
    const claimedAmount = fromFixed8(Number(values[2] ?? 0));
    const remaining = Number(values[3] ?? env.remaining);

    // Close the opening modal if open
    showOpeningModal.value = false;

    // Show lucky result
    luckyMessage.value = {
      amount: Number(claimedAmount.toFixed(2)),
      from: env.from,
    };

    env.remaining = Math.max(0, remaining);
    env.canClaim = env.remaining > 0 && env.ready && !env.expired;

    status.value = { msg: t("claimedFrom").replace("{0}", env.from), type: "success" };
    
    // Refresh list
    await loadEnvelopes();
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
    // Close opening modal on error to show the toast
    showOpeningModal.value = false;
  } finally {
    openingId.value = null;
  }
};

const handleShare = (env: EnvelopeItem) => {
  const url = `${window.location.origin}${window.location.pathname}?id=${env.id}`;
  uni.setClipboardData({
    data: url,
    success: () => {
      status.value = { msg: t("copied"), type: "success" };
      setTimeout(() => { status.value = null }, 2000);
    }
  });
};

const openFromList = (env: EnvelopeItem) => {
  openingEnvelope.value = env;
  showOpeningModal.value = true;
};

onMounted(async () => {
  await loadEnvelopes();
  
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
        // Try to find in loaded list first
        const found = envelopes.value.find(e => e.id === id);
        if (found) {
            openFromList(found);
            activeTab.value = "claim";
        } else {
            // Fetch specifically
            const contract = await ensureContractAddress();
            const env = await fetchEnvelopeDetails(contract, id);
            if (env) {
                openingEnvelope.value = env;
                showOpeningModal.value = true;
                activeTab.value = "claim";
            }
        }
    }
  }
});

watch(activeTab, async (tab) => {
  if (tab === "claim") {
    await loadEnvelopes();
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$premium-red: #c0392b;
$premium-red-dark: #922b21;
$gold-light: #f9e79f;
$gold: #f1c40f;
$gold-dark: #d4ac0d;

.app-container {
  padding: 80px 20px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: radial-gradient(circle at 50% 30%, $premium-red 0%, $premium-red-dark 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -20%;
    left: 50%;
    transform: translateX(-50%);
    width: 150%;
    height: 50%;
    background: radial-gradient(circle, #e74c3c 0%, transparent 70%);
    opacity: 0.6;
    z-index: 0;
    filter: blur(40px);
  }

  /* Decorative gold pattern overlay (subtle) */
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: 
      radial-gradient($gold 1px, transparent 1px),
      radial-gradient($gold 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: 0 0, 20px 20px;
    opacity: 0.05;
    pointer-events: none;
    z-index: 0;
  }
}

.tab-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
