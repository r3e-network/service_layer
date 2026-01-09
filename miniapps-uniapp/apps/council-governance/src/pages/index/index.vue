<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <ActiveProposalsTab
      v-if="activeTab === 'active'"
      :proposals="activeProposals"
      :status="status"
      :loading="loadingProposals"
      :voting-power="votingPower"
      :is-candidate="isCandidate"
      :candidate-loaded="candidateLoaded"
      :t="t as any"
      @create="activeTab = 'create'"
      @select="selectProposal"
    />

    <HistoryProposalsTab
      v-if="activeTab === 'history'"
      :proposals="historyProposals"
      :t="t as any"
      @select="selectProposal"
    />

    <CreateProposalTab
      v-if="activeTab === 'create'"
      ref="createTabRef"
      :t="t as any"
      :status="status"
      @submit="createProposal"
    />

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

    <ProposalDetailsModal
      v-if="selectedProposal"
      :proposal="selectedProposal"
      :address="address"
      :is-candidate="isCandidate"
      :has-voted="!!hasVotedMap[selectedProposal.id]"
      :t="t as any"
      @close="selectedProposal = null"
      @vote="castVote"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import ActiveProposalsTab from "./components/ActiveProposalsTab.vue";
import HistoryProposalsTab from "./components/HistoryProposalsTab.vue";
import CreateProposalTab from "./components/CreateProposalTab.vue";
import ProposalDetailsModal from "./components/ProposalDetailsModal.vue";

