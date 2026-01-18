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

    <view class="app-container">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <view v-if="activeTab === 'identity'" class="tab-content">
        <NeoCard variant="erobo-neo">
          <view class="form-group">
            <view class="input-group">
              <text class="input-label">{{ t("identitySeed") }}</text>
              <NeoInput v-model="identitySeed" :placeholder="t('identityPlaceholder')" />
            </view>
            <view class="input-group">
              <text class="input-label">{{ t("maskTypeLabel") }}</text>
              <view class="mask-type-actions">
                <NeoButton size="sm" :variant="maskType === 1 ? 'primary' : 'secondary'" @click="maskType = 1">
                  {{ t("maskTypeBasic") }}
                </NeoButton>
                <NeoButton size="sm" :variant="maskType === 2 ? 'primary' : 'secondary'" @click="maskType = 2">
                  {{ t("maskTypeCipher") }}
                </NeoButton>
                <NeoButton size="sm" :variant="maskType === 3 ? 'primary' : 'secondary'" @click="maskType = 3">
                  {{ t("maskTypePhantom") }}
                </NeoButton>
              </view>
            </view>

            <view v-if="identityHash" class="hash-preview">
              <text class="hash-label">{{ t("hashPreview") }}</text>
              <text class="hash-value">{{ identityHash }}</text>
            </view>

            <NeoButton
              variant="primary"
              block
              :loading="isLoading"
              :disabled="!canCreateMask || isLoading"
              @click="createMask"
            >
              {{ isLoading ? t("creatingMask") : t("createNewMask") }}
            </NeoButton>
            <text class="helper-text">{{ t("maskFeeNote") }}</text>
          </view>
        </NeoCard>

        <NeoCard variant="erobo">
          <text class="section-title">{{ t("yourMasks") }}</text>
          <view v-if="masks.length === 0" class="empty-state">
            <text class="empty-text">{{ t("noMasks") }}</text>
          </view>
          <view v-else class="mask-list">
            <view
              v-for="mask in masks"
              :key="mask.id"
              :class="['mask-item', selectedMaskId === mask.id && 'active']"
              @click="selectedMaskId = mask.id"
            >
              <view class="mask-header">
                <text class="mask-id">#{{ mask.id }}</text>
                <text :class="['mask-status', mask.active ? 'active' : 'inactive']">
                  {{ mask.active ? t("active") : t("inactive") }}
                </text>
              </view>
              <text class="mask-hash mono">{{ mask.identityHash }}</text>
              <text class="mask-time">{{ mask.createdAt }}</text>
            </view>
          </view>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'vote'" class="tab-content">
        <NeoCard variant="erobo-neo">
          <view class="form-group">
            <view class="input-group">
              <text class="input-label">{{ t("proposalId") }}</text>
              <NeoInput v-model="proposalId" type="number" :placeholder="t('proposalPlaceholder')" />
            </view>

            <view class="input-group">
              <text class="input-label">{{ t("selectMask") }}</text>
              <view class="mask-picker">
                <view
                  v-for="mask in masks"
                  :key="mask.id"
                  :class="['mask-chip', selectedMaskId === mask.id && 'active']"
                  @click="selectedMaskId = mask.id"
                >
                  #{{ mask.id }}
                </view>
              </view>
            </view>

            <view class="vote-actions">
              <NeoButton variant="primary" size="lg" :disabled="!canVote" @click="submitVote(1)">
                {{ t("for") }}
              </NeoButton>
              <NeoButton variant="danger" size="lg" :disabled="!canVote" @click="submitVote(2)">
                {{ t("against") }}
              </NeoButton>
              <NeoButton variant="secondary" size="lg" :disabled="!canVote" @click="submitVote(3)">
                {{ t("abstain") }}
              </NeoButton>
            </view>
          </view>
        </NeoCard>
      </view>
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
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoInput from "@/shared/components/NeoInput.vue";

const { t } = useI18n();
const APP_ID = "miniapp-masqueradedao";
const MASK_FEE = 0.1;
const VOTE_FEE = 0.01;

