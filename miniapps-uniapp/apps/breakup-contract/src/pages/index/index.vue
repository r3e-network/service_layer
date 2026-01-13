<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'create' || activeTab === 'contracts'" class="app-container">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <NeoCard variant="erobo" class="mb-6 text-center">
        <text class="title block mb-1">{{ t("title") }}</text>
        <text class="subtitle block">{{ t("subtitle") }}</text>
      </NeoCard>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'erobo-neo'" class="mb-4 text-center">
        <text class="font-bold status-msg">{{ status.msg }}</text>
      </NeoCard>

      <!-- Create Contract Tab -->
      <view v-if="activeTab === 'create'" class="tab-content">
        <CreateContractForm
          v-model:partnerAddress="partnerAddress"
          v-model:stakeAmount="stakeAmount"
          v-model:duration="duration"
          :address="address"
          :is-loading="isLoading"
          :t="t as any"
          @create="createContract"
        />
      </view>

      <!-- Active Contracts Tab -->
      <view v-if="activeTab === 'contracts'" class="tab-content">
        <ContractList
          :contracts="contracts"
          :address="address"
          :t="t as any"
          @sign="signContract"
          @break="breakContract"
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
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments, useEvents } from "@neo/uniapp-sdk";
import { parseInvokeResult, parseStackItem } from "@/shared/utils/neo";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoCard } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import CreateContractForm from "./components/CreateContractForm.vue";
import ContractList from "./components/ContractList.vue";

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
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-breakupcontract";
const { address, connect, invokeContract, invokeRead, chainType, switchChain } = useWallet() as any;
const { list: listEvents } = useEvents();
const { payGAS, isLoading } = usePayments(APP_ID);
const contractAddress = ref<string>("0xc56f33fc6ec47edbd594472833cf57505d5f99aa"); // Placeholder/Demo Contract

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

const ensureContractAddress = async () => {
  return contractAddress.value;
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
    await ensureContractAddress();
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
        contractAddress: contractAddress.value!,
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
    await ensureContractAddress();
    const payment = await payGAS(stakeAmount.value, `contract:${partnerAddress.value.slice(0, 10)}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    await invokeContract({
      contractAddress: contractAddress.value!,
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
    await ensureContractAddress();
    const payment = await payGAS(contract.stake.toFixed(8), `contract:sign:${contract.id}`);
    const receiptId = payment.receipt_id;
    if (!receiptId) {
      throw new Error("Missing payment receipt");
    }
    await invokeContract({
      contractAddress: contractAddress.value!,
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
    await ensureContractAddress();
    await invokeContract({
      contractAddress: contractAddress.value!,
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.app-container {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.title {
  font-size: 28px;
  font-weight: 800;
  text-transform: uppercase;
  color: white;
  text-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
  letter-spacing: 0.05em;
}
.subtitle {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.1em;
}
.status-msg {
  color: white;
  text-transform: uppercase;
  font-size: 13px;
  letter-spacing: 0.05em;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