const translations = {
  title: { en: "Council Governance", zh: "议会治理" },
  active: { en: "Active", zh: "进行中" },
  create: { en: "Create", zh: "创建" },
  history: { en: "History", zh: "历史" },
  createProposal: { en: "Create Proposal", zh: "创建提案" },
  noActiveProposals: { en: "No active proposals", zh: "暂无进行中的提案" },
  noHistory: { en: "No history", zh: "暂无历史记录" },
  textType: { en: "Text", zh: "文本" },
  policyType: { en: "Policy Change", zh: "策略变更" },
  policyDetails: { en: "Policy Details", zh: "策略详情" },
  policyMethod: { en: "Policy Method", zh: "策略方法" },
  policyValue: { en: "Policy Value", zh: "策略值" },
  policyValuePlaceholder: { en: "Enter policy value", zh: "输入策略值" },
  methodFeePerByte: { en: "Set Fee Per Byte", zh: "设置每字节费用" },
  methodExecFeeFactor: { en: "Set Exec Fee Factor", zh: "设置执行费系数" },
  methodStoragePrice: { en: "Set Storage Price", zh: "设置存储价格" },
  methodMaxBlockSize: { en: "Set Max Block Size", zh: "设置区块最大大小" },
  methodMaxTransactions: { en: "Set Max Transactions/Block", zh: "设置每块最大交易数" },
  methodMaxSystemFee: { en: "Set Max System Fee", zh: "设置最大系统费用" },
  yes: { en: "Yes", zh: "赞成" },
  no: { en: "No", zh: "反对" },
  for: { en: "For", zh: "赞成" },
  against: { en: "Against", zh: "反对" },
  notCandidate: { en: "Only top 21 council members can vote", zh: "仅前 21 名议会成员可投票" },
  connectWallet: { en: "Connect wallet to vote", zh: "连接钱包以投票" },
  alreadyVoted: { en: "You already voted on this proposal", zh: "您已对该提案投票" },
  voteRecorded: { en: "Vote recorded", zh: "投票已记录" },
  loadingProposals: { en: "Loading proposals...", zh: "加载提案中..." },
  failedToLoadProposals: { en: "Failed to load proposals", zh: "加载提案失败" },
  failedToLoadCandidates: { en: "Failed to load council candidates", zh: "加载议会候选人失败" },
  yourVotingPower: { en: "Your Voting Power", zh: "您的投票权重" },
  councilMember: { en: "Council Member", zh: "议会成员" },
  quorum: { en: "Quorum", zh: "法定人数" },
  proposalDetails: { en: "Proposal Details", zh: "提案详情" },
  timeline: { en: "Timeline", zh: "时间线" },
  proposalCreated: { en: "Proposal Created", zh: "提案创建" },
  votingEnds: { en: "Voting Ends", zh: "投票结束" },
  execution: { en: "Execution", zh: "执行" },
  castYourVote: { en: "Cast Your Vote", zh: "投出您的一票" },
  proposalType: { en: "Type", zh: "类型" },
  proposalTitle: { en: "Title", zh: "标题" },
  description: { en: "Description", zh: "描述" },
  duration: { en: "Duration", zh: "有效期" },
  titlePlaceholder: { en: "Enter proposal title", zh: "输入提案标题" },
  descPlaceholder: { en: "Enter proposal description", zh: "输入提案描述" },
  fillAllFields: { en: "Please enter a title and description", zh: "请填写标题和描述" },
  policyFieldsRequired: { en: "Select a policy method and value", zh: "请选择策略方法并填写数值" },
  invalidPolicyValue: { en: "Enter a valid policy value", zh: "请输入有效的策略数值" },
  proposalSubmitted: { en: "Proposal submitted", zh: "提案已提交" },
  submit: { en: "Submit", zh: "提交" },
  passed: { en: "Passed", zh: "已通过" },
  rejected: { en: "Rejected", zh: "已拒绝" },
  revoked: { en: "Revoked", zh: "已撤销" },
  expired: { en: "Expired", zh: "已过期" },
  executed: { en: "Executed", zh: "已执行" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Decentralized governance for Neo Council proposals",
    zh: "Neo 理事会提案的去中心化治理",
  },
  docDescription: {
    en: "Council Governance enables transparent voting on Neo ecosystem proposals. Council members can review, discuss, and vote on proposals with multi-signature execution.",
    zh: "理事会治理支持对 Neo 生态系统提案进行透明投票。理事会成员可以审查、讨论和投票提案，并通过多签执行。",
  },
  step1: {
    en: "Connect your Neo wallet (must be a council member)",
    zh: "连接您的 Neo 钱包（必须是理事会成员）",
  },
  step2: {
    en: "Browse active proposals and review their details",
    zh: "浏览活跃提案并查看详情",
  },
  step3: {
    en: "Cast your vote (For, Against, or Abstain)",
    zh: "投出您的票（赞成、反对或弃权）",
  },
  step4: {
    en: "Track proposal execution status after voting concludes",
    zh: "投票结束后跟踪提案执行状态",
  },
  feature1Name: { en: "Multi-Sig Execution", zh: "多签执行" },
  feature1Desc: {
    en: "Approved proposals require multiple council signatures to execute.",
    zh: "批准的提案需要多个理事会签名才能执行。",
  },
  feature2Name: { en: "Transparent Voting", zh: "透明投票" },
  feature2Desc: {
    en: "All votes are recorded on-chain for full accountability.",
    zh: "所有投票都记录在链上，完全可追溯。",
  },
  error: { en: "Error", zh: "错误" },
};
const t = createT(translations);
const APP_ID = "miniapp-council-governance";

// Detect host URL for API calls (miniapp runs in iframe)
const getApiBase = () => {
  try {
    if (window.parent !== window) {
      const parentOrigin = document.referrer ? new URL(document.referrer).origin : "";
      if (parentOrigin) return parentOrigin;
    }
  } catch {
    // Fallback
  }
  return "";
};
const API_HOST = getApiBase();

