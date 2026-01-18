<template>
  <NeoCard variant="erobo" class="loan-card">


    <view class="input-section">
      <NeoInput
        :modelValue="loanId"
        @update:modelValue="$emit('update:loanId', $event)"
        type="number"
        :placeholder="t('loanIdPlaceholder')"
        :label="t('loanId')"
      />
    </view>

    <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="$emit('lookup')" class="execute-btn">
      <text v-if="!isLoading">{{ t("checkStatus") }}</text>
      <text v-else>{{ t("checking") }}</text>
    </NeoButton>

    <view v-if="loanDetails" class="status-grid">
      <view class="status-row">
        <text class="status-label">{{ t("statusLabel") }}</text>
        <text :class="['status-value', loanDetails.status]">{{ statusText(loanDetails.status) }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">{{ t("loanId") }}</text>
        <text class="status-value">#{{ loanDetails.id }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">{{ t("amount") }}</text>
        <text class="status-value">{{ loanDetails.amount }} GAS</text>
      </view>
      <view class="status-row">
        <text class="status-label">{{ t("feeShort") }}</text>
        <text class="status-value">{{ loanDetails.fee }} GAS</text>
      </view>
      <view class="status-row">
        <text class="status-label">{{ t("borrower") }}</text>
        <text class="status-value mono">{{ loanDetails.borrower }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">{{ t("callbackContract") }}</text>
        <text class="status-value mono">{{ loanDetails.callbackContract }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">{{ t("callbackMethod") }}</text>
        <text class="status-value mono">{{ loanDetails.callbackMethod }}</text>
      </view>
      <view class="status-row">
        <text class="status-label">{{ t("timestamp") }}</text>
        <text class="status-value">{{ loanDetails.timestamp }}</text>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-text">{{ t("statusHint") }}</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

export interface LoanDetails {
  id: string;
  borrower: string;
  amount: string;
  fee: string;
  callbackContract: string;
  callbackMethod: string;
  timestamp: string;
  status: "pending" | "success" | "failed";
}

const props = defineProps<{
  loanId: string;
  loanDetails: LoanDetails | null;
  isLoading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:loanId", "lookup"]);

const statusText = (status: LoanDetails["status"]) => {
  const map = {
    pending: props.t("statusPending"),
    success: props.t("statusSuccess"),
    failed: props.t("statusFailed"),
  };
  return map[status] || status;
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.card-title {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
}

.input-section {
  margin-bottom: $space-4;
}

.execute-btn {
  margin-top: $space-2;
}

.status-grid {
  margin-top: $space-4;
  display: grid;
  gap: 10px;
  padding: $space-4;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $space-3;
}

.status-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 0.1em;
}

.status-value {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: right;

  &.pending {
    color: #f59e0b;
  }
  &.success {
    color: #00e599;
  }
  &.failed {
    color: #ef4444;
  }
}

.mono {
  font-family: $font-mono;
}

.empty-state {
  margin-top: $space-4;
  padding: $space-4;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-align: center;
  color: var(--text-secondary);
}

.empty-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
