<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">
            {{ t("switchToNeo") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'create'" class="tab-content scrollable">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-3 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard variant="erobo-neo">
        <view class="form-group">
          <view class="input-group">
            <text class="input-label">{{ t("bountyLabel") }}</text>
            <NeoInput v-model="bounty" type="number" :placeholder="t('bountyPlaceholder')" suffix="GAS" />
            <text class="helper-text">{{ t("minBountyNote") }}</text>
          </view>

          <view class="input-group">
            <text class="input-label">{{ t("titleLabel") }}</text>
            <NeoInput v-model="vaultTitle" :placeholder="t('titlePlaceholder')" />
          </view>

          <view class="input-group">
            <text class="input-label">{{ t("descriptionLabel") }}</text>
            <NeoInput v-model="vaultDescription" :placeholder="t('descriptionPlaceholder')" type="textarea" />
          </view>

          <view class="input-group">
            <text class="input-label">{{ t("difficultyLabel") }}</text>
            <view class="difficulty-actions">
              <NeoButton size="sm" :variant="vaultDifficulty === 1 ? 'primary' : 'secondary'" @click="vaultDifficulty = 1">
                {{ t("difficultyEasy") }}
              </NeoButton>
              <NeoButton size="sm" :variant="vaultDifficulty === 2 ? 'primary' : 'secondary'" @click="vaultDifficulty = 2">
                {{ t("difficultyMedium") }}
              </NeoButton>
              <NeoButton size="sm" :variant="vaultDifficulty === 3 ? 'primary' : 'secondary'" @click="vaultDifficulty = 3">
                {{ t("difficultyHard") }}
              </NeoButton>
            </view>
          </view>

          <view class="input-group">
            <text class="input-label">{{ t("secretLabel") }}</text>
            <NeoInput v-model="secret" :placeholder="t('secretPlaceholder')" />
          </view>

          <view class="input-group">
            <text class="input-label">{{ t("confirmSecretLabel") }}</text>
            <NeoInput v-model="secretConfirm" :placeholder="t('confirmSecretPlaceholder')" />
            <text v-if="secretMismatch" class="helper-text text-danger">{{ t("secretMismatch") }}</text>
          </view>

          <view v-if="secretHash" class="hash-preview">
            <text class="hash-label">{{ t("hashPreview") }}</text>
            <text class="hash-value">{{ secretHash }}</text>
          </view>

          <NeoButton
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="!canCreate || isLoading"
            @click="createVault"
          >
            {{ isLoading ? t("creating") : t("createVault") }}
          </NeoButton>

          <text class="helper-text">{{ t("secretNote") }}</text>
        </view>
      </NeoCard>

      <NeoCard v-if="createdVaultId" variant="erobo" class="vault-created">
        <text class="vault-created-label">{{ t("vaultCreated") }}</text>
        <text class="vault-created-id">#{{ createdVaultId }}</text>
      </NeoCard>

      <NeoCard v-if="myVaults.length > 0" variant="erobo" class="recent-vaults mt-4">
        <text class="section-title">{{ t("myVaults") }}</text>
        <view class="vault-list">
          <view
            v-for="vault in myVaults"
            :key="vault.id"
            class="vault-item"
            @click="selectVault(vault.id)"
          >
            <view class="vault-meta">
              <text class="vault-id">#{{ vault.id }}</text>
              <text class="vault-bounty">{{ formatGas(vault.bounty) }} GAS</text>
            </view>
            <text class="vault-creator text-xs opacity-50">{{ new Date(vault.created).toLocaleDateString() }}</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'break'" class="tab-content scrollable">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-3 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard variant="erobo-neo">
        <view class="form-group">
          <view class="input-group">
            <text class="input-label">{{ t("vaultIdLabel") }}</text>
            <NeoInput v-model="vaultIdInput" type="number" :placeholder="t('vaultIdPlaceholder')" />
          </view>

          <NeoButton variant="secondary" block :loading="isLoading" @click="loadVault">
            {{ t("loadVault") }}
          </NeoButton>

          <view class="input-group">
            <text class="input-label">{{ t("secretAttemptLabel") }}</text>
            <NeoInput v-model="attemptSecret" :placeholder="t('secretAttemptPlaceholder')" />
          </view>

          <text class="helper-text">{{ t("attemptFeeNote").replace("{fee}", attemptFeeDisplay) }}</text>

          <NeoButton
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="!canAttempt || isLoading"
            @click="attemptBreak"
          >
            {{ isLoading ? t("attempting") : t("attemptBreak") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard v-if="vaultDetails" variant="erobo" class="vault-details">
        <view class="vault-detail-row">
          <text class="detail-label">{{ t("vaultStatus") }}</text>
          <text class="detail-value">{{ vaultDetails.broken ? t("broken") : t("active") }}</text>
        </view>
        <view class="vault-detail-row">
          <text class="detail-label">{{ t("creator") }}</text>
          <text class="detail-value mono">{{ formatAddress(vaultDetails.creator) }}</text>
        </view>
        <view class="vault-detail-row">
          <text class="detail-label">{{ t("bountyLabel") }}</text>
          <text class="detail-value">{{ formatGas(vaultDetails.bounty) }} GAS</text>
        </view>
        <view class="vault-detail-row">
          <text class="detail-label">{{ t("attempts") }}</text>
          <text class="detail-value">{{ vaultDetails.attempts }}</text>
        </view>
        <view class="vault-detail-row" v-if="vaultDetails.broken">
          <text class="detail-label">{{ t("winner") }}</text>
          <text class="detail-value mono">{{ formatAddress(vaultDetails.winner) }}</text>
        </view>
      </NeoCard>

      <NeoCard variant="erobo" class="recent-vaults">
        <text class="section-title">{{ t("recentVaults") }}</text>
        <view v-if="recentVaults.length === 0" class="empty-state">
          <text class="empty-text">{{ t("noRecentVaults") }}</text>
        </view>
        <view v-else class="vault-list">
          <view
            v-for="vault in recentVaults"
            :key="vault.id"
            class="vault-item"
            @click="selectVault(vault.id)"
          >
            <view class="vault-meta">
              <text class="vault-id">#{{ vault.id }}</text>
              <text class="vault-bounty">{{ formatGas(vault.bounty) }} GAS</text>
            </view>
            <text class="vault-creator mono">{{ formatAddress(vault.creator) }}</text>
          </view>
        </view>
      </NeoCard>
    </view>

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
import { sha256Hex } from "@/shared/utils/hash";
import { normalizeScriptHash, parseInvokeResult, parseStackItem, addressToScriptHash } from "@/shared/utils/neo";
import { bytesToHex, formatAddress } from "@/shared/utils/format";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";


const { t } = useI18n();

const APP_ID = "miniapp-unbreakablevault";
const MIN_BOUNTY = 1;
const ATTEMPT_FEE = 0.1;

const { address, connect, chainType, switchChain, invokeContract, invokeRead, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref("create");
const navTabs = computed(() => [
  { id: "create", icon: "lock", label: t("create") },
  { id: "break", icon: "key", label: t("break") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const status = ref<{ msg: string; type: "success" | "error" } | null>(null);

const bounty = ref("");
const vaultTitle = ref("");
const vaultDescription = ref("");
const vaultDifficulty = ref(1);
const secret = ref("");
const secretConfirm = ref("");
const secretHash = ref("");
const createdVaultId = ref<string | null>(null);

const vaultIdInput = ref("");
const attemptSecret = ref("");
const vaultDetails = ref<{
  id: string;
  creator: string;
  bounty: number;
  attempts: number;
  broken: boolean;
  winner: string;
  attemptFee: number;
} | null>(null);

const recentVaults = ref<{ id: string; creator: string; bounty: number }[]>([]);
const myVaults = ref<{ id: string; bounty: number; created: number }[]>([]);

const secretMismatch = computed(() => {
  if (!secretConfirm.value) return false;
  return secret.value !== secretConfirm.value;
});

const canCreate = computed(() => {
  const amount = Number.parseFloat(bounty.value);
  return amount >= MIN_BOUNTY && vaultTitle.value.trim() && secret.value.trim() && !secretMismatch.value;
});

const canAttempt = computed(() => {
  return Boolean(
    vaultIdInput.value &&
      attemptSecret.value.trim() &&
      vaultDetails.value &&
      String(vaultDetails.value.id) === String(vaultIdInput.value) &&
      !vaultDetails.value.broken,
  );
});

const toNumber = (value: unknown) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

const formatGas = (amount: number) => (amount / 1e8).toFixed(2);
const attemptFeeDisplay = computed(() => {
  const fallback = Math.floor(ATTEMPT_FEE * 1e8);
  const fee = vaultDetails.value?.attemptFee ?? fallback;
  return formatGas(fee);
});
const toHex = (value: string) => {
  if (!value) return "";
  if (typeof TextEncoder === "undefined") {
    return Array.from(value)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");
  }
  return bytesToHex(new TextEncoder().encode(value));
};

const ensureContractAddress = async () => {
  const contract = await getContractAddress();
  if (!contract) throw new Error(t("contractUnavailable"));
  return contract;
};

const loadRecentVaults = async () => {
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "VaultCreated", limit: 12 });
    const vaults = res.events
      .map((evt: any) => {
        const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
        const id = String(values[0] ?? "");
        const creator = String(values[1] ?? "");
        const bountyValue = Number(values[2] ?? 0);
        if (!id) return null;
        return { id, creator, bounty: bountyValue };
      })
      .filter(Boolean) as { id: string; creator: string; bounty: number }[];
    recentVaults.value = vaults;
  } catch {
  }
};

const loadMyVaults = async () => {
  if (!address.value) {
    myVaults.value = [];
    return;
  }
  try {
    const res = await listEvents({ app_id: APP_ID, event_name: "VaultCreated", limit: 50 });
    const myHash = normalizeScriptHash(addressToScriptHash(address.value));

    const vaults = res.events
      .map((evt: any) => {
        const values = Array.isArray(evt?.state) ? evt.state.map(parseStackItem) : [];
        const id = String(values[0] ?? "");
        const creator = String(values[1] ?? "");
        const bountyValue = Number(values[2] ?? 0);
        
        const creatorHash = normalizeScriptHash(addressToScriptHash(creator));
        
        if (!id || creatorHash !== myHash) return null;
        
        return { 
          id, 
          bounty: bountyValue,
          created: evt.created_at ? new Date(evt.created_at).getTime() : Date.now()
        };
      })
      .filter(Boolean) as { id: string; bounty: number; created: number }[];
      
    myVaults.value = vaults.sort((a, b) => b.created - a.created);
  } catch {
  }
};

const createVault = async () => {
  if (!canCreate.value || isLoading.value) return;
  status.value = null;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractAddress();

    const amount = Number.parseFloat(bounty.value);
    const bountyInt = Math.floor(amount * 1e8);
    const hash = secretHash.value || (await sha256Hex(secret.value));

    const payment = await payGAS(String(amount), `vault:create:${hash.slice(0, 10)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const res = await invokeContract({
      scriptHash: contract,
      operation: "createVault",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: hash },
        { type: "Integer", value: String(bountyInt) },
        { type: "Integer", value: String(vaultDifficulty.value) },
        { type: "String", value: vaultTitle.value.trim().slice(0, 100) },
        { type: "String", value: vaultDescription.value.trim().slice(0, 300) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const vaultId = String((res as any)?.result || (res as any)?.stack?.[0]?.value || "");
    createdVaultId.value = vaultId || createdVaultId.value;
    status.value = { msg: t("vaultCreated"), type: "success" };
    bounty.value = "";
    vaultTitle.value = "";
    vaultDescription.value = "";
    vaultDifficulty.value = 1;
    secret.value = "";
    secretConfirm.value = "";
    await loadRecentVaults();
    await loadMyVaults();
  } catch (e: any) {
    status.value = { msg: e?.message || t("vaultCreateFailed"), type: "error" };
  }
};

const loadVault = async () => {
  if (!vaultIdInput.value) return;
  status.value = null;
  try {
    const contract = await ensureContractAddress();
    const res = await invokeRead({
      contractAddress: contract,
      operation: "getVaultDetails",
      args: [{ type: "Integer", value: vaultIdInput.value }],
    });
    const parsed = parseInvokeResult(res);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(t("vaultNotFound"));
    }
    const data = parsed as Record<string, unknown>;
    const creator = String(data.creator || "");
    const creatorHash = normalizeScriptHash(creator);
    if (!creatorHash || /^0+$/.test(creatorHash)) {
      throw new Error(t("vaultNotFound"));
    }
    vaultDetails.value = {
      id: vaultIdInput.value,
      creator,
      bounty: toNumber(data.bounty),
      attempts: toNumber(data.attemptCount),
      broken: Boolean(data.broken),
      winner: String(data.winner || ""),
      attemptFee: toNumber(data.attemptFee),
    };
  } catch (e: any) {
    status.value = { msg: e?.message || t("loadFailed"), type: "error" };
    vaultDetails.value = null;
  }
};

const attemptBreak = async () => {
  if (!canAttempt.value || isLoading.value) return;
  status.value = null;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractAddress();

    const feeBase = vaultDetails.value?.attemptFee ?? Math.floor(ATTEMPT_FEE * 1e8);
    const payment = await payGAS(formatGas(feeBase), `vault:attempt:${vaultIdInput.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    const res = await invokeContract({
      scriptHash: contract,
      operation: "attemptBreak",
      args: [
        { type: "Integer", value: vaultIdInput.value },
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: toHex(attemptSecret.value) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    const success = Boolean((res as any)?.stack?.[0]?.value ?? (res as any)?.result);
    status.value = {
      msg: success ? t("broken") : t("vaultAttemptFailed"),
      type: success ? "success" : "error",
    };

    attemptSecret.value = "";
    await loadVault();
    await loadRecentVaults();
  } catch (e: any) {
    status.value = { msg: e?.message || t("vaultAttemptFailed"), type: "error" };
  }
};

const selectVault = (id: string) => {
  vaultIdInput.value = id;
  loadVault();
};

watch(secret, async (value) => {
  secretHash.value = value ? await sha256Hex(value) : "";
});

onMounted(() => {
  loadRecentVaults();
  loadMyVaults();
});

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');

$safe-bg: #e0e5ec;
$safe-shadow-light: #ffffff;
$safe-shadow-dark: #a3b1c6;
$safe-text: #4a5568;
$safe-font: 'Montserrat', sans-serif;

:global(page) {
  background: $safe-bg;
  font-family: $safe-font;
}

.app-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100vh;
  gap: 16px;
  background-color: $safe-bg;
  font-family: $safe-font;
  /* Brushed Metal Texture */
  background-image: 
    linear-gradient(90deg, rgba(255,255,255,0.05) 0%, transparent 100%),
    repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 10px);
}

.tab-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Safe Component Overrides (Neumorphism) */
:deep(.neo-card) {
  background: $safe-bg !important;
  border-radius: 20px !important;
  box-shadow: 9px 9px 16px $safe-shadow-dark, -9px -9px 16px $safe-shadow-light !important;
  color: $safe-text !important;
  border: none !important;
  padding: 24px !important;
  
  &.variant-danger {
    background: #ffe3e3 !important;
    box-shadow: 5px 5px 10px #d1a3a3, -5px -5px 10px #ffffff !important;
    color: #c53030 !important;
  }
}

:deep(.neo-button) {
  border-radius: 50px !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em;
  color: $safe-text !important;
  transition: all 0.2s ease;
  
  &.variant-primary {
    background: linear-gradient(145deg, #e0e5ec, #ffffff);
    box-shadow: 5px 5px 10px $safe-shadow-dark, -5px -5px 10px $safe-shadow-light !important;
    border: none !important;
    color: #2d3748 !important; 
    
    &:active {
      box-shadow: inset 5px 5px 10px $safe-shadow-dark, inset -5px -5px 10px $safe-shadow-light !important;
    }
  }
  
  &.variant-secondary {
    background: $safe-bg !important;
    box-shadow: 5px 5px 10px $safe-shadow-dark, -5px -5px 10px $safe-shadow-light !important;
    border: none !important;
    
    &:active {
      box-shadow: inset 5px 5px 10px $safe-shadow-dark, inset -5px -5px 10px $safe-shadow-light !important;
    }
  }
}

:deep(input), :deep(.neo-input) {
  background: $safe-bg !important;
  border-radius: 12px !important;
  box-shadow: inset 5px 5px 10px $safe-shadow-dark, inset -5px -5px 10px $safe-shadow-light !important;
  border: none !important;
  color: #2d3748 !important;
  padding: 12px 16px !important;
  
  &:focus {
    box-shadow: inset 2px 2px 5px $safe-shadow-dark, inset -2px -2px 5px $safe-shadow-light !important;
    color: #1a202c !important;
  }
}

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }

.form-group { display: flex; flex-direction: column; gap: 24px; }
.input-group { display: flex; flex-direction: column; gap: 12px; }

.difficulty-actions { display: flex; gap: 12px; flex-wrap: wrap; }
/* Override buttons in difficulty to look like toggles */
.difficulty-actions :deep(.neo-button) {
  flex: 1;
  min-width: 80px;
}

.input-label {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: #718096;
  margin-left: 4px;
  letter-spacing: 0.05em;
}

.helper-text {
  font-size: 12px;
  color: #a0aec0;
  margin-left: 8px;
  margin-top: 4px;
}

.hash-preview {
  padding: 16px;
  border-radius: 12px;
  background: $safe-bg;
  box-shadow: inset 3px 3px 7px $safe-shadow-dark, inset -3px -3px 7px $safe-shadow-light;
}

.hash-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 6px;
  color: #718096;
}

.hash-value {
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  word-break: break-all;
  color: #4a5568;
}

.vault-created { text-align: center; }
.vault-created-label { font-size: 12px; text-transform: uppercase; color: #718096; }
.vault-created-id { font-size: 32px; font-weight: 800; color: #2d3748; margin-top: 8px; }

.vault-details { display: flex; flex-direction: column; gap: 16px; }
.vault-detail-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(160, 174, 192, 0.2); padding-bottom: 8px; }
.vault-detail-row:last-child { border-bottom: none; }

.detail-label { font-size: 12px; text-transform: uppercase; color: #718096; }
.detail-value { font-weight: 700; font-size: 14px; color: #2d3748; }

.mono { font-family: 'Fira Code', monospace; }

.recent-vaults { display: flex; flex-direction: column; gap: 16px; }
.section-title { font-size: 14px; font-weight: 800; color: #4a5568; margin-bottom: 8px; }

.vault-list { display: flex; flex-direction: column; gap: 16px; }

.vault-item {
  padding: 16px;
  border-radius: 16px;
  background: $safe-bg;
  box-shadow: 5px 5px 10px $safe-shadow-dark, -5px -5px 10px $safe-shadow-light;
  cursor: pointer;
  transition: transform 0.1s;
  
  &:active {
    box-shadow: inset 3px 3px 7px $safe-shadow-dark, inset -3px -3px 7px $safe-shadow-light;
    transform: scale(0.99);
  }
}

.vault-meta { display: flex; justify-content: space-between; font-weight: 700; }
.vault-id { font-size: 14px; color: #2d3748; }
.vault-bounty { font-size: 14px; color: #38a169; }
.vault-creator { font-size: 12px; color: #a0aec0; margin-top: 6px; }

.empty-state { text-align: center; padding: 24px; opacity: 0.5; }
.empty-text { font-size: 13px; font-style: italic; }
</style>
