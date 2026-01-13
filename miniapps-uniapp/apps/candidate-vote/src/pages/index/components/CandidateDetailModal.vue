<template>
  <view v-if="candidate" class="modal-overlay" @click.self="$emit('close')">
    <view class="modal-content">
      <view class="modal-header">
        <text class="modal-title">{{ t("candidateDetails") }}</text>
        <view class="close-btn" @click="$emit('close')">
          <text class="close-icon">×</text>
        </view>
      </view>

      <view class="modal-body">
        <!-- Rank Badge -->
        <view class="rank-section">
          <view class="rank-badge-large" :class="getRankClass(rank)">
            <text class="rank-text">#{{ rank }}</text>
          </view>
          <view v-if="isUserVoted" class="voted-badge">
            <text class="voted-text">{{ t("yourVote") }}</text>
          </view>
        </view>

        <!-- Candidate Name -->
        <view class="info-section">
          <text class="info-label">{{ t("name") }}</text>
          <text class="info-value name-value">
            {{ candidate.name || t("anonymous") }}
          </text>
        </view>

        <!-- Address -->
        <view class="info-section">
          <text class="info-label">{{ t("address") }}</text>
          <text class="info-value mono">{{ candidate.address }}</text>
        </view>

        <!-- Public Key -->
        <view class="info-section">
          <text class="info-label">{{ t("publicKey") }}</text>
          <text class="info-value mono small">{{ candidate.publicKey }}</text>
        </view>

        <!-- Votes -->
        <view class="info-section">
          <text class="info-label">{{ t("totalVotes") }}</text>
          <view class="votes-display">
            <text class="votes-value">{{ formatVotes(candidate.votes) }}</text>
            <text class="votes-percentage">({{ votePercentage }}%)</text>
          </view>
        </view>

        <!-- Status -->
        <view class="info-section">
          <text class="info-label">{{ t("status") }}</text>
          <view class="status-badge" :class="candidate.active ? 'active' : 'inactive'">
            <text class="status-text">
              {{ candidate.active ? t("activeValidator") : t("standby") }}
            </text>
          </view>
        </view>
      </view>

      <view class="modal-footer">
        <NeoButton
          v-if="!isUserVoted"
          variant="primary"
          size="lg"
          block
          :disabled="!canVote"
          @click="$emit('vote', candidate)"
        >
          {{ t("voteForCandidate") }}
        </NeoButton>
        <NeoCard v-else variant="erobo-neo" flat class="text-center">
          <text class="notice-text">{{ t("alreadyVotedFor") }}</text>
        </NeoCard>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NeoButton, NeoCard } from "@/shared/components";
import type { Candidate } from "@neo/uniapp-sdk";

const props = defineProps<{
  candidate: Candidate | null;
  rank: number;
  totalVotes: string;
  isUserVoted: boolean;
  canVote: boolean;
  t: (key: string) => string;
}>();

defineEmits<{
  (e: "close"): void;
  (e: "vote", candidate: Candidate): void;
}>();

const votePercentage = computed(() => {
  if (!props.candidate || !props.totalVotes) return "0.00";
  const total = BigInt(props.totalVotes || "1");
  const votes = BigInt(props.candidate.votes || "0");
  if (total === BigInt(0)) return "0.00";
  return ((Number(votes) / Number(total)) * 100).toFixed(2);
});

const formatVotes = (votes: string) => {
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

const getRankClass = (rank: number) => {
  if (rank === 1) return "rank-gold";
  if (rank === 2) return "rank-silver";
  if (rank === 3) return "rank-bronze";
  return "";
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 20, 0.98) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-weight: 700;
  font-size: 18px;
  color: white;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  cursor: pointer;
}

.close-icon {
  font-size: 20px;
  color: white;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

.rank-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.rank-badge-large {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;

  &.rank-gold {
    background: linear-gradient(135deg, #ffd700, #fdb931);
    box-shadow: 0 4px 20px rgba(253, 185, 49, 0.4);
  }
  &.rank-silver {
    background: linear-gradient(135deg, #e0e0e0, #bdbdbd);
    box-shadow: 0 4px 20px rgba(189, 189, 189, 0.4);
  }
  &.rank-bronze {
    background: linear-gradient(135deg, #cd7f32, #a0522d);
    box-shadow: 0 4px 20px rgba(160, 82, 45, 0.4);
  }
}

.rank-text {
  font-weight: 800;
  font-size: 20px;
  color: black;

  .rank-gold &,
  .rank-silver & {
    color: black;
  }
  .rank-bronze & {
    color: white;
  }
}

.voted-badge {
  background: linear-gradient(135deg, #00e599, #00b377);
  padding: 6px 14px;
  border-radius: 99px;
  box-shadow: 0 4px 15px rgba(0, 229, 153, 0.3);
}

.voted-text {
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: black;
}

.info-section {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.info-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 6px;
}

.info-value {
  display: block;
  font-size: 14px;
  color: white;
  word-break: break-all;

  &.name-value {
    font-weight: 700;
    font-size: 18px;
  }
  &.mono {
    font-family: monospace;
    font-size: 12px;
  }
  &.small {
    font-size: 10px;
  }
}

.votes-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.votes-value {
  font-weight: 700;
  font-size: 24px;
  color: #00e599;
  font-family: $font-family;
}

.votes-percentage {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 99px;

  &.active {
    background: rgba(0, 229, 153, 0.15);
    border: 1px solid rgba(0, 229, 153, 0.3);
  }
  &.inactive {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}

.status-text {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;

  .active & {
    color: #00e599;
  }
  .inactive & {
    color: rgba(255, 255, 255, 0.6);
  }
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.already-voted-notice {
  text-align: center;
  padding: 12px;
  background: rgba(0, 229, 153, 0.1);
  border: 1px solid rgba(0, 229, 153, 0.2);
  border-radius: 12px;
}

.notice-text {
  font-weight: 600;
  font-size: 14px;
  color: #00e599;
}
</style>
