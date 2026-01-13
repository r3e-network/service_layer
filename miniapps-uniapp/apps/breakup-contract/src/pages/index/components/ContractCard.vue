<template>
  <NeoCard :variant="getContractVariant(contract.status)" class="contract-card">
    <template #header-extra>
      <view class="contract-status-badge" :class="contract.status">
        <text class="status-icon" v-if="contract.status === 'active'">💕</text>
        <text class="status-icon" v-else-if="contract.status === 'broken'">💔</text>
        <text class="status-text">{{ t(contract.status) }}</text>
      </view>
    </template>

    <view class="contract-info">
      <view class="info-row">
        <text class="info-label">{{ t("partner") }}</text>
        <text class="info-value mono">{{ contract.partner }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">{{ t("stake") }}</text>
        <text class="info-value text-accent">{{ contract.stake }} GAS</text>
      </view>
      <view class="info-row">
        <text class="info-label">{{ t("duration") }}</text>
        <text class="info-value">{{ contract.daysLeft }} {{ t("daysLeft") }}</text>
      </view>
    </view>

    <view class="contract-progress-section mt-4">
      <view class="flex justify-between mb-1">
        <text class="progress-label">{{ t("progress") }}</text>
        <text class="progress-val">{{ contract.progress }}%</text>
      </view>
      <view class="progress-track-glass">
        <view class="progress-fill-glass" :style="{ width: contract.progress + '%' }"></view>
      </view>
    </view>

    <view class="contract-actions mt-4">
      <NeoButton
        v-if="contract.status === 'pending' && canSign"
        variant="primary"
        size="sm"
        block
        @click="$emit('sign', contract)"
      >
        {{ t("signContract") }}
      </NeoButton>
      <NeoButton
        v-else-if="contract.status === 'active'"
        variant="danger"
        size="sm"
        block
        @click="$emit('break', contract)"
      >
        {{ t("breakContract") }}
      </NeoButton>
      <view v-else class="status-display text-center p-2 rounded glass-panel">
        <text class="status-display-text">{{ t(contract.status) }}</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NeoCard, NeoButton } from "@/shared/components";

const getContractVariant = (status: string) => {
  switch (status) {
    case 'active': return 'erobo-neo';
    case 'broken': return 'danger';
    case 'pending': return 'warning';
    default: return 'erobo';
  }
};

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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.contract-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  
  &.active { background: rgba(0, 229, 153, 0.1); color: #00E599; border: 1px solid rgba(0, 229, 153, 0.2); }
  &.pending { background: rgba(255, 222, 10, 0.1); color: #ffde59; border: 1px solid rgba(255, 222, 10, 0.2); }
  &.broken { background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2); }
  &.ended { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.6); }
}

.contract-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 12px;
  font-weight: 600;
  color: white;
  &.mono { font-family: $font-mono; font-size: 11px; }
  &.text-accent { color: #FF6B6B; }
}

.progress-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

.progress-val {
  font-size: 10px;
  font-weight: 700;
  color: #FF6B6B;
}

.progress-track-glass {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill-glass {
  height: 100%;
  background: linear-gradient(90deg, #FF6B6B, #FFD93D);
  border-radius: 99px;
}

.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-display-text {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}
</style>
