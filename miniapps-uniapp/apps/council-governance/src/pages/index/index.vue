<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Active Proposals Tab -->
    <view v-if="activeTab === 'active'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase">{{ status.msg }}</text>
      </NeoCard>

      <view v-if="loadingProposals" class="loading-state-neo text-center p-4 opacity-60">
        <text>{{ t("loadingProposals") }}</text>
      </view>

      <!-- Voting Power Card -->
      <NeoCard variant="accent" class="mb-6">
        <view class="power-header-neo flex justify-between items-center">
          <view>
            <text class="power-label-neo text-xs font-bold uppercase opacity-80 block mb-1">{{
              t("yourVotingPower")
            }}</text>
            <text class="power-value-neo text-4xl font-black">{{ votingPower }}</text>
          </view>
          <view class="text-right">
            <text class="text-xs font-bold uppercase opacity-80 block mb-1">{{ t("councilMember") }}</text>
            <text class="font-black">{{ isCandidate ? t("yes") : t("no") }}</text>
          </view>
        </view>
      </NeoCard>

      <view
        v-if="candidateLoaded && !isCandidate"
        class="warning-banner-neo bg-warning p-3 border-2 border-neo-black shadow-neo mb-6 text-center font-bold uppercase text-xs"
      >
        {{ t("notCandidate") }}
      </view>

      <view class="action-bar-neo mb-6">
        <NeoButton variant="primary" size="md" block @click="activeTab = 'create'">
          + {{ t("createProposal") }}
        </NeoButton>
      </view>

      <view
        v-if="activeProposals.length === 0 && !loadingProposals"
        class="empty-state-neo text-center p-12 opacity-40 italic"
      >
        {{ t("noActiveProposals") }}
      </view>

      <NeoCard v-for="p in activeProposals" :key="p.id" class="mb-6" @click="selectProposal(p)">
        <view
          class="proposal-header-neo flex justify-between items-start mb-4 pb-4 border-b border-dashed border-black/10"
        >
          <view class="proposal-meta-neo">
            <text class="proposal-id-neo text-xs font-mono opacity-60 block">#{{ p.id }}</text>
            <text
              :class="['proposal-type-neo font-black uppercase text-sm', p.type === 1 ? 'text-accent' : 'text-primary']"
            >
              {{ p.type === 0 ? t("textType") : t("policyType") }}
            </text>
          </view>
          <text class="proposal-countdown-neo font-mono text-xs bg-black/5 px-2 py-1 border border-black/10">
            {{ formatCountdown(p.expiryTime) }}
          </text>
        </view>

        <text class="proposal-title-neo text-lg font-black uppercase block mb-4">{{ p.title }}</text>

        <!-- Quorum Progress -->
        <view class="quorum-section-neo mb-6">
          <view class="quorum-header-neo flex justify-between text-[10px] font-bold uppercase mb-2">
            <text class="opacity-60">{{ t("quorum") }}</text>
            <text>{{ getQuorumPercent(p).toFixed(1) }}%</text>
          </view>
          <view class="neo-progress">
            <view class="neo-progress-fill" :style="{ width: getQuorumPercent(p) + '%' }"></view>
          </view>
        </view>

        <!-- Vote Distribution -->
        <view class="vote-distribution-neo">
          <view class="neo-progress mb-3 !h-6 flex">
            <view class="bg-success !h-full" :style="{ width: getYesPercent(p) + '%' }"></view>
            <view class="bg-danger !h-full" :style="{ width: getNoPercent(p) + '%' }"></view>
          </view>
          <view class="vote-stats-neo flex justify-between text-xs font-bold font-mono">
            <view class="flex items-center gap-2">
              <view class="w-3 h-3 bg-success border border-black"></view>
              <text class="uppercase">{{ t("for") }}: {{ p.yesVotes }}</text>
            </view>
            <view class="flex items-center gap-2">
              <text class="uppercase">{{ t("against") }}: {{ p.noVotes }}</text>
              <view class="w-3 h-3 bg-danger border border-black"></view>
            </view>
          </view>
        </view>
      </NeoCard>
    </view>

    <!-- History Tab -->
    <view v-if="activeTab === 'history'" class="tab-content scrollable">
      <view v-if="historyProposals.length === 0" class="empty-state-neo text-center p-12 opacity-40 italic">
        {{ t("noHistory") }}
      </view>
      <NeoCard v-for="p in historyProposals" :key="p.id" class="mb-6" @click="selectProposal(p)">
        <view class="proposal-header-neo flex justify-between items-center mb-2">
          <text
            :class="[
              'status-badge-neo bg-black text-white text-[10px] font-black uppercase px-2 py-0.5 border border-black shadow-neo',
              getStatusClass(p.status),
            ]"
          >
            {{ getStatusText(p.status) }}
          </text>
          <text class="proposal-id-neo text-xs font-mono opacity-60">#{{ p.id }}</text>
        </view>
        <text class="proposal-title-neo text-lg font-black uppercase block mb-4">{{ p.title }}</text>
        <view class="vote-stats-neo flex justify-between text-xs font-bold font-mono">
          <text class="text-success uppercase">{{ t("for") }}: {{ p.yesVotes }}</text>
          <text class="text-danger uppercase">{{ t("against") }}: {{ p.noVotes }}</text>
        </view>
      </NeoCard>
    </view>

    <!-- Proposal Details Modal -->
    <view v-if="selectedProposal" class="modal-overlay-neo" @click.self="selectedProposal = null">
      <view class="modal-content-neo">
        <NeoCard :title="t('proposalDetails')" variant="default">
          <template #header-extra>
            <view
              class="close-btn-neo w-8 h-8 flex items-center justify-center font-black text-2xl cursor-pointer"
              @click="selectedProposal = null"
            >
              ×
            </view>
          </template>

          <view class="proposal-detail-content-neo">
            <view
              class="detail-header-neo flex justify-between items-center mb-4 pb-4 border-b border-dashed border-black/10"
            >
              <text
                :class="[
                  'proposal-id-neo font-mono text-sm opacity-60',
                  selectedProposal.type === 1 && 'text-accent font-bold',
                ]"
              >
                {{ selectedProposal.type === 0 ? t("textType") : t("policyType") }} #{{ selectedProposal.id }}
              </text>
            </view>

            <text class="detail-title-neo text-xl font-black uppercase mb-4 block">{{ selectedProposal.title }}</text>
            <text class="detail-description-neo opacity-80 mb-6 block">{{ selectedProposal.description }}</text>

            <view
              v-if="selectedProposal.type === 1"
              class="policy-details-neo bg-black/5 p-4 border border-black/10 mb-6"
            >
              <text class="section-label-neo text-xs font-black uppercase block mb-3">{{ t("policyDetails") }}</text>
              <view class="policy-detail-row-neo flex justify-between mb-1">
                <text class="opacity-60 text-xs">{{ t("policyMethod") }}</text>
                <text class="font-bold text-xs uppercase">{{
                  getPolicyMethodLabel(selectedProposal.policyMethod)
                }}</text>
              </view>
              <view class="policy-detail-row-neo flex justify-between">
                <text class="opacity-60 text-xs">{{ t("policyValue") }}</text>
                <text class="font-mono font-bold">{{ selectedProposal.policyValue || "-" }}</text>
              </view>
            </view>

            <!-- Timeline -->
            <view class="timeline-section-neo mb-6">
              <text class="section-label-neo text-xs font-black uppercase block mb-4">{{ t("timeline") }}</text>
              <view class="timeline-neo flex gap-4">
                <view class="timeline-item-neo flex-1 text-center">
                  <view class="w-2 h-2 bg-primary border border-black mx-auto mb-2"></view>
                  <text class="text-[10px] font-bold uppercase block">{{ t("proposalCreated") }}</text>
                </view>
                <view class="timeline-item-neo flex-1 text-center">
                  <view
                    class="w-2 h-2 border border-black mx-auto mb-2"
                    :class="selectedProposal.status >= 2 ? 'bg-primary' : 'bg-transparent'"
                  ></view>
                  <text class="text-[10px] font-bold uppercase block">{{ t("votingEnds") }}</text>
                </view>
                <view class="timeline-item-neo flex-1 text-center">
                  <view
                    class="w-2 h-2 border border-black mx-auto mb-2"
                    :class="selectedProposal.status === 6 ? 'bg-success' : 'bg-transparent'"
                  ></view>
                  <text class="text-[10px] font-bold uppercase block">{{ t("execution") }}</text>
                </view>
              </view>
            </view>

            <!-- Voting Section -->
            <view
              v-if="selectedProposal.status === 1"
              class="voting-section-neo pt-6 border-t border-dashed border-black/10"
            >
              <text class="section-label-neo text-xs font-black uppercase block mb-4 text-center">{{
                t("castYourVote")
              }}</text>
              <view class="vote-buttons-neo flex gap-4 mb-4">
                <NeoButton
                  variant="primary"
                  block
                  :disabled="!canVoteOnProposal(selectedProposal.id)"
                  @click="castVote(selectedProposal.id, 'for')"
                >
                  {{ t("for") }} ({{ selectedProposal.yesVotes }})
                </NeoButton>
                <NeoButton
                  variant="danger"
                  block
                  :disabled="!canVoteOnProposal(selectedProposal.id)"
                  @click="castVote(selectedProposal.id, 'against')"
                >
                  {{ t("against") }} ({{ selectedProposal.noVotes }})
                </NeoButton>
              </view>
              <view
                v-if="!canVoteOnProposal(selectedProposal.id)"
                class="vote-hint-neo text-center p-2 bg-warning/20 border border-warning/40 text-[10px] font-bold uppercase italic"
              >
                <text v-if="!address">{{ t("connectWallet") }}</text>
                <text v-else-if="!isCandidate">{{ t("notCandidate") }}</text>
                <text v-else>{{ t("alreadyVoted") }}</text>
              </view>
            </view>
          </view>
        </NeoCard>
      </view>
    </view>

    <!-- Create Proposal Tab -->
    <view v-if="activeTab === 'create'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="status-text font-bold uppercase">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard :title="t('createProposal')">
        <view class="form-group-neo mb-6">
          <text class="form-label-neo text-[10px] font-black uppercase opacity-60 mb-2 block">{{
            t("proposalType")
          }}</text>
          <view class="flex gap-2">
            <NeoButton
              :variant="newProposal.type === 0 ? 'primary' : 'secondary'"
              @click="newProposal.type = 0"
              class="flex-1"
              size="sm"
            >
              {{ t("textType") }}
            </NeoButton>
            <NeoButton
              :variant="newProposal.type === 1 ? 'primary' : 'secondary'"
              @click="newProposal.type = 1"
              class="flex-1"
              size="sm"
            >
              {{ t("policyType") }}
            </NeoButton>
          </view>
        </view>

        <view class="form-group-neo mb-6">
          <NeoInput v-model="newProposal.title" :label="t('proposalTitle')" :placeholder="t('titlePlaceholder')" />
        </view>

        <view class="form-group-neo mb-6">
          <NeoInput
            v-model="newProposal.description"
            :label="t('description')"
            type="text"
            :placeholder="t('descPlaceholder')"
          />
        </view>

        <view v-if="newProposal.type === 1" class="policy-fields-neo mb-6 bg-black/5 p-4 border border-black/10">
          <text class="form-label-neo text-[10px] font-black uppercase opacity-60 mb-3 block">{{
            t("policyMethod")
          }}</text>
          <view class="method-grid-neo grid grid-cols-2 gap-2 mb-4">
            <NeoButton
              v-for="method in policyMethods"
              :key="method.value"
              :variant="newProposal.policyMethod === method.value ? 'primary' : 'secondary'"
              size="sm"
              class="!text-[10px] !h-auto !py-2"
              @click="newProposal.policyMethod = method.value"
            >
              {{ method.label }}
            </NeoButton>
          </view>
          <NeoInput
            v-model="newProposal.policyValue"
            :label="t('policyValue')"
            type="number"
            :placeholder="t('policyValuePlaceholder')"
          />
        </view>

        <view class="form-group-neo mb-8">
          <text class="form-label-neo text-[10px] font-black uppercase opacity-60 mb-2 block">{{ t("duration") }}</text>
          <view class="flex gap-2">
            <NeoButton
              v-for="d in durations"
              :key="d.value"
              :variant="newProposal.duration === d.value ? 'primary' : 'secondary'"
              size="sm"
              class="flex-1"
              @click="newProposal.duration = d.value"
            >
              {{ d.label }}
            </NeoButton>
          </view>
        </view>

        <NeoButton variant="primary" size="lg" block @click="createProposal">
          {{ t("submit") }}
        </NeoButton>
      </NeoCard>
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
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { formatCountdown } from "@/shared/utils/format";
import { parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoButton, NeoCard, NeoInput, NeoDoc } from "@/shared/components";

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

