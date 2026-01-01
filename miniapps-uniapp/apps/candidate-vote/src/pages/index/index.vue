<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>

    <view class="card">
      <text class="card-title">{{ t("candidates") }}</text>
      <view v-if="loadingCandidates" class="loading">
        <text>{{ t("loadingCandidates") }}</text>
      </view>
      <view v-else-if="candidates.length === 0" class="empty">
        <text>{{ t("noCandidates") }}</text>
      </view>
      <view v-else class="candidate-list">
        <view
          v-for="c in candidates"
          :key="c.address"
          :class="['candidate-row', { selected: selectedCandidate === c.address }]"
          @click="selectCandidate(c.address)"
        >
          <view class="candidate-info">
            <text class="candidate-name">{{ c.name || shortenAddress(c.address) }}</text>
            <text class="candidate-votes">{{ formatVotes(c.votes) }} {{ t("votes") }}</text>
          </view>
          <view v-if="c.active" class="active-badge">
            <text>{{ t("active") }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("castYourVote") }}</text>
      <view class="vote-info">
        <text class="vote-label">{{ t("selectedCandidate") }}</text>
        <text class="vote-value">{{ selectedCandidate ? shortenAddress(selectedCandidate) : t("none") }}</text>
      </view>
      <view class="action-btn" @click="castVote" :style="{ opacity: !selectedCandidate || isLoading ? 0.6 : 1 }">
        <text>{{ isLoading ? t("processing") : t("vote") }}</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("networkInfo") }}</text>
      <view class="info-row">
        <text class="info-label">{{ t("totalVotes") }}</text>
        <text class="info-value">{{ formatVotes(totalVotes) }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">{{ t("blockHeight") }}</text>
        <text class="info-value">{{ blockHeight }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useGovernance } from "@neo/uniapp-sdk";
import type { Candidate } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const APP_ID = "miniapp-candidate-vote";

const translations = {
  title: { en: "Candidate Vote", zh: "候选人投票" },
  subtitle: { en: "Neo Governance Voting", zh: "Neo 治理投票" },
  candidates: { en: "Candidates", zh: "候选人" },
  loadingCandidates: { en: "Loading candidates...", zh: "加载候选人中..." },
  noCandidates: { en: "No candidates found", zh: "未找到候选人" },
  votes: { en: "votes", zh: "票" },
  active: { en: "Active", zh: "活跃" },
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
};

const t = createT(translations);

const { isLoading, getCandidates, vote } = useGovernance(APP_ID);

const candidates = ref<Candidate[]>([]);
const selectedCandidate = ref<string | null>(null);
const totalVotes = ref("0");
const blockHeight = ref(0);
const loadingCandidates = ref(true);
const status = ref<{ msg: string; type: string } | null>(null);

const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
const formatVotes = (v: string) => parseInt(v).toLocaleString();

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

onMounted(() => {
  loadCandidates();
});
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";

.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: $color-text-primary;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  font-size: 1.8em;
  font-weight: bold;
  color: $color-governance;
}

.subtitle {
  color: $color-text-secondary;
  font-size: 0.9em;
  margin-top: 8px;
}

.status-msg {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  &.success {
    background: rgba($color-success, 0.15);
    color: $color-success;
  }
  &.error {
    background: rgba($color-error, 0.15);
    color: $color-error;
  }
  &.loading {
    background: rgba($color-info, 0.15);
    color: $color-info;
  }
}

.card {
  background: $color-bg-card;
  border: 1px solid $color-border;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.card-title {
  color: $color-governance;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}

.loading,
.empty {
  text-align: center;
  padding: 20px;
  color: $color-text-secondary;
}

.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.candidate-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba($color-governance, 0.05);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  &.selected {
    border-color: $color-governance;
    background: rgba($color-governance, 0.15);
  }
}

.candidate-name {
  font-weight: bold;
  color: $color-text-primary;
}

.candidate-votes {
  font-size: 0.85em;
  color: $color-text-secondary;
}

.active-badge {
  background: rgba($color-success, 0.2);
  color: $color-success;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75em;
}

.vote-info,
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid $color-border;
}

.vote-label,
.info-label {
  color: $color-text-secondary;
}

.vote-value,
.info-value {
  color: $color-text-primary;
  font-weight: bold;
}

.action-btn {
  background: linear-gradient(135deg, $color-governance 0%, darken($color-governance, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
  margin-top: 16px;
}
</style>