const navTabs = [
  { id: "active", icon: "vote", label: t("active") },
  { id: "create", icon: "file", label: t("create") },
  { id: "history", icon: "history", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("active");

const { address, invokeContract, invokeRead, getContractHash } = useWallet();
const contractHash = ref<string | null>(null);
const selectedProposal = ref<Proposal | null>(null);
const status = ref<{ msg: string; type: "success" | "error" | "info" } | null>(null);
const loadingProposals = ref(false);
const candidateLoaded = ref(false);
const isCandidate = ref(false);
const votingPower = ref(0);
const hasVotedMap = ref<Record<number, boolean>>({});
const createTabRef = ref<any>(null);
const currentNetwork = ref<"mainnet" | "testnet">("testnet");

// Detect network from host origin
const detectNetwork = () => {
  try {
    const origin = window.parent !== window ? document.referrer : window.location.origin;
    if (origin.includes("testnet") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
      currentNetwork.value = "testnet";
    } else {
      currentNetwork.value = "mainnet";
    }
  } catch {
    currentNetwork.value = "testnet";
  }
};

const STATUS_ACTIVE = 1;

interface Proposal {
  id: number;
  type: number;
  title: string;
  description: string;
  policyMethod?: string;
  policyValue?: string;
  yesVotes: number;
  noVotes: number;
  expiryTime: number;
  status: number;
}

type VoteChoice = "for" | "against";

const proposals = ref<Proposal[]>([]);
const STATUS_EXPIRED = 5;

const activeProposals = computed(() => proposals.value.filter((p) => resolveStatus(p) === STATUS_ACTIVE));
const historyProposals = computed(() => proposals.value.filter((p) => resolveStatus(p) !== STATUS_ACTIVE));

const resolveStatus = (proposal: Proposal) => {
  if (proposal.status === STATUS_ACTIVE && proposal.expiryTime < Date.now()) {
    return STATUS_EXPIRED;
  }
  return proposal.status;
};

const showStatus = (msg: string, type: "success" | "error" | "info" = "info") => {
  status.value = { msg, type };
  setTimeout(() => {
    status.value = null;
  }, 4000);
};

const hasVoted = (proposalId: number) => Boolean(hasVotedMap.value[proposalId]);

const selectProposal = async (p: Proposal) => {
  selectedProposal.value = p;
  if (address.value) {
    await refreshHasVoted([p.id]);
  }
};

const castVote = async (proposalId: number, voteType: VoteChoice) => {
  const proposal = activeProposals.value.find((p) => p.id === proposalId);
  if (!proposal || resolveStatus(proposal) !== STATUS_ACTIVE) return;
  const voter = address.value;
  if (!voter) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  if (!isCandidate.value) {
    showStatus(t("notCandidate"), "error");
    return;
  }
  if (hasVoted(proposalId)) {
    showStatus(t("alreadyVoted"), "error");
    return;
  }
  if (!contractHash.value) {
    showStatus(t("failedToLoadProposals"), "error");
    return;
  }

  try {
    const support = voteType === "for";
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "Vote",
      args: [
        { type: "Hash160", value: voter },
        { type: "Integer", value: proposalId },
        { type: "Boolean", value: support },
      ],
    });
    showStatus(t("voteRecorded"), "success");
    await loadProposals();
    await refreshHasVoted([proposalId]);
    selectedProposal.value = null;
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  }
};

const createProposal = async (proposalData: any) => {
  const title = proposalData.title.trim();
  const description = proposalData.description.trim();
  if (!title || !description) {
    showStatus(t("fillAllFields"), "error");
    return;
  }
  let policyValueNumber: number | null = null;
  if (proposalData.type === 1) {
    const rawPolicyValue = String(proposalData.policyValue).trim();
    if (!proposalData.policyMethod || !rawPolicyValue) {
      showStatus(t("policyFieldsRequired"), "error");
      return;
    }
    const parsed = Number(rawPolicyValue);
    if (!Number.isFinite(parsed)) {
      showStatus(t("invalidPolicyValue"), "error");
      return;
    }
    policyValueNumber = parsed;
  }
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  if (!isCandidate.value) {
    showStatus(t("notCandidate"), "error");
    return;
  }
  if (!contractHash.value) {
    showStatus(t("failedToLoadProposals"), "error");
    return;
  }

  const policyDataS =
    proposalData.type === 1 ? JSON.stringify({ method: proposalData.policyMethod, value: policyValueNumber }) : "";

  try {
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "CreateProposal",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: proposalData.type },
        { type: "String", value: title },
        { type: "String", value: description },
        { type: "ByteString", value: policyDataS },
        { type: "Integer", value: proposalData.duration },
      ],
    });
    showStatus(t("proposalSubmitted"), "success");
    if (createTabRef.value?.reset) {
      createTabRef.value.reset();
    }
    await loadProposals();
    activeTab.value = "active";
  } catch (e: any) {
    showStatus(e.message || t("proposalSubmitted"), "error");
  }
};

