<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'create' || activeTab === 'contracts'" class="app-container">
      <view class="header">
        <view class="heart-icon">
          <text class="heart">💕</text>
          <text class="broken-heart">💔</text>
        </view>
        <text class="title">{{ t("title") }}</text>
        <text class="subtitle">{{ t("subtitle") }}</text>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Create Contract Tab -->
      <view v-if="activeTab === 'create'" class="tab-content">
        <view class="contract-document">
          <view class="document-header">
            <text class="document-title">{{ t("contractTitle") }}</text>
            <view class="document-seal">
              <text class="seal-text">💕</text>
            </view>
          </view>

          <view class="document-body">
            <text class="document-clause">{{ t("clause1") }}</text>

            <view class="form-group">
              <text class="form-label">{{ t("partnerLabel") }}</text>
              <NeoInput v-model="partnerAddress" :placeholder="t('partnerPlaceholder')" />
            </view>

            <view class="form-group">
              <text class="form-label">{{ t("stakeLabel") }}</text>
              <NeoInput v-model="stakeAmount" type="number" :placeholder="t('stakePlaceholder')" />
            </view>

            <view class="form-group">
              <text class="form-label">{{ t("durationLabel") }}</text>
              <NeoInput v-model="duration" type="number" :placeholder="t('durationPlaceholder')" />
            </view>

            <view class="signature-section">
              <text class="signature-label">{{ t("signatureLabel") }}</text>
              <view class="signature-line">
                <text class="signature-placeholder">{{ address || t("connectWallet") }}</text>
              </view>
            </view>

            <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="createContract">
              {{ isLoading ? t("creating") : t("createBtn") }}
            </NeoButton>
          </view>
        </view>
      </view>

      <!-- Active Contracts Tab -->
      <view v-if="activeTab === 'contracts'" class="tab-content">
        <view class="contracts-list">
          <text class="section-title">{{ t("activeContracts") }}</text>

          <view v-for="contract in contracts" :key="contract.id" class="contract-card">
            <view class="contract-status-badge" :class="contract.status">
              <text class="status-icon">{{ contract.status === "active" ? "💕" : "💔" }}</text>
              <text class="status-text">{{ t(contract.status) }}</text>
            </view>

            <view class="contract-info">
              <view class="info-row">
                <text class="info-label">{{ t("partner") }}:</text>
                <text class="info-value">{{ contract.partner }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">{{ t("stake") }}:</text>
                <text class="info-value stake-amount">{{ contract.stake }} GAS</text>
              </view>
              <view class="info-row">
                <text class="info-label">{{ t("duration") }}:</text>
                <text class="info-value">{{ contract.daysLeft }} {{ t("daysLeft") }}</text>
              </view>
            </view>

            <view class="contract-progress-section">
              <text class="progress-label">{{ t("progress") }}: {{ contract.progress }}%</text>
              <view class="progress-track">
                <view class="progress-fill" :style="{ width: contract.progress + '%' }">
                  <view class="progress-heart">💕</view>
                </view>
              </view>
            </view>

            <view class="contract-actions">
              <view
                v-if="contract.status === 'pending' && canSignContract(contract)"
                class="claim-btn"
                @click="signContract(contract)"
              >
                <text>{{ t("signContract") }}</text>
              </view>
              <view v-else-if="contract.status === 'active'" class="break-btn" @click="breakContract(contract)">
                <text>{{ t("breakContract") }}</text>
              </view>
              <view v-else class="contract-status-text">
                <text>{{ t(contract.status) }}</text>
              </view>
            </view>
          </view>
        </view>
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
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Breakup Contract", zh: "分手合约" },
  subtitle: { en: "Relationship stakes on-chain", zh: "链上关系赌注" },
  contractTitle: { en: "RELATIONSHIP CONTRACT", zh: "关系合约" },
  clause1: {
    en: "This contract binds two parties in a commitment backed by cryptocurrency stakes.",
    zh: "本合约将双方绑定在由加密货币质押支持的承诺中。",
  },

  partnerLabel: { en: "Partner Address", zh: "伴侣地址" },
  stakeLabel: { en: "Stake Amount", zh: "质押金额" },
  durationLabel: { en: "Contract Duration", zh: "合约期限" },
  signatureLabel: { en: "Your Signature", zh: "您的签名" },

  partnerPlaceholder: { en: "Enter partner's NEO address", zh: "输入伴侣的 NEO 地址" },
  stakePlaceholder: { en: "Amount in GAS", zh: "GAS 金额" },
  durationPlaceholder: { en: "Days", zh: "天数" },
  connectWallet: { en: "Connect wallet to sign", zh: "连接钱包以签名" },

  creating: { en: "Creating...", zh: "创建中..." },
  createBtn: { en: "Sign & Create Contract", zh: "签署并创建合约" },

  activeContracts: { en: "Active Contracts", zh: "活跃合约" },
  partner: { en: "Partner", zh: "伴侣" },
  stake: { en: "Stake", zh: "质押" },
  duration: { en: "Duration", zh: "期限" },
  daysLeft: { en: "days left", zh: "天剩余" },
  progress: { en: "Progress", zh: "进度" },

  pending: { en: "Pending", zh: "待签署" },
  active: { en: "Active", zh: "活跃" },
  broken: { en: "Broken", zh: "已破裂" },
  ended: { en: "Ended", zh: "已结束" },

  signContract: { en: "Sign Contract", zh: "签署合约" },
  breakContract: { en: "Break Contract", zh: "违约" },

  contractCreated: { en: "Contract created successfully!", zh: "合约创建成功！" },
  contractSigned: { en: "Contract signed", zh: "合约已签署" },
  contractBroken: { en: "Contract broken! Stake forfeited.", zh: "合约已破裂！质押被没收。" },
  error: { en: "Error", zh: "错误" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Learn about relationship contracts.", zh: "了解关系合约。" },
  docDescription: {
    en: "Create binding relationship contracts with cryptocurrency stakes. Complete the duration to claim rewards, or break early and forfeit your stake.",
    zh: "创建具有加密货币质押的约束性关系合约。完成期限以领取奖励，或提前违约并没收质押。",
  },
  step1: { en: "Connect your wallet.", zh: "连接您的钱包。" },
  step2: { en: "Enter partner address and stake amount.", zh: "输入伴侣地址和质押金额。" },
  step3: { en: "Sign the contract and wait for completion!", zh: "签署合约并等待完成！" },
  step4: { en: "Track active contracts in the Contracts tab.", zh: "在合约标签页跟踪活跃合约。" },
  feature1Name: { en: "Crypto Stakes", zh: "加密质押" },
  feature1Desc: { en: "Real GAS locked in contract.", zh: "真实的 GAS 锁定在合约中。" },
  feature2Name: { en: "On-Chain Proof", zh: "链上证明" },
  feature2Desc: { en: "Immutable relationship records.", zh: "不可变的关系记录。" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-breakupcontract";
const { address, connect, invokeContract, invokeRead, getContractHash } = useWallet();
const { list: listEvents } = useEvents();
const { payGAS, isLoading } = usePayments(APP_ID);
const contractHash = ref<string | null>(null);

const activeTab = ref<string>("create");
const navTabs: NavTab[] = [
  { id: "create", label: "Create", icon: "💔" },
  { id: "contracts", label: "Contracts", icon: "📋" },
  { id: "docs", icon: "book", label: t("docs") },
];

const partnerAddress = ref("");
const stakeAmount = ref("");
const duration = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
type ContractStatus = "pending" | "active" | "broken" | "ended";
interface RelationshipContractView {
  id: number;
  party1: string;
  party2: string;
  partner: string;
  stake: number;
  stakeRaw: string;
  progress: number;
  daysLeft: number;
  status: ContractStatus;
}

const contracts = ref<RelationshipContractView[]>([]);

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const toGas = (value: any) => {
  const num = Number(value ?? 0);
  return Number.isFinite(num) ? num / 1e8 : 0;
};

const ensureContractHash = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    throw new Error("Contract not configured");
  }
};

const parseContract = (id: number, data: any[]): RelationshipContractView | null => {
  if (!Array.isArray(data) || data.length < 9) return null;
  const party1 = String(data[0] ?? "");
  const party2 = String(data[1] ?? "");
  const stakeRaw = String(data[2] ?? "0");
  const party1Signed = Boolean(data[3]);
  const party2Signed = Boolean(data[4]);
  const startTime = Number(data[5] ?? 0) * 1000;
  const duration = Number(data[6] ?? 0);
  const active = Boolean(data[7]);
  const completed = Boolean(data[8]);

  const now = Date.now();
  const endTime = startTime + duration;
  const elapsed = startTime > 0 ? Math.max(0, Math.min(duration, now - startTime)) : 0;
  const progress = duration > 0 ? Math.round((elapsed / duration) * 100) : 0;
  const daysLeft = duration > 0 ? Math.max(0, Math.ceil((endTime - now) / 86400000)) : 0;

  let status: ContractStatus = "pending";
  if (party2Signed && active) status = "active";
  else if (completed) status = "broken";
  else if (party2Signed && !active) status = "ended";

  const partner = address.value && address.value === party1 ? party2 : party1;

  return {
    id,
    party1,
    party2,
    partner,
    stake: toGas(stakeRaw),
    stakeRaw,
    progress,
    daysLeft,
    status,
  };
};

const loadContracts = async () => {
  try {
    await ensureContractHash();
    const createdEvents = await listEvents({ app_id: APP_ID, event_name: "ContractCreated", limit: 50 });
    const ids = new Set<number>();
    createdEvents.events.forEach((evt) => {
      const values = Array.isArray((evt as any)?.state) ? (evt as any).state.map(parseStackItem) : [];
      const id = Number(values[0] ?? 0);
      if (id > 0) ids.add(id);
    });

    const contractViews: RelationshipContractView[] = [];
    for (const id of Array.from(ids).sort((a, b) => b - a)) {
      const res = await invokeRead({
        contractHash: contractHash.value!,
        operation: "GetContract",
        args: [{ type: "Integer", value: id }],
      });
      const parsed = parseContract(id, parseInvokeResult(res));
      if (parsed) contractViews.push(parsed);
    }
    contracts.value = contractViews;
  } catch (e) {
    console.warn("Failed to load contracts", e);
  }
};

const canSignContract = (contract: RelationshipContractView) =>
  Boolean(address.value && contract.status === "pending" && contract.party2 === address.value);

const createContract = async () => {
  if (!partnerAddress.value || !stakeAmount.value || isLoading.value) return;
  const stake = parseFloat(stakeAmount.value);
  const durationDays = parseInt(duration.value, 10);
  if (!Number.isFinite(stake) || stake < 1 || !Number.isFinite(durationDays) || durationDays < 30) {
    status.value = { msg: t("error"), type: "error" };
    return;
  }
  try {
    if (!address.value) {
      await connect();
    }
    if (!address.value) {
      throw new Error(t("error"));
    }
    await ensureContractHash();
    const payment = await payGAS(stakeAmount.value, `contract:${partnerAddress.value.slice(0, 10)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    await invokeContract({
      scriptHash: contractHash.value!,
      operation: "CreateContract",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Hash160", value: partnerAddress.value },
        { type: "Integer", value: toFixed8(stakeAmount.value) },
        { type: "Integer", value: durationDays },
        { type: "Integer", value: receiptId },
      ],
    });
    status.value = { msg: t("contractCreated"), type: "success" };
    partnerAddress.value = "";
    stakeAmount.value = "";
    duration.value = "";
    await loadContracts();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const signContract = async (contract: RelationshipContractView) => {
  if (isLoading.value || !address.value) return;
  try {
    await ensureContractHash();
    const payment = await payGAS(contract.stake.toFixed(8), `contract:sign:${contract.id}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    await invokeContract({
      scriptHash: contractHash.value!,
      operation: "SignContract",
      args: [
        { type: "Integer", value: contract.id },
        { type: "Hash160", value: address.value },
        { type: "Integer", value: receiptId },
      ],
    });
    status.value = { msg: t("contractSigned"), type: "success" };
    await loadContracts();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const breakContract = async (contract: RelationshipContractView) => {
  if (!address.value) {
    status.value = { msg: t("error"), type: "error" };
    return;
  }
  try {
    await ensureContractHash();
    await invokeContract({
      scriptHash: contractHash.value!,
      operation: "TriggerBreakup",
      args: [
        { type: "Integer", value: contract.id },
        { type: "Hash160", value: address.value },
      ],
    });
    status.value = { msg: t("contractBroken"), type: "error" };
    await loadContracts();
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

onMounted(() => {
  loadContracts();
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.header {
  text-align: center;
  margin-bottom: $space-4;
}

.heart-icon {
  font-size: 32px;
  display: flex;
  justify-content: center;
  gap: $space-2;
}
.title {
  font-size: 32px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: var(--brutal-pink);
  text-shadow: 4px 4px 0 black;
}
.subtitle {
  font-size: 10px;
  font-weight: $font-weight-black;
  opacity: 0.6;
  text-transform: uppercase;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.contract-document {
  background: white;
  border: 4px solid black;
  box-shadow: 10px 10px 0 black;
  padding: $space-6;
  position: relative;
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 10px;
    background: repeating-linear-gradient(45deg, var(--brutal-pink), var(--brutal-pink) 10px, black 10px, black 20px);
  }
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
  border-bottom: 2px dashed black;
  padding: $space-2 0;
}
.document-title {
  font-weight: $font-weight-black;
  font-size: 14px;
  text-transform: uppercase;
}
.document-seal {
  font-size: 24px;
  opacity: 0.5;
  filter: grayscale(1);
}

.document-clause {
  font-size: 8px;
  font-weight: $font-weight-bold;
  line-height: 1.4;
  padding: $space-3;
  border: 1px dashed black;
  background: #f9f9f9;
  display: block;
  margin-bottom: $space-4;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  margin-bottom: $space-4;
}
.form-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
}

.signature-section {
  border-top: 2px dashed black;
  padding-top: $space-4;
  margin-top: $space-2;
}
.signature-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  opacity: 0.6;
  text-transform: uppercase;
}
.signature-line {
  font-family: $font-mono;
  font-size: 12px;
  font-weight: $font-weight-black;
  color: var(--brutal-pink);
  padding: $space-2 0;
  border-bottom: 3px solid var(--brutal-pink);
}

.contracts-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
.section-title {
  font-size: 16px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border-bottom: 2px solid black;
  padding-bottom: $space-1;
}

.contract-card {
  background: white;
  border: 2px solid black;
  padding: $space-4;
  box-shadow: 6px 6px 0 black;
  border-left: 8px solid var(--brutal-pink);
}

.contract-status-badge {
  display: inline-flex;
  padding: 2px 8px;
  border: 1px solid black;
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: $space-2;
  &.active {
    background: var(--neo-green);
  }
  &.pending {
    background: var(--brutal-yellow);
  }
  &.broken {
    background: var(--brutal-red);
    color: white;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  padding: 2px 0;
  border-bottom: 1px solid #eee;
}
.info-label {
  opacity: 0.6;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.info-value {
  font-family: $font-mono;
  font-weight: $font-weight-black;
}

.contract-progress-section {
  margin-top: $space-4;
}
.progress-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: black;
}
.progress-track {
  height: 12px;
  background: #eee;
  margin-top: 4px;
  border: 2px solid black;
}
.progress-fill {
  height: 100%;
  background: var(--brutal-pink);
  border-right: 2px solid black;
}

.contract-actions {
  margin-top: $space-4;
  display: flex;
  gap: $space-2;
}
.break-btn,
.claim-btn {
  flex: 1;
  text-align: center;
  padding: $space-2;
  border: 2px solid black;
  font-weight: $font-weight-black;
  font-size: 10px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all $transition-fast;
  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
}
.break-btn {
  background: var(--brutal-red);
  color: white;
  box-shadow: 4px 4px 0 black;
}
.claim-btn {
  background: var(--neo-green);
  color: black;
  box-shadow: 4px 4px 0 black;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
