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

            <view class="input-group">
              <text class="input-label">{{ t("zkProof") }}</text>
              <NeoInput v-model="proof" :placeholder="t('proofPlaceholder')" />
            </view>

            <view class="vote-actions">
              <NeoButton variant="primary" size="lg" :disabled="!canVote" @click="submitVote(true)">
                {{ t("for") }}
              </NeoButton>
              <NeoButton variant="danger" size="lg" :disabled="!canVote" @click="submitVote(false)">
                {{ t("against") }}
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
import { createT } from "@/shared/utils/i18n";
import { sha256Hex } from "@/shared/utils/hash";
import { addressToScriptHash, normalizeScriptHash, parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoInput from "@/shared/components/NeoInput.vue";

const translations = {
  title: { en: "Masquerade DAO", zh: "假面DAO" },
  identity: { en: "Identity", zh: "身份" },
  vote: { en: "Vote", zh: "投票" },
  docs: { en: "Docs", zh: "文档" },
  identitySeed: { en: "Identity Seed", zh: "身份种子" },
  identityPlaceholder: { en: "Enter a secret seed", zh: "输入身份种子" },
  hashPreview: { en: "Identity Hash", zh: "身份哈希" },
  createNewMask: { en: "Create Mask", zh: "创建面具" },
  creatingMask: { en: "Creating mask...", zh: "创建面具中..." },
  maskFeeNote: { en: "Mask fee: 0.1 GAS", zh: "面具费用：0.1 GAS" },
  maskCreated: { en: "Mask created!", zh: "面具已创建！" },
  yourMasks: { en: "Your Masks", zh: "您的面具" },
  noMasks: { en: "No masks yet", zh: "暂无面具" },
  active: { en: "Active", zh: "可用" },
  inactive: { en: "Inactive", zh: "不可用" },
  proposalId: { en: "Proposal ID", zh: "提案编号" },
  proposalPlaceholder: { en: "Enter proposal ID", zh: "输入提案编号" },
  selectMask: { en: "Select Mask", zh: "选择面具" },
  zkProof: { en: "Proof (optional)", zh: "证明（可选）" },
  proofPlaceholder: { en: "Leave empty if not required", zh: "如无需证明可留空" },
  for: { en: "For", zh: "支持" },
  against: { en: "Against", zh: "反对" },
  voteCast: { en: "Vote submitted", zh: "投票已提交" },
  selectMaskFirst: { en: "Select a mask first", zh: "请先选择面具" },
  connectWallet: { en: "Connect wallet", zh: "请连接钱包" },
  receiptMissing: { en: "Payment receipt missing", zh: "支付凭证缺失" },
  contractUnavailable: { en: "Contract unavailable", zh: "合约不可用" },

  docSubtitle: {
    en: "Anonymous governance voting with cryptographic identity masks",
    zh: "使用加密身份面具的匿名治理投票",
  },
  docDescription: {
    en: "Masquerade DAO lets you create cryptographic masks and vote without revealing your identity. Votes are recorded on-chain while the identity remains hidden.",
    zh: "Masquerade DAO 允许创建加密面具并在不暴露身份的情况下投票。投票记录在链上，身份保持匿名。",
  },
  step1: { en: "Create a mask identity with a secret seed", zh: "使用身份种子创建面具" },
  step2: { en: "Select a proposal and a mask", zh: "选择提案和面具" },
  step3: { en: "Submit your vote on-chain", zh: "在链上提交投票" },
  step4: { en: "Track results without revealing identity", zh: "在不暴露身份的情况下查看结果" },
  feature1Name: { en: "Anonymous Voting", zh: "匿名投票" },
  feature1Desc: { en: "Identity hashes keep voter privacy intact.", zh: "身份哈希确保投票者隐私。" },
  feature2Name: { en: "On-chain Audit", zh: "链上审计" },
  feature2Desc: { en: "Votes are verifiable on-chain.", zh: "投票可在链上验证。" },
  wrongChain: { en: "Wrong Chain", zh: "链错误" },
  wrongChainMessage: {
    en: "This app requires Neo N3. Please switch networks.",
    zh: "此应用需要 Neo N3 网络，请切换网络。",
  },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);
const APP_ID = "miniapp-masqueradedao";
const MASK_FEE = 0.1;

const { address, connect, chainType, switchChain, invokeContract, invokeRead, getContractAddress } = useWallet() as any;
const { payGAS, isLoading } = usePayments(APP_ID);
const { list: listEvents } = useEvents();

const activeTab = ref("identity");
const navTabs = [
  { id: "identity", label: t("identity"), icon: "👤" },
  { id: "vote", label: t("vote"), icon: "🗳️" },
  { id: "docs", icon: "book", label: t("docs") },
];

const identitySeed = ref("");
const identityHash = ref("");
const proposalId = ref("");
const proof = ref("");
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
        const identity = String(values[0] ?? "");
        const createdAt = mask.createdAt ? new Date(mask.createdAt).toLocaleString() : "--";
        const active = Boolean(values[2]);
        return { id: mask.id, identityHash: identity, active, createdAt };
      }),
    );

    masks.value = details;
    if (!selectedMaskId.value && masks.value.length > 0) {
      selectedMaskId.value = masks.value[0].id;
    }
  } catch (e) {
    console.warn("[MasqueradeDAO] Failed to load masks:", e);
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

const submitVote = async (support: boolean) => {
  if (!canVote.value) return;
  status.value = null;
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) throw new Error(t("connectWallet"));
    if (!selectedMaskId.value) throw new Error(t("selectMaskFirst"));
    const contract = await ensureContractAddress();
    await invokeContract({
      contractAddress: contract,
      operation: "submitVote",
      args: [
        { type: "Integer", value: proposalId.value },
        { type: "Integer", value: selectedMaskId.value },
        { type: "Integer", value: support ? 1 : 0 },
        { type: "ByteArray", value: proof.value ? proof.value : "" },
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

.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border-radius: 99px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 10px;
  margin-bottom: $space-4;
  backdrop-filter: blur(10px);

  &.success {
    background: rgba(0, 229, 153, 0.1);
    border: 1px solid rgba(0, 229, 153, 0.3);
    color: #00e599;
  }
  &.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.7);
}

.helper-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.55);
}

.hash-preview {
  padding: $space-3;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
}

.hash-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.hash-value {
  font-family: $font-mono;
  font-size: 11px;
  word-break: break-all;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.empty-state {
  text-align: center;
  padding: $space-4;
}

.empty-text {
  font-size: 12px;
  opacity: 0.6;
}

.mask-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.mask-item {
  padding: $space-3;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;

  &.active {
    border-color: rgba(159, 157, 243, 0.4);
    box-shadow: 0 0 10px rgba(159, 157, 243, 0.2);
  }
}

.mask-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mask-id {
  font-weight: 700;
}

.mask-status {
  font-size: 10px;
  text-transform: uppercase;
  opacity: 0.7;
}

.mask-status.active {
  color: #00e599;
}

.mask-status.inactive {
  color: #ef4444;
}

.mask-hash {
  font-size: 11px;
  word-break: break-all;
}

.mask-time {
  margin-top: 4px;
  font-size: 10px;
  opacity: 0.5;
}

.mask-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mask-chip {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.03);
  font-size: 11px;
  cursor: pointer;

  &.active {
    border-color: rgba(159, 157, 243, 0.4);
    color: #9f9df3;
  }
}

.vote-actions {
  display: flex;
  gap: $space-3;
}

.mono {
  font-family: $font-mono;
}
</style>