const STATUS_ACTIVE = 1;
const STATUS_PASSED = 2;
const STATUS_REJECTED = 3;
const STATUS_REVOKED = 4;
const STATUS_EXPIRED = 5;
const STATUS_EXECUTED = 6;

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
const quorumThreshold = 10;

const activeProposals = computed(() => proposals.value.filter((p) => resolveStatus(p) === STATUS_ACTIVE));
const historyProposals = computed(() => proposals.value.filter((p) => resolveStatus(p) !== STATUS_ACTIVE));

const durations = [
  { label: "3 Days", value: 259200000 },
  { label: "7 Days", value: 604800000 },
  { label: "14 Days", value: 1209600000 },
];

const policyMethods = [
  { value: "setFeePerByte", label: t("methodFeePerByte") },
  { value: "setExecFeeFactor", label: t("methodExecFeeFactor") },
  { value: "setStoragePrice", label: t("methodStoragePrice") },
  { value: "setMaxBlockSize", label: t("methodMaxBlockSize") },
  { value: "setMaxTransactionsPerBlock", label: t("methodMaxTransactions") },
  { value: "setMaxSystemFee", label: t("methodMaxSystemFee") },
];

const newProposal = ref({
  type: 0,
  title: "",
  description: "",
  policyMethod: "",
  policyValue: "",
  duration: 604800000,
});

