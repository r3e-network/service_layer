<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Vote Tab -->
    <view v-if="activeTab === 'vote'" class="tab-content scrollable">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Vote Summary Card -->
      <view class="vote-summary">
        <view class="summary-item">
          <text class="summary-label">{{ t("totalVotes") }}</text>
          <text class="summary-value">{{ formatVotes(totalVotes) }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">{{ t("totalCandidates") }}</text>
          <text class="summary-value">{{ candidates.length }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-label">{{ t("yourVote") }}</text>
          <text class="summary-value">{{ selectedCandidate ? "✓" : "—" }}</text>
        </view>
      </view>

      <NeoCard :title="t('candidates')" variant="default">
        <view v-if="loadingCandidates" class="loading">
          <text>{{ t("loadingCandidates") }}</text>
        </view>
        <view v-else-if="candidates.length === 0" class="empty">
          <text>{{ t("noCandidates") }}</text>
        </view>
        <view v-else class="candidate-list">
          <view
            v-for="(c, index) in sortedCandidates"
            :key="c.address"
            :class="[
              'candidate-card',
              {
                selected: selectedCandidate === c.address,
                leading: index === 0 && parseInt(c.votes) > 0,
              },
            ]"
            @click="selectCandidate(c.address)"
          >
            <view class="candidate-header">
              <view class="candidate-avatar">
                <text class="avatar-text">{{ getInitials(c.name || c.address) }}</text>
              </view>
              <view class="candidate-info">
                <text class="candidate-name">{{ c.name || shortenAddress(c.address) }}</text>
                <text class="candidate-address">{{ shortenAddress(c.address) }}</text>
              </view>
              <view class="candidate-badges">
                <view v-if="index === 0 && parseInt(c.votes) > 0" class="leading-badge">
                  <text>{{ t("leading") }}</text>
                </view>
                <view v-if="c.active" class="active-badge">
                  <text>{{ t("active") }}</text>
                </view>
              </view>
            </view>

            <view class="vote-stats">
              <view class="vote-count">
                <text class="vote-number">{{ formatVotes(c.votes) }}</text>
                <text class="vote-label">{{ t("votes") }}</text>
              </view>
              <view class="vote-percentage">
                <text>{{ getVotePercentage(c.votes) }}%</text>
              </view>
            </view>

            <view class="progress-bar">
              <view class="progress-fill" :style="{ width: getVotePercentage(c.votes) + '%' }"></view>
            </view>

            <view v-if="selectedCandidate === c.address" class="selected-indicator">
              <text>✓ {{ t("selected") }}</text>
            </view>
          </view>
        </view>
      </NeoCard>

      <NeoCard :title="t('castYourVote')" variant="accent">
        <view class="ballot-box">
          <view class="ballot-icon">🗳️</view>
          <view class="vote-info">
            <text class="vote-label">{{ t("selectedCandidate") }}</text>
            <text class="vote-value">
              {{
                selectedCandidate ? getCandidateName(selectedCandidate) || shortenAddress(selectedCandidate) : t("none")
              }}
            </text>
          </view>
        </view>
        <NeoButton
          variant="primary"
          size="lg"
          block
          :disabled="!selectedCandidate"
          :loading="isLoading"
          @click="castVote"
        >
          {{ t("vote") }}
        </NeoButton>
      </NeoCard>
    </view>

    <!-- Info Tab -->
    <view v-if="activeTab === 'info'" class="tab-content scrollable">
      <NeoCard :title="t('networkInfo')" variant="default">
        <NeoStats :stats="networkStats" />
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
import { ref, onMounted, computed } from "vue";
import { useGovernance } from "@neo/uniapp-sdk";
import type { Candidate } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import { NeoButton, NeoCard, NeoStats, NeoDoc } from "@/shared/components";
import type { StatItem } from "@/shared/components";

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-candidate-vote";

const translations = {
  vote: { en: "Vote", zh: "投票" },
  info: { en: "Info", zh: "信息" },
  title: { en: "Candidate Vote", zh: "候选人投票" },
  subtitle: { en: "Neo Governance Voting", zh: "Neo 治理投票" },
  candidates: { en: "Candidates", zh: "候选人" },
  loadingCandidates: { en: "Loading candidates...", zh: "加载候选人中..." },
  noCandidates: { en: "No candidates found", zh: "未找到候选人" },
  votes: { en: "votes", zh: "票" },
  active: { en: "Active", zh: "活跃" },
  leading: { en: "Leading", zh: "领先" },
  selected: { en: "Selected", zh: "已选" },
  totalCandidates: { en: "Total Candidates", zh: "候选人数" },
  yourVote: { en: "Your Vote", zh: "您的投票" },
  castYourVote: { en: "Cast Your Vote", zh: "投票" },
  selectedCandidate: { en: "Selected Candidate", zh: "已选候选人" },
  none: { en: "None", zh: "无" },
  processing: { en: "Processing...", zh: "处理中..." },
  vote: { en: "Vote", zh: "投票" },
  networkInfo: { en: "Network Info", zh: "网络信息" },
  totalVotes: { en: "Total Votes", zh: "总票数" },
  blockHeight: { en: "Block Height", zh: "区块高度" },
  submittingVote: { en: "Submitting vote...", zh: "提交投票中..." },
  voteSubmitted: { en: "Vote submitted!", zh: "投票已提交！" },
  voteFailed: { en: "Vote failed", zh: "投票失败" },
  failedToLoad: { en: "Failed to load candidates", zh: "加载候选人失败" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Learn more about this MiniApp.", zh: "了解更多关于此小程序的信息。" },
  docDescription: {
    en: "Professional documentation for this application is coming soon.",
    zh: "此应用程序的专业文档即将推出。",
  },
  step1: { en: "Open the application.", zh: "打开应用程序。" },
  step2: { en: "Follow the on-screen instructions.", zh: "按照屏幕上的指示操作。" },
  step3: { en: "Enjoy the secure experience!", zh: "享受安全体验！" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全保护" },
  feature1Desc: { en: "Hardware-level isolation.", zh: "硬件级隔离。" },
  feature2Name: { en: "On-Chain Fairness", zh: "链上公正" },
  feature2Desc: { en: "Provably fair execution.", zh: "可证明公平的执行。" },
};

const t = createT(translations);

const navTabs = [
  { id: "vote", icon: "checkbox", label: t("vote") },
  { id: "info", icon: "info", label: t("info") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("vote");

const { isLoading, getCandidates, vote } = useGovernance(APP_ID);

const candidates = ref<Candidate[]>([]);
const selectedCandidate = ref<string | null>(null);
const totalVotes = ref("0");
const blockHeight = ref(0);
const loadingCandidates = ref(true);
const status = ref<{ msg: string; type: string } | null>(null);

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const formatVotes = (v: string) => parseInt(v).toLocaleString();

// Get initials for avatar
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

// Get candidate name by address
const getCandidateName = (address: string): string | null => {
  const candidate = candidates.value.find((c) => c.address === address);
  return candidate?.name || null;
};

// Calculate vote percentage
const getVotePercentage = (votes: string): string => {
  const total = parseInt(totalVotes.value);
  if (total === 0) return "0";
  const percentage = (parseInt(votes) / total) * 100;
  return percentage.toFixed(1);
};

// Sort candidates by votes (descending)
const sortedCandidates = computed(() => {
  return [...candidates.value].sort((a, b) => parseInt(b.votes) - parseInt(a.votes));
});

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 5000);
};

const selectCandidate = (address: string) => {
  selectedCandidate.value = address;
};

const loadCandidates = async () => {
  loadingCandidates.value = true;
  try {
    const res = await getCandidates();
    candidates.value = res.candidates;
    totalVotes.value = res.totalVotes;
    blockHeight.value = res.blockHeight;
  } catch (e: any) {
    showStatus(e.message || t("failedToLoad"), "error");
  } finally {
    loadingCandidates.value = false;
  }
};

const castVote = async () => {
  if (!selectedCandidate.value || isLoading.value) return;
  try {
    showStatus(t("submittingVote"), "loading");
    await vote(selectedCandidate.value, "1", true);
    showStatus(t("voteSubmitted"), "success");
    await loadCandidates();
  } catch (e: any) {
    showStatus(e.message || t("voteFailed"), "error");
  }
};

const networkStats = computed<StatItem[]>(() => [
  { label: t("totalVotes"), value: formatVotes(totalVotes.value), variant: "accent" },
  { label: t("blockHeight"), value: blockHeight.value, variant: "default" },
]);

onMounted(() => {
  loadCandidates();
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-3;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    border-color: $neo-black;
    box-shadow: $shadow-md;
  }
  &.error {
    background: var(--status-error);
    color: $neo-white;
    border-color: $neo-black;
    box-shadow: $shadow-md;
  }
  &.loading {
    background: var(--status-info);
    color: $neo-white;
    border-color: $neo-black;
    box-shadow: $shadow-md;
  }
}

// Vote Summary Card
.vote-summary {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-4;
  padding: $space-4;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-2;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.summary-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: $font-weight-bold;
}

.summary-value {
  font-size: $font-size-2xl;
  color: var(--text-primary);
  font-weight: $font-weight-black;
  font-family: $font-mono;
}

.loading,
.empty {
  text-align: center;
  padding: $space-5;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

// Candidate List & Cards
.candidate-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.candidate-card {
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: $shadow-md;
  }

  &:active {
    transform: translate(1px, 1px);
    box-shadow: $shadow-sm;
  }

  &.selected {
    border-color: var(--neo-purple);
    background: var(--bg-elevated);
    box-shadow: 0 0 0 3px var(--neo-purple);
  }

  &.leading {
    border-color: var(--neo-green);

    .progress-fill {
      background: var(--neo-green);
    }
  }
}

.candidate-header {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-3;
}

.candidate-avatar {
  width: 48px;
  height: 48px;
  background: var(--neo-purple);
  border: $border-width-md solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  color: $neo-white;
}

.candidate-info {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  flex: 1;
}

.candidate-name {
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  font-size: $font-size-lg;
}

.candidate-address {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-family: $font-mono;
}

.candidate-badges {
  display: flex;
  gap: $space-2;
  flex-direction: column;
  align-items: flex-end;
}

.leading-badge {
  background: var(--neo-green);
  color: $neo-black;
  padding: $space-1 $space-2;
  border: $border-width-sm solid $neo-black;
  font-size: $font-size-xs;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 2px 2px 0 $neo-black;
}

.active-badge {
  background: var(--brutal-blue);
  color: $neo-black;
  padding: $space-1 $space-2;
  border: $border-width-sm solid $neo-black;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Vote Stats & Progress
.vote-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.vote-count {
  display: flex;
  align-items: baseline;
  gap: $space-2;
}

.vote-number {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  font-family: $font-mono;
}

.vote-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: $font-weight-medium;
}

.vote-percentage {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--neo-purple);
  font-family: $font-mono;
}

// Progress Bar
.progress-bar {
  width: 100%;
  height: 12px;
  background: var(--bg-primary);
  border: $border-width-sm solid var(--border-color);
  position: relative;
  overflow: hidden;
  margin-bottom: $space-2;
}

.progress-fill {
  flex: 1;
  min-height: 0;
  background: var(--neo-purple);
  transition: width $transition-normal;
  border-right: $border-width-sm solid var(--border-color);
}

// Selected Indicator
.selected-indicator {
  text-align: center;
  padding: $space-2;
  background: var(--neo-purple);
  color: $neo-white;
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: $space-2;
  border: $border-width-sm solid var(--border-color);
}

// Ballot Box & Vote Section
.ballot-box {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  margin-bottom: $space-4;
}

.ballot-icon {
  font-size: $font-size-4xl;
  line-height: 1;
}

.vote-info {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  flex: 1;
}

.vote-label {
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  text-transform: uppercase;
  font-size: $font-size-xs;
  letter-spacing: 0.5px;
}

.vote-value {
  color: var(--text-primary);
  font-weight: $font-weight-bold;
  font-family: $font-mono;
  font-size: $font-size-lg;
}
</style>
