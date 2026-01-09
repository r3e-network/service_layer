<template>
  <NeoCard :title="t('selectCandidate')" variant="erobo-neo" class="candidate-list-card">
    <view v-if="isLoading" class="loading-state">
      <text class="loading-text">{{ t("loadingCandidates") }}</text>
    </view>

    <view v-else-if="candidates.length === 0" class="empty-state">
      <text class="empty-text">{{ t("noCandidates") }}</text>
    </view>

    <view v-else class="candidate-list">
      <view
        v-for="(candidate, index) in sortedCandidates"
        :key="candidate.publicKey"
        class="candidate-item"
        :class="{ selected: selectedCandidate?.publicKey === candidate.publicKey }"
        @click="selectCandidate(candidate)"
      >
        <view class="rank-badge" :class="getRankClass(index)">
          <text class="rank-number">#{{ index + 1 }}</text>
        </view>

        <view class="candidate-info">
          <text class="candidate-name">{{ candidate.name || truncateAddress(candidate.address) }}</text>
          <text class="candidate-address">{{ truncateAddress(candidate.publicKey) }}</text>
        </view>

        <view class="candidate-votes">
          <text class="votes-value">{{ formatVotes(candidate.votes) }}</text>
          <text class="votes-label">{{ t("votes") }}</text>
        </view>

        <view v-if="selectedCandidate?.publicKey === candidate.publicKey" class="selected-indicator">
          <text class="check-icon">✓</text>
        </view>
      </view>
    </view>

    <view v-if="totalVotes" class="total-votes-footer">
      <text class="total-label">{{ t("totalNetworkVotes") }}:</text>
      <text class="total-value">{{ formatVotes(totalVotes) }}</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NeoCard } from "@/shared/components";
import type { Candidate } from "@neo/uniapp-sdk";

const props = defineProps<{
  candidates: Candidate[];
  selectedCandidate: Candidate | null;
  totalVotes: string;
  isLoading: boolean;
  t: (key: string) => string;
}>();

const emit = defineEmits<{
  (e: "select", candidate: Candidate): void;
}>();

const sortedCandidates = computed(() => {
  return [...props.candidates].filter((c) => c.active).sort((a, b) => (BigInt(b.votes) > BigInt(a.votes) ? 1 : -1));
});

const selectCandidate = (candidate: Candidate) => {
  emit("select", candidate);
};

const truncateAddress = (addr: string) => {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatVotes = (votes: string) => {
  const num = BigInt(votes);
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
  return votes;
};

const getRankClass = (index: number) => {
  if (index === 0) return "rank-gold";
  if (index === 1) return "rank-silver";
  if (index === 2) return "rank-bronze";
  return "";
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.candidate-list-card {
  margin-bottom: 24px;
}

.loading-state,
.empty-state {
  padding: 24px;
  text-align: center;
}

.loading-text,
.empty-text {
  font-weight: 700;
  opacity: 0.6;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.candidate-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: var(--bg-card, rgba(255, 255, 255, 0.02));
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
}

.candidate-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: var(--bg-card, rgba(255, 255, 255, 0.05));
    transform: translateY(-1px);
  }

  &.selected {
    background: rgba(0, 229, 153, 0.1);
    border-color: #00E599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.1);
  }
}

.rank-badge {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border-radius: 99px;
  font-weight: 800;
  font-size: 11px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));

  &.rank-gold {
    background: linear-gradient(135deg, #FFD700, #FDB931);
    color: black;
    box-shadow: 0 2px 5px rgba(253, 185, 49, 0.3);
  }
  &.rank-silver {
    background: linear-gradient(135deg, #E0E0E0, #BDBDBD);
    color: black;
    box-shadow: 0 2px 5px rgba(189, 189, 189, 0.3);
  }
  &.rank-bronze {
    background: linear-gradient(135deg, #CD7F32, #A0522D);
    color: white;
    box-shadow: 0 2px 5px rgba(160, 82, 45, 0.3);
  }
}

.candidate-info {
  flex: 1;
  min-width: 0;
}

.candidate-name {
  display: block;
  font-weight: 700;
  font-size: 14px;
  color: white;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.candidate-address {
  display: block;
  font-size: 10px;
  font-family: monospace;
  opacity: 0.5;
  color: var(--text-primary, rgba(255, 255, 255, 0.8));
}

.candidate-votes {
  text-align: right;
}

.votes-value {
  display: block;
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  font-feature-settings: "tnum";
  font-size: 14px;
  color: white;
}

.votes-label {
  display: block;
  font-size: 9px;
  text-transform: uppercase;
  opacity: 0.5;
  font-weight: 600;
  color: var(--text-primary, rgba(255, 255, 255, 0.8));
}

.selected-indicator {
  width: 20px;
  height: 20px;
  background: #00E599;
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  box-shadow: 0 0 10px rgba(0, 229, 153, 0.4);
}

.total-votes-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.05em;
}

.total-value {
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  font-feature-settings: "tnum";
  color: white;
  font-size: 14px;
}
</style>