const { address, connect, chainType, switchChain, invokeContract, invokeRead, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref("identity");
const navTabs = computed(() => [
  { id: "identity", label: t("identity"), icon: "👤" },
  { id: "vote", label: t("vote"), icon: "🗳️" },
  { id: "docs", icon: "book", label: t("docs") },
]);

const identitySeed = ref("");
const identityHash = ref("");
const maskType = ref(1);
const proposalId = ref("");
const selectedMaskId = ref<string | null>(null);
const status = ref<{ msg: string; type: "success" | "error" } | null>(null);

const masks = ref<{ id: string; identityHash: string; active: boolean; createdAt: string }[]>([]);

const canCreateMask = computed(() => Boolean(identitySeed.value.trim()));
const canVote = computed(() => Boolean(proposalId.value && selectedMaskId.value));

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const ensureContractAddress = async () => {
  const contract = await getContractAddress();
  if (!contract) throw new Error(t("contractUnavailable"));
  return contract;
};

const ownerMatches = (value: unknown) => {
  if (!address.value) return false;
  const val = String(value || "");
  if (val === address.value) return true;
  const normalized = normalizeScriptHash(val);
  const addrHash = addressToScriptHash(address.value);
  return Boolean(normalized && addrHash && normalized === addrHash);
};

const loadMasks = async () => {
  if (!address.value) return;
  try {
    const contract = await ensureContractAddress();
    const events = await listEvents({ app_id: APP_ID, event_name: "MaskCreated", limit: 50 });
    const owned = events.events
      .map((evt) => {
        const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
        const id = String(values[0] ?? "");
        const owner = values[1];
        if (!id || !ownerMatches(owner)) return null;
        return { id, createdAt: evt.created_at };
      })
      .filter(Boolean) as { id: string; createdAt?: string }[];

    const details = await Promise.all(
      owned.map(async (mask) => {
        const res = await invokeRead({
          contractAddress: contract,
          operation: "getMask",
          args: [{ type: "Integer", value: mask.id }],
        });
        const parsed = parseInvokeResult(res);
        const values = Array.isArray(parsed) ? parsed : [];
        const owner = String(values[0] ?? "");
        const identity = String(values[1] ?? "");
        const createdAt = mask.createdAt ? new Date(mask.createdAt).toLocaleString() : "--";
        const active = Boolean(values[9]);
        if (!owner || /^0+$/.test(normalizeScriptHash(owner))) return null;
        return { id: mask.id, identityHash: identity, active, createdAt };
      }),
    );

    masks.value = details.filter(Boolean) as typeof masks.value;
    if (!selectedMaskId.value && masks.value.length > 0) {
      selectedMaskId.value = masks.value[0].id;
    }
  } catch {
  }
};

const createMask = async () => {
  if (!canCreateMask.value || isLoading.value) return;
  status.value = null;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("connectWallet"));
    const contract = await ensureContractAddress();
    const hash = identityHash.value || (await sha256Hex(identitySeed.value));
    const payment = await payGAS(String(MASK_FEE), `mask:create:${hash.slice(0, 8)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));

    await invokeContract({
      contractAddress: contract,
      operation: "createMask",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "ByteArray", value: hash },
        { type: "Integer", value: String(maskType.value) },
        { type: "Integer", value: String(receiptId) },
      ],
    });

    status.value = { msg: t("maskCreated"), type: "success" };
    identitySeed.value = "";
    identityHash.value = "";
    await loadMasks();
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  }
};

const submitVote = async (choice: number) => {
  if (!canVote.value) return;
  status.value = null;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("connectWallet"));
    if (!selectedMaskId.value) throw new Error(t("selectMaskFirst"));
    const contract = await ensureContractAddress();
    const payment = await payGAS(String(VOTE_FEE), `vote:${proposalId.value}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) throw new Error(t("receiptMissing"));
    await invokeContract({
      contractAddress: contract,
      operation: "submitVote",
      args: [
        { type: "Integer", value: proposalId.value },
        { type: "Integer", value: selectedMaskId.value },
        { type: "Integer", value: String(choice) },
        { type: "Integer", value: String(receiptId) },
      ],
    });
    status.value = { msg: t("voteCast"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e?.message || t("error"), type: "error" };
  }
};

watch(identitySeed, async (value) => {
  identityHash.value = value ? await sha256Hex(value) : "";
});

watch(address, (value) => {
  if (value) {
    loadMasks();
  }
});