const getYesPercent = (p: Proposal) => {
  const total = p.yesVotes + p.noVotes;
  return total > 0 ? (p.yesVotes / total) * 100 : 0;
};

const getNoPercent = (p: Proposal) => {
  const total = p.yesVotes + p.noVotes;
  return total > 0 ? (p.noVotes / total) * 100 : 0;
};

const getQuorumPercent = (p: Proposal) => {
  const totalVotes = p.yesVotes + p.noVotes;
  return Math.min((totalVotes / quorumThreshold) * 100, 100);
};

const resolveStatus = (proposal: Proposal) => {
  if (proposal.status === STATUS_ACTIVE && proposal.expiryTime < Date.now()) {
    return STATUS_EXPIRED;
  }
  return proposal.status;
};

const getStatusClass = (status: number) => {
  const classes: Record<number, string> = {
    [STATUS_PASSED]: "passed",
    [STATUS_REJECTED]: "rejected",
    [STATUS_REVOKED]: "revoked",
    [STATUS_EXPIRED]: "expired",
    [STATUS_EXECUTED]: "executed",
  };
  return classes[status] || "";
};

const getStatusText = (status: number) => {
  const texts: Record<number, string> = {
    [STATUS_PASSED]: t("passed"),
    [STATUS_REJECTED]: t("rejected"),
    [STATUS_REVOKED]: t("revoked"),
    [STATUS_EXPIRED]: t("expired"),
    [STATUS_EXECUTED]: t("executed"),
  };
  return texts[status] || "";
};