const parseProposal = (data: Record<string, any>): Proposal => {
  const policyByteString = String(data.policyData || "");
  let policyMethod: string | undefined;
  let policyValue: string | undefined;
  if (policyByteString) {
    try {
      const parsed = JSON.parse(policyByteString);
      policyMethod = parsed.method;
      policyValue = parsed.value;
    } catch {
      policyValue = policyByteString;
    }
  }

  return {
    id: Number(data.id || 0),
    type: Number(data.type || 0),
    title: String(data.title || ""),
    description: String(data.description || ""),
    policyMethod,
    policyValue,
    yesVotes: Number(data.yesVotes || 0),
    noVotes: Number(data.noVotes || 0),
    expiryTime: Number(data.expiryTime || 0) * 1000,
    status: Number(data.status || 0),
  };
};

const CACHE_KEY = "council_proposals_cache";

const loadProposals = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) return;

  // 1. Load from cache first
  try {
    const cached = uni.getStorageSync(CACHE_KEY);
    if (cached) {
      proposals.value = JSON.parse(cached);
    }
  } catch (e) {
    console.warn("Failed to load proposals cache", e);
  }

  try {
    loadingProposals.value = true;
    const countRes = await invokeRead({ contractHash: contractHash.value, operation: "GetProposalCount" });
    const count = Number(parseInvokeResult(countRes) || 0);
    const list: Proposal[] = [];
    
    // Process in parallel to speed up initial load if many proposals exist
    const fetchProposal = async (id: number) => {
      const proposalRes = await invokeRead({
        contractHash: contractHash.value!,
        operation: "GetProposal",
        args: [{ type: "Integer", value: id }],
      });
      const proposalData = parseInvokeResult(proposalRes);
      if (proposalData) {
        return parseProposal(proposalData);
      }
      return null;
    };

    // Parallel fetch for fresh data
    const results = await Promise.all(
      Array.from({ length: count }, (_, i) => i + 1).map(fetchProposal)
    );
    
    list.push(...(results.filter(p => p !== null) as Proposal[]));
    proposals.value = list.sort((a, b) => b.id - a.id);
    
    // 2. Save to cache
    uni.setStorageSync(CACHE_KEY, JSON.stringify(proposals.value));
  } catch (e: any) {
    if (proposals.value.length === 0) {
      showStatus(e.message || t("failedToLoadProposals"), "error");
    } else {
      console.error("Background proposal refresh failed", e);
    }
  } finally {
    loadingProposals.value = false;
  }
};

const refreshCandidateStatus = async () => {
  if (!address.value) {
    isCandidate.value = false;
    votingPower.value = 0;
    candidateLoaded.value = true;
    return;
  }
  try {
    // Call API to check if address is in top 21 council members
    const res = await uni.request({
      url: `${API_HOST}/api/neo/council-members?network=${currentNetwork.value}&address=${address.value}`,
      method: "GET",
    });
    if (res.statusCode === 200 && res.data) {
      const data = res.data as { isCouncilMember?: boolean; network: string };
      isCandidate.value = Boolean(data.isCouncilMember);
      votingPower.value = isCandidate.value ? 1 : 0;
    } else {
      isCandidate.value = false;
      votingPower.value = 0;
    }
  } catch {
    isCandidate.value = false;
    votingPower.value = 0;
  } finally {
    candidateLoaded.value = true;
  }
};

const refreshHasVoted = async (proposalIds?: number[]) => {
  if (!address.value || !contractHash.value) return;
  const currentAddress = address.value;
  const currentHash = contractHash.value;
  const ids = proposalIds ?? proposals.value.map((p) => p.id);
  const updates: Record<number, boolean> = { ...hasVotedMap.value };
  await Promise.all(
    ids.map(async (id) => {
      const res = await invokeRead({
        contractHash: currentHash,
        operation: "HasVoted",
        args: [
          { type: "Hash160", value: currentAddress },
          { type: "Integer", value: id },
        ],
      });
      updates[id] = Boolean(parseInvokeResult(res));
    }),
  );
  hasVotedMap.value = updates;
};

onMounted(async () => {
  detectNetwork();
  contractHash.value = await getContractHash();
  await loadProposals();
  await refreshCandidateStatus();
  await refreshHasVoted();
});

watch(address, async () => {
  await refreshCandidateStatus();
  await refreshHasVoted();
});

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