onMounted(() => {
  loadMasks();
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$mask-bg: #09090b;
$mask-purple: #8b5cf6;
$mask-gold: #fbbf24;
$mask-velvet: #4c1d95;
$mask-text: #f4f4f5;

:global(page) {
  background: $mask-bg;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100vh;
  background-color: $mask-bg;
  /* Velvet Pattern */
  background-image: 
    radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.15), transparent 70%),
    linear-gradient(0deg, rgba(0,0,0,0.8), transparent 50%),
    url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMTM5LDkyLDI0NiwwLjEpIi8+PC9zdmc+');
}

.tab-content {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Mask Component Overrides */
:deep(.neo-card) {
  background: rgba(24, 24, 27, 0.8) !important;
  border: 1px solid rgba(139, 92, 246, 0.2) !important;
  border-radius: 16px !important;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5) !important;
  backdrop-filter: blur(12px);
  color: $mask-text !important;
  
  /* Gold Trim */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 80%; height: 1px;
    background: linear-gradient(90deg, transparent, $mask-gold, transparent);
    opacity: 0.3;
  }
}

:deep(.neo-button) {
  border-radius: 8px !important;
  font-family: 'Cinzel', serif !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700 !important;
  
  &.variant-primary {
    background: linear-gradient(135deg, $mask-purple, $mask-velvet) !important;
    border: 1px solid rgba(139, 92, 246, 0.5) !important;
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3) !important;
    color: #fff !important;
    
    &:active {
      transform: scale(0.98);
      box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2) !important;
    }
  }
  
  &.variant-secondary {
    background: rgba(255, 255, 255, 0.05) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #d4d4d8 !important;
  }
  
  &.variant-danger {
    background: rgba(220, 38, 38, 0.2) !important;
    border: 1px solid rgba(220, 38, 38, 0.5) !important;
    color: #f87171 !important;
  }
}

:deep(input), :deep(.neo-input) {
  background: rgba(0, 0, 0, 0.3) !important;
  border: 1px solid rgba(139, 92, 246, 0.2) !important;
  color: #fff !important;
  border-radius: 8px !important;
  
  &:focus {
    border-color: $mask-purple !important;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2) !important;
  }
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 11px;
  margin: 16px 24px 0;
  backdrop-filter: blur(10px);
  letter-spacing: 0.05em;

  &.success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    color: #34d399;
  }
  &.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: #f87171;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mask-type-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #a1a1aa;
  margin-left: 4px;
}

.helper-text {
  font-size: 11px;
  color: #71717a;
  text-align: center;
  font-style: italic;
}

.hash-preview {
  padding: 16px;
  border: 1px dashed rgba(139, 92, 246, 0.3);
  border-radius: 8px;
  background: rgba(139, 92, 246, 0.05);
}

.hash-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 6px;
  color: $mask-purple;
}

.hash-value {
  font-family: 'Fira Code', monospace;
  font-size: 11px;
  word-break: break-all;
  color: #e4e4e7;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: $mask-gold;
  margin-bottom: 16px;
  display: block;
  text-align: center;
  font-family: 'Cinzel', serif;
}

.empty-state {
  text-align: center;
  padding: 32px;
  background: rgba(255,255,255,0.02);
  border-radius: 8px;
}

.empty-text {
  font-size: 12px;
  opacity: 0.5;
  font-style: italic;
}

.mask-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mask-item {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    border-color: $mask-purple;
    background: rgba(139, 92, 246, 0.1);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.15);
  }
  
  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.05);
  }
}

.mask-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mask-id {
  font-weight: 700;
  color: $mask-gold;
  font-family: 'Cinzel', serif;
}

.mask-status {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.mask-status.active {
  background: rgba(16, 185, 129, 0.1);
  color: #34d399;
}

.mask-status.inactive {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.mask-hash {
  font-size: 10px;
  word-break: break-all;
  color: #a1a1aa;
}

.mask-time {
  margin-top: 8px;
  font-size: 10px;
  color: #52525b;
}

.mask-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 8px;
}

.mask-chip {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  font-size: 11px;
  cursor: pointer;
  color: #d4d4d8;
  font-family: 'Cinzel', serif;

  &.active {
    border-color: $mask-purple;
    background: rgba(139, 92, 246, 0.2);
    color: #fff;
    box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
  }
}

.vote-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.mono {
  font-family: 'Fira Code', monospace;
}
</style>