const showStatus = (msg: string, type: "success" | "error" | "info" = "info") => {
  status.value = { msg, type };
  setTimeout(() => {
    status.value = null;
  }, 4000);
};

const getPolicyMethodLabel = (method?: string) =>
  policyMethods.find((item) => item.value === method)?.label || method || "-";

const hasVoted = (proposalId: number) => Boolean(hasVotedMap.value[proposalId]);

const canVoteOnProposal = (proposalId: number) => {
  if (!address.value) return false;
  if (!isCandidate.value) return false;
  return !hasVoted(proposalId);
};

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

const createProposal = async () => {
  const title = newProposal.value.title.trim();
  const description = newProposal.value.description.trim();
  if (!title || !description) {
    showStatus(t("fillAllFields"), "error");
    return;
  }
  let policyValueNumber: number | null = null;
  if (newProposal.value.type === 1) {
    const rawPolicyValue = newProposal.value.policyValue.trim();
    if (!newProposal.value.policyMethod || !rawPolicyValue) {
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

  const policyData =
    newProposal.value.type === 1
      ? JSON.stringify({ method: newProposal.value.policyMethod, value: policyValueNumber })
      : "";

  try {
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "CreateProposal",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: newProposal.value.type },
        { type: "String", value: title },
        { type: "String", value: description },
        { type: "ByteString", value: policyData },
        { type: "Integer", value: newProposal.value.duration },
      ],
    });
    showStatus(t("proposalSubmitted"), "success");
    newProposal.value = { type: 0, title: "", description: "", policyMethod: "", policyValue: "", duration: 604800000 };
    await loadProposals();
    activeTab.value = "active";
  } catch (e: any) {
    showStatus(e.message || t("proposalSubmitted"), "error");
  }
};

