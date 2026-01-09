<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Vote Tab -->
    <VoteTab
      v-if="activeTab === 'vote'"
      :status="status"
      :current-epoch="currentEpoch"
      :epoch-end-time="epochEndTime"
      :epoch-total-votes="epochTotalVotes"
      :current-strategy="currentStrategy"
      v-model:voteWeight="voteWeight"
      :is-loading="isLoading"
      :pending-rewards-value="pendingRewardsValue"
      :has-claimed="hasClaimed"
      :candidates="candidates"
      :selected-candidate="selectedCandidate"
      :total-votes="totalNetworkVotes"
      :candidates-loading="candidatesLoading"
      :t="t as any"
      @registerVote="registerVote"
      @claimRewards="claimRewards"
      @selectCandidate="selectCandidate"
    />

    <!-- Info Tab -->
    <InfoTab
      v-if="activeTab === 'info'"
      :address="address"
      :contract-hash="contractHash"
      :epoch-end-time="epochEndTime"
      :current-strategy="currentStrategy"
      :t="t as any"
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useWallet, useGovernance } from "@neo/uniapp-sdk";
import type { Candidate } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { formatNumber } from "@/shared/utils/format";
import { parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import VoteTab from "./components/VoteTab.vue";
import InfoTab from "./components/InfoTab.vue";

const translations = {
  vote: { en: "Vote", zh: "投票" },
  info: { en: "Info", zh: "信息" },
  title: { en: "Candidate Vote", zh: "候选人投票" },
  subtitle: { en: "Neo Governance Voting", zh: "Neo 治理投票" },
  epochOverview: { en: "Epoch Overview", zh: "周期概览" },
  currentEpoch: { en: "Current Epoch", zh: "当前周期" },
  epochEndsIn: { en: "Ends In", zh: "剩余时间" },
  epochEnded: { en: "Ended", zh: "已结束" },
  epochTotalVotes: { en: "Total Votes", zh: "总票数" },
  currentStrategy: { en: "Strategy", zh: "策略" },
  strategySelf: { en: "Self", zh: "自持" },
  strategyNeoBurger: { en: "NeoBurger", zh: "NeoBurger" },
  registerVote: { en: "Register Vote", zh: "登记投票" },
  voteWeight: { en: "Vote Weight", zh: "投票权重" },
  voteWeightPlaceholder: { en: "1.0", zh: "1.0" },
  minVoteWeight: { en: "Minimum 1 NEO", zh: "最低 1 NEO" },
  rewards: { en: "Rewards", zh: "奖励" },
  pendingRewards: { en: "Pending Rewards", zh: "待领取奖励" },
  claimRewards: { en: "Claim Rewards", zh: "领取奖励" },
  processing: { en: "Processing...", zh: "处理中..." },
  voteRegistered: { en: "Vote registered", zh: "投票已登记" },
  voteFailed: { en: "Vote failed", zh: "投票失败" },
  claimFailed: { en: "Claim failed", zh: "领取失败" },
  rewardsClaimed: { en: "Rewards claimed", zh: "奖励已领取" },
  noRewards: { en: "No rewards to claim", zh: "暂无奖励可领取" },
  invalidWeight: { en: "Enter at least 1 NEO", zh: "请输入不少于 1 NEO" },
  connectWallet: { en: "Connect wallet first", zh: "请先连接钱包" },
  failedToLoad: { en: "Failed to load data", zh: "加载数据失败" },
  networkInfo: { en: "Network Info", zh: "网络信息" },
  wallet: { en: "Wallet", zh: "钱包" },
  contract: { en: "Contract", zh: "合约" },
  epochEndsAt: { en: "Epoch Ends", zh: "周期结束" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Earn GAS rewards by registering your NEO vote weight",
    zh: "通过登记 NEO 投票权重赚取 GAS 奖励",
  },
  docDescription: {
    en: "Register your vote weight to earn proportional GAS rewards each epoch.",
    zh: "登记投票权重并按周期领取比例 GAS 奖励。",
  },
  step1: { en: "Connect your wallet.", zh: "连接你的钱包。" },
  step2: { en: "Register your vote weight.", zh: "登记你的投票权重。" },
  step3: { en: "Claim rewards after each epoch.", zh: "每个周期结束后领取奖励。" },
  step4: { en: "Re-register each epoch to continue earning.", zh: "每个周期重新登记以继续赚取。" },
  feature1Name: { en: "On-Chain Accounting", zh: "链上记账" },
  feature1Desc: { en: "Vote weights and rewards are stored on-chain.", zh: "投票权重与奖励都在链上记录。" },
  feature2Name: { en: "Proportional Rewards", zh: "比例奖励" },
  feature2Desc: { en: "Rewards scale with your registered vote weight.", zh: "奖励随投票权重按比例发放。" },
  // Candidate selection translations
  selectCandidate: { en: "Select Candidate", zh: "选择候选人" },
  loadingCandidates: { en: "Loading candidates...", zh: "加载候选人中..." },
  noCandidates: { en: "No candidates available", zh: "暂无候选人" },
  votes: { en: "votes", zh: "票" },
  totalNetworkVotes: { en: "Total Network Votes", zh: "全网总票数" },
  votingFor: { en: "Voting for", zh: "投票给" },
  selectCandidateFirst: { en: "Please select a candidate above", zh: "请先在上方选择候选人" },
  noCandidateSelected: { en: "No candidate selected", zh: "未选择候选人" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-candidate-vote";
const { address, connect, invokeRead, invokeContract, getContractHash } = useWallet();
const { getCandidates } = useGovernance(APP_ID);

const navTabs: NavTab[] = [
  { id: "vote", icon: "checkbox", label: t("vote") },
  { id: "info", icon: "info", label: t("info") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("vote");
const isLoading = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);
const contractHash = ref<string | null>(null);

const voteWeight = ref("");
const currentEpoch = ref(0);
const epochEndTime = ref(0);
const epochTotalVotes = ref(0);
const currentStrategy = ref("");
const pendingRewardsValue = ref(0);
const hasClaimed = ref(false);

// Candidate state
const candidates = ref<Candidate[]>([]);
const selectedCandidate = ref<Candidate | null>(null);
const totalNetworkVotes = ref("");
const candidatesLoading = ref(false);

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 5000);
};

const readMethod = async (operation: string, args: any[] = []) => {
  const result = await invokeRead({ contractHash: (contractHash.value as string) || undefined, operation, args });
  return parseInvokeResult(result);
};

const EPOCH_CACHE_KEY = "candidate_vote_epoch_cache";
const REWARDS_CACHE_KEY = "candidate_vote_rewards_cache";
const CANDIDATES_CACHE_KEY = "candidate_vote_candidates_cache";

const loadEpochData = async () => {
  // Try cache first
  try {
    const cached = uni.getStorageSync(EPOCH_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      currentEpoch.value = parsed.currentEpoch;
      epochEndTime.value = parsed.epochEndTime;
      epochTotalVotes.value = parsed.epochTotalVotes;
      currentStrategy.value = parsed.currentStrategy;
    }
  } catch {}

  try {
    if (!contractHash.value) {
      contractHash.value = await getContractHash();
    }
    const epochValue = await readMethod("CurrentEpoch");
    const epochNumber = Number(epochValue || 0);
    currentEpoch.value = epochNumber;

    const [endValue, totalValue, strategyValue] = await Promise.all([
      readMethod("EpochEndTime"),
      readMethod("EpochTotalVotes", [{ type: "Integer", value: epochNumber }]),
      readMethod("CurrentStrategy"),
    ]);

    epochEndTime.value = Number(endValue || 0);
    epochTotalVotes.value = Number(totalValue || 0);
    currentStrategy.value = typeof strategyValue === "string" ? strategyValue : String(strategyValue || "");
    
    // Save to cache
    uni.setStorageSync(EPOCH_CACHE_KEY, JSON.stringify({
      currentEpoch: currentEpoch.value,
      epochEndTime: epochEndTime.value,
      epochTotalVotes: epochTotalVotes.value,
      currentStrategy: currentStrategy.value
    }));
  } catch (e: any) {
    if (currentEpoch.value === 0) {
      showStatus(e.message || t("failedToLoad"), "error");
    }
  }
};

const loadRewards = async () => {
  if (!address.value || currentEpoch.value <= 1) {
    pendingRewardsValue.value = 0;
    hasClaimed.value = false;
    return;
  }
  
  // Try cache first
  const cacheKey = `${REWARDS_CACHE_KEY}_${address.value}`;
  try {
    const cached = uni.getStorageSync(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.epoch === currentEpoch.value - 1) {
        pendingRewardsValue.value = parsed.pending;
        hasClaimed.value = parsed.claimed;
      }
    }
  } catch {}

  const epochId = currentEpoch.value - 1;
  try {
    const [pendingValue, claimedValue] = await Promise.all([
      readMethod("GetPendingRewards", [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: epochId },
      ]),
      readMethod("HasClaimed", [
        { type: "Hash160", value: address.value },
        { type: "Integer", value: epochId },
      ]),
    ]);
    pendingRewardsValue.value = Number(pendingValue || 0) / 1e8;
    hasClaimed.value = Boolean(claimedValue);
    
    // Save to cache
    uni.setStorageSync(cacheKey, JSON.stringify({
      epoch: epochId,
      pending: pendingRewardsValue.value,
      claimed: hasClaimed.value
    }));
  } catch {
    if (pendingRewardsValue.value === 0) {
      pendingRewardsValue.value = 0;
      hasClaimed.value = false;
    }
  }
};

