<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-5 mb-4">
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

    <!-- Vote Tab -->
    <view v-if="activeTab === 'vote' && chainType !== 'evm'" class="tab-content scrollable">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : 'success'"
        class="mb-4 text-center font-bold"
      >
        <text>{{ status.msg }}</text>
      </NeoCard>

      <!-- Network Stats -->
      <NeoCard :title="t('networkStats')" variant="erobo-neo" class="mb-4">
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">{{ t("totalCandidates") }}</text>
            <text class="stat-value">{{ candidates.length }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">{{ t("totalNetworkVotes") }}</text>
            <text class="stat-value">{{ formatVotes(totalNetworkVotes) }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">{{ t("blockHeight") }}</text>
            <text class="stat-value">{{ blockHeight.toLocaleString() }}</text>
          </view>
        </view>
      </NeoCard>

      <!-- Candidate List -->
      <CandidateList
        :candidates="candidates"
        :selected-candidate="selectedCandidate"
        :user-voted-public-key="userVotedPublicKey"
        :total-votes="totalNetworkVotes"
        :is-loading="candidatesLoading"
        :t="t as any"
        @select="selectCandidate"
        @view-details="openCandidateDetail"
      />

      <!-- Vote Form -->
      <NeoCard :title="t('castVote')" variant="erobo">
        <view class="vote-form">
          <NeoCard v-if="selectedCandidate" variant="erobo-neo" flat class="selected-candidate-card glass-panel">
            <text class="selected-label">{{ t("votingFor") }}</text>
            <view class="candidate-badge">
              <text class="candidate-name">{{
                selectedCandidate.name || shortenAddress(selectedCandidate.address)
              }}</text>
              <text class="candidate-key">{{ shortenAddress(selectedCandidate.publicKey) }}</text>
            </view>
          </NeoCard>

          <NeoCard v-else variant="warning" flat class="no-candidate-card">
            <text class="warning-text text-center">{{ t("selectCandidateFirst") }}</text>
          </NeoCard>

          <NeoButton
            variant="primary"
            size="lg"
            block
            :disabled="!selectedCandidate || !address || isLoading"
            :loading="isLoading"
            @click="handleVote"
          >
            {{ t("voteNow") }}
          </NeoButton>

          <view v-if="!address" class="connect-hint">
            <text class="hint-text">{{ t("connectWallet") }}</text>
          </view>
        </view>
      </NeoCard>
    </view>

    <!-- Info Tab -->
    <InfoTab v-if="activeTab === 'info'" :address="address" :t="t as any" />

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

    <!-- Candidate Detail Modal -->
    <CandidateDetailModal
      v-if="showDetailModal"
      :candidate="detailCandidate"
      :rank="detailRank"
      :total-votes="totalNetworkVotes"
      :is-user-voted="detailCandidate?.publicKey === userVotedPublicKey"
      :can-vote="!!address && !isLoading"
      :t="t as any"
      @close="closeCandidateDetail"
      @vote="handleVoteFromModal"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, useGovernance } from "@neo/uniapp-sdk";
import type { Candidate } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import CandidateList from "./components/CandidateList.vue";
import CandidateDetailModal from "./components/CandidateDetailModal.vue";
import InfoTab from "./components/InfoTab.vue";

const translations = {
  vote: { en: "Vote", zh: "投票" },
  info: { en: "Info", zh: "信息" },
  title: { en: "Candidate Vote", zh: "候选人投票" },
  subtitle: { en: "Neo Governance Voting", zh: "Neo 治理投票" },
  networkStats: { en: "Network Stats", zh: "网络统计" },
  totalCandidates: { en: "Candidates", zh: "候选人数" },
  totalNetworkVotes: { en: "Total Votes", zh: "总票数" },
  blockHeight: { en: "Block Height", zh: "区块高度" },
  castVote: { en: "Cast Your Vote", zh: "投出您的票" },
  voteNow: { en: "Vote Now", zh: "立即投票" },
  processing: { en: "Processing...", zh: "处理中..." },
  voteSuccess: { en: "Vote submitted successfully!", zh: "投票提交成功！" },
  voteFailed: { en: "Vote failed", zh: "投票失败" },
  connectWallet: { en: "Connect wallet to vote", zh: "连接钱包以投票" },
  failedToLoad: { en: "Failed to load candidates", zh: "加载候选人失败" },
  selectCandidate: { en: "Select Candidate", zh: "选择候选人" },
  loadingCandidates: { en: "Loading candidates...", zh: "加载候选人中..." },
  noCandidates: { en: "No candidates available", zh: "暂无候选人" },
  votes: { en: "votes", zh: "票" },
  votingFor: { en: "Voting for", zh: "投票给" },
  selectCandidateFirst: { en: "Please select a candidate above", zh: "请先在上方选择候选人" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Vote for Neo N3 consensus node candidates",
    zh: "为 Neo N3 共识节点候选人投票",
  },
  docDescription: {
    en: "Participate in Neo network governance by voting for consensus node candidates. Your NEO balance determines your voting power.",
    zh: "通过为共识节点候选人投票参与 Neo 网络治理。您的 NEO 余额决定您的投票权重。",
  },
  step1: { en: "Connect your Neo wallet.", zh: "连接您的 Neo 钱包。" },
  step2: { en: "Browse and select a candidate.", zh: "浏览并选择候选人。" },
  step3: { en: "Click Vote Now to cast your vote.", zh: "点击立即投票来投出您的票。" },
  step4: { en: "Your NEO balance is your voting power.", zh: "您的 NEO 余额就是您的投票权重。" },
  feature1Name: { en: "On-Chain Voting", zh: "链上投票" },
  feature1Desc: { en: "Votes are recorded directly on the Neo blockchain.", zh: "投票直接记录在 Neo 区块链上。" },
  feature2Name: { en: "NEO-Based Power", zh: "基于 NEO 的权重" },
  feature2Desc: { en: "Your voting power equals your NEO holdings.", zh: "您的投票权重等于您持有的 NEO 数量。" },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需要 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
  // InfoTab translations
  aboutVoting: { en: "About Voting", zh: "关于投票" },
  votingDescription: {
    en: "Neo uses a delegated Byzantine Fault Tolerance (dBFT) consensus mechanism. NEO holders can vote for consensus node candidates to participate in network governance. Your voting power is determined by your NEO balance.",
    zh: "Neo 使用委托拜占庭容错 (dBFT) 共识机制。NEO 持有者可以为共识节点候选人投票参与网络治理。您的投票权重由您的 NEO 余额决定。",
  },
  howItWorks: { en: "How It Works", zh: "工作原理" },
  yourWallet: { en: "Your Wallet", zh: "您的钱包" },
  wallet: { en: "Wallet", zh: "钱包" },
  notConnected: { en: "Not Connected", zh: "未连接" },
  votingPower: { en: "Voting Power", zh: "投票权重" },
  basedOnNeo: { en: "Based on NEO balance", zh: "基于 NEO 余额" },
  // CandidateDetailModal translations
  candidateDetails: { en: "Candidate Details", zh: "候选人详情" },
  name: { en: "Name", zh: "名称" },
  anonymous: { en: "Anonymous", zh: "匿名" },
  address: { en: "Address", zh: "地址" },
  publicKey: { en: "Public Key", zh: "公钥" },
  totalVotes: { en: "Total Votes", zh: "总票数" },
  status: { en: "Status", zh: "状态" },
  activeValidator: { en: "Active Validator", zh: "活跃验证者" },
  standby: { en: "Standby", zh: "待命" },
  voteForCandidate: { en: "Vote for This Candidate", zh: "投票给此候选人" },
  alreadyVotedFor: { en: "You have voted for this candidate", zh: "您已投票给此候选人" },
  yourVote: { en: "Your Vote", zh: "您的投票" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-candidate-vote";
const NEO_CONTRACT = "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5";

const { address, connect, invokeContract, chainType, switchChain } = useWallet() as any;
const { getCandidates } = useGovernance(APP_ID);

const navTabs: NavTab[] = [
  { id: "vote", icon: "checkbox", label: t("vote") },
  { id: "info", icon: "info", label: t("info") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("vote");
const isLoading = ref(false);
const status = ref<{ msg: string; type: string } | null>(null);

// Candidate state
const candidates = ref<Candidate[]>([]);
const selectedCandidate = ref<Candidate | null>(null);
const totalNetworkVotes = ref("0");
const blockHeight = ref(0);
const candidatesLoading = ref(false);

// Modal state
const showDetailModal = ref(false);
const detailCandidate = ref<Candidate | null>(null);
const detailRank = ref(1);

// User's voted candidate
const userVotedPublicKey = ref<string | null>(null);

const CANDIDATES_CACHE_KEY = "candidate_vote_candidates_cache";

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 5000);
};

const shortenAddress = (addr: string): string => {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatVotes = (votes: string): string => {
  const num = BigInt(votes || "0");
  if (num >= BigInt(1e12)) {
    return (Number(num / BigInt(1e10)) / 100).toFixed(2) + "T";
  }
  if (num >= BigInt(1e9)) {
    return (Number(num / BigInt(1e7)) / 100).toFixed(2) + "B";
  }
  if (num >= BigInt(1e6)) {
    return (Number(num / BigInt(1e4)) / 100).toFixed(2) + "M";
  }
  if (num >= BigInt(1e3)) {
    return (Number(num / BigInt(10)) / 100).toFixed(2) + "K";
  }
  return votes || "0";
};

const selectCandidate = (candidate: Candidate) => {
  selectedCandidate.value = candidate;
};

const openCandidateDetail = (candidate: Candidate, rank: number) => {
  detailCandidate.value = candidate;
  detailRank.value = rank;
  showDetailModal.value = true;
};

const closeCandidateDetail = () => {
  showDetailModal.value = false;
  detailCandidate.value = null;
};

const handleVoteFromModal = async (candidate: Candidate) => {
  selectedCandidate.value = candidate;
  closeCandidateDetail();
  await handleVote();
};

// Get user's current vote from chain
const loadUserVote = async () => {
  if (!address.value) {
    userVotedPublicKey.value = null;
    return;
  }
  try {
    const result = await invokeContract({
      scriptHash: NEO_CONTRACT,
      operation: "getAccountState",
      args: [{ type: "Hash160", value: address.value }],
      signers: [],
    });
    // Result contains voteTo field with the public key user voted for
    if (result && result.voteTo) {
      userVotedPublicKey.value = result.voteTo;
    } else {
      userVotedPublicKey.value = null;
    }
  } catch (e) {
    console.warn("[CandidateVote] Failed to get user vote:", e);
    userVotedPublicKey.value = null;
  }
};

const loadCandidates = async () => {
  // Try cache first
  try {
    const cached = uni.getStorageSync(CANDIDATES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      candidates.value = parsed.candidates || [];
      totalNetworkVotes.value = parsed.totalVotes || "0";
      blockHeight.value = parsed.blockHeight || 0;
    }
  } catch {}

  candidatesLoading.value = true;
  try {
    const response = await getCandidates();
    candidates.value = response.candidates || [];
    totalNetworkVotes.value = response.totalVotes || "0";
    blockHeight.value = response.blockHeight || 0;

    // Save to cache
    uni.setStorageSync(
      CANDIDATES_CACHE_KEY,
      JSON.stringify({
        candidates: candidates.value,
        totalVotes: totalNetworkVotes.value,
        blockHeight: blockHeight.value,
      }),
    );
  } catch (e: any) {
    console.warn("[CandidateVote] Failed to load candidates:", e);
    if (candidates.value.length === 0) {
      showStatus(t("failedToLoad"), "error");
    }
  } finally {
    candidatesLoading.value = false;
  }
};

const handleVote = async () => {
  if (isLoading.value || !selectedCandidate.value) return;

  if (!address.value) {
    await connect();
  }
  if (!address.value) {
    showStatus(t("connectWallet"), "error");
    return;
  }

  isLoading.value = true;
  try {
    // Call the native NEO contract's vote method
    // vote(account, voteTo) - voteTo is the public key of the candidate
    await invokeContract({
      scriptHash: NEO_CONTRACT,
      operation: "vote",
      args: [
        { type: "Hash160", value: address.value },
        { type: "PublicKey", value: selectedCandidate.value.publicKey },
      ],
    });

    showStatus(t("voteSuccess"), "success");
    // Refresh candidates and user vote to show updated state
    await Promise.all([loadCandidates(), loadUserVote()]);
  } catch (e: any) {
    console.error("[CandidateVote] Vote failed:", e);
    showStatus(e.message || t("voteFailed"), "error");
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await connect();
  await Promise.all([loadCandidates(), loadUserVote()]);
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-weight: 700;
  font-family: $font-family;
  font-feature-settings: "tnum";
  font-size: 18px;
  color: white;
}

.vote-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.selected-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #00e599;
  letter-spacing: 0.1em;
  display: block;
  margin-bottom: 4px;
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
}

.candidate-badge {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.candidate-name {
  font-weight: 700;
  font-size: 16px;
  color: white;
  font-family: $font-family;
}

.candidate-key {
  font-size: 11px;
  font-family: $font-mono;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
}

.warning-text {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #FDE047; /* Brutal Yellow from tokens */
}



.warning-text {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #ffde59;
}

.connect-hint {
  text-align: center;
  padding: 8px;
}

.hint-text {
  font-size: 12px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}
</style>