const parseProposal = (data: Record<string, any>): Proposal => {
  const policyData = String(data.policyData || "");
  let policyMethod: string | undefined;
  let policyValue: string | undefined;
  if (policyData) {
    try {
      const parsed = JSON.parse(policyData);
      policyMethod = parsed.method;
      policyValue = parsed.value;
    } catch {
      policyValue = policyData;
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

const loadProposals = async () => {
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) return;
  try {
    loadingProposals.value = true;
    const countRes = await invokeRead({ contractHash: contractHash.value, operation: "GetProposalCount" });
    const count = Number(parseInvokeResult(countRes) || 0);
    const list: Proposal[] = [];
    for (let id = 1; id <= count; id += 1) {
      const proposalRes = await invokeRead({
        contractHash: contractHash.value,
        operation: "GetProposal",
        args: [{ type: "Integer", value: id }],
      });
      const proposalData = parseInvokeResult(proposalRes);
      if (proposalData) {
        list.push(parseProposal(proposalData));
      }
    }
    proposals.value = list.sort((a, b) => b.id - a.id);
  } catch (e: any) {
    showStatus(e.message || t("failedToLoadProposals"), "error");
  } finally {
    loadingProposals.value = false;
  }
};

const refreshCandidateStatus = async () => {
  if (!address.value || !contractHash.value) {
    isCandidate.value = false;
    votingPower.value = 0;
    candidateLoaded.value = true;
    return;
  }
  try {
    const candidateRes = await invokeRead({
      contractHash: contractHash.value,
      operation: "IsCandidate",
      args: [{ type: "Hash160", value: address.value }],
    });
    isCandidate.value = Boolean(parseInvokeResult(candidateRes));
    votingPower.value = isCandidate.value ? 1 : 0;
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
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.status-text { font-size: 12px; }

.loading-state-neo { font-family: $font-mono; font-weight: $font-weight-black; text-transform: uppercase; }

.power-label-neo { font-size: 8px; font-weight: $font-weight-black; opacity: 0.6; }
.power-value-neo { font-family: $font-mono; }

.warning-banner-neo { background: var(--brutal-orange); color: black; border: 2px solid black; box-shadow: 4px 4px 0 black; }

.proposal-meta-neo { display: flex; flex-direction: column; gap: 2px; }
.proposal-id-neo { font-size: 10px; font-weight: $font-weight-black; }
.proposal-type-neo { font-size: 8px; padding: 2px 4px; border: 1px solid black; display: inline-block; width: fit-content; }
.proposal-countdown-neo { background: black !important; color: white !important; border: 1px solid black; }

.proposal-title-neo { line-height: 1.2; letter-spacing: -0.5px; }

.quorum-header-neo { font-size: 8px; font-weight: $font-weight-black; }
.neo-progress { height: 12px; background: white; border: 2px solid black; border-radius: 0; position: relative; overflow: hidden; }
.neo-progress-fill { height: 100%; background: var(--neo-purple); border-right: 2px solid black; }

.vote-stats-neo { font-size: 10px; font-weight: $font-weight-black; }

.status-badge-neo { border: 2px solid black; box-shadow: 2px 2px 0 black; }
.status-badge-neo.passed { background: var(--neo-green); color: black; }
.status-badge-neo.rejected { background: var(--brutal-red); color: white; }

.modal-overlay-neo {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 100; display: flex; align-items: center; justify-content: center; padding: $space-4;
}
.modal-content-neo { width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }

.policy-details-neo { background: #f0f0f0; border: 2px solid black; box-shadow: 4px 4px 0 black; }
.section-label-neo { font-size: 10px; font-weight: $font-weight-black; border-bottom: 2px solid black; padding-bottom: 4px; }

.timeline-neo { position: relative; }
.timeline-item-neo text { font-size: 8px; opacity: 0.6; }

.vote-hint-neo { background: var(--brutal-yellow); border: 2px solid black; color: black; }

.form-label-neo { font-size: 8px; font-weight: $font-weight-black; }
.method-grid-neo { gap: $space-2; }

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
```