const loadCandidates = async () => {
  // Try cache first
  try {
    const cached = uni.getStorageSync(CANDIDATES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      candidates.value = parsed.candidates;
      totalNetworkVotes.value = parsed.totalVotes;
    }
  } catch {}

  candidatesLoading.value = true;
  try {
    const response = await getCandidates();
    candidates.value = response.candidates;
    totalNetworkVotes.value = response.totalVotes;
    
    // Save to cache
    uni.setStorageSync(CANDIDATES_CACHE_KEY, JSON.stringify({
      candidates: candidates.value,
      totalVotes: totalNetworkVotes.value
    }));
  } catch (e: any) {
    console.warn("[CandidateVote] Failed to load candidates:", e);
  } finally {
    candidatesLoading.value = false;
  }
};

const selectCandidate = (candidate: Candidate) => {
  selectedCandidate.value = candidate;
};

const registerVote = async () => {
  if (isLoading.value) return;
  if (!address.value) {
    await connect();
  }
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    showStatus(t("failedToLoad"), "error");
    return;
  }

  const weight = parseFloat(voteWeight.value);
  if (!Number.isFinite(weight) || weight < 1) {
    showStatus(t("invalidWeight"), "error");
    return;
  }

  const weightInt = Math.floor(weight * 1e8).toString();

  try {
    isLoading.value = true;
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "RegisterVote",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: weightInt },
      ],
    });
    showStatus(t("voteRegistered"), "success");
    voteWeight.value = "";
    await loadEpochData();
    await loadRewards();
  } catch (e: any) {
    showStatus(e.message || t("voteFailed"), "error");
  } finally {
    isLoading.value = false;
  }
};

const claimRewards = async () => {
  if (isLoading.value) return;
  if (!address.value) {
    await connect();
  }
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }
  if (pendingRewardsValue.value <= 0 || hasClaimed.value || currentEpoch.value <= 1) {
    showStatus(t("noRewards"), "error");
    return;
  }
  if (!contractHash.value) {
    contractHash.value = await getContractHash();
  }
  if (!contractHash.value) {
    showStatus(t("failedToLoad"), "error");
    return;
  }

  const epochId = currentEpoch.value - 1;
  try {
    isLoading.value = true;
    await invokeContract({
      scriptHash: contractHash.value as string,
      operation: "ClaimRewards",
      args: [
        { type: "Hash160", value: address.value as string },
        { type: "Integer", value: epochId },
      ],
    });
    showStatus(t("rewardsClaimed"), "success");
    await loadRewards();
  } catch (e: any) {
    showStatus(e.message || t("claimFailed"), "error");
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await connect();
  await Promise.all([loadEpochData(), loadCandidates()]);
  await loadRewards();
});
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
