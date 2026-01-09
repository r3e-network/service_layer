<template>
  <view class="contract-card">
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
      <view v-if="contract.status === 'pending' && canSign" class="claim-btn" @click="$emit('sign', contract)">
        <text>{{ t("signContract") }}</text>
      </view>
      <view v-else-if="contract.status === 'active'" class="break-btn" @click="$emit('break', contract)">
        <text>{{ t("breakContract") }}</text>
      </view>
      <view v-else class="contract-status-text">
        <text>{{ t(contract.status) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface RelationshipContractView {
  id: number;
  party1: string;
  party2: string;
  partner: string;
  stake: number;
  stakeRaw: string;
  progress: number;
  daysLeft: number;
  status: "pending" | "active" | "broken" | "ended";
}

const props = defineProps<{
  contract: RelationshipContractView;
  address: string | null;
  t: (key: string) => string;
}>();

defineEmits(["sign", "break"]);

const canSign = computed(() =>
  Boolean(props.address && props.contract.status === "pending" && props.contract.party2 === props.address),
);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.contract-card {
  background: var(--bg-card, white);
  border: 2px solid var(--border-color, black);
  padding: $space-4;
  box-shadow: 6px 6px 0 var(--shadow-color, black);
  border-left: 8px solid var(--brutal-pink);
  color: var(--text-primary, black);
}

.contract-status-badge {
  display: inline-flex;
  padding: 2px 8px;
  border: 1px solid var(--border-color, black);
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
  color: var(--text-primary, black);
}
.progress-track {
  height: 12px;
  background: var(--bg-elevated, #eee);
  margin-top: 4px;
  border: 2px solid var(--border-color, black);
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
  border: 2px solid var(--border-color, black);
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
  box-shadow: 4px 4px 0 var(--shadow-color, black);
}
.claim-btn {
  background: var(--neo-green);
  color: black;
  box-shadow: 4px 4px 0 var(--shadow-color, black);
}
</style>
