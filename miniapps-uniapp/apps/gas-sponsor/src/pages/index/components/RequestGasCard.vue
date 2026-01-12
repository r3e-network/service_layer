<template>
  <NeoCard :title="t('requestSponsoredGas')" class="request-card">
    <view v-if="!isEligible" class="not-eligible-msg">
      <view class="warning-icon">⚠️</view>
      <text class="warning-title">{{ t("notEligibleTitle") }}</text>
      <text class="warning-desc">{{ t("balanceExceeds") }}</text>
      <text class="warning-desc">{{ t("newUsersOnly") }}</text>
    </view>
    <view v-else-if="remainingQuota <= 0" class="not-eligible-msg">
      <view class="warning-icon">🚫</view>
      <text class="warning-title">{{ t("quotaExhausted") }}</text>
      <text class="warning-desc">{{ t("tryTomorrow") }}</text>
    </view>
    <view v-else class="request-form">
      <view class="fuel-pump-display">
        <view class="pump-screen">
          <text class="pump-label">{{ t("requestAmount") }}</text>
          <text class="pump-amount">{{ requestAmount || "0.00" }}</text>
          <text class="pump-unit">GAS</text>
        </view>
        <view class="pump-limits">
          <text class="limit-text">{{ t("maxRequest") }}: {{ formatBalance(maxRequestAmount) }} GAS</text>
          <text class="limit-text">{{ t("remaining") }}: {{ formatBalance(remainingQuota) }} GAS</text>
        </view>
      </view>

      <NeoInput
        :modelValue="requestAmount"
        @update:modelValue="$emit('update:requestAmount', $event)"
        type="number"
        :label="t('amountToRequest')"
        placeholder="0.01"
        suffix="GAS"
      />

      <view class="quick-amounts">
        <view
          v-for="amount in quickAmounts"
          :key="amount"
          class="quick-btn"
          @click="$emit('update:requestAmount', amount.toString())"
        >
          <text>{{ amount }}</text>
        </view>
      </view>

      <view style="margin-top: 16px">
        <NeoButton
          variant="primary"
          size="lg"
          block
          :loading="isRequesting"
          :disabled="!isEligible || remainingQuota <= 0"
          @click="$emit('request')"
        >
          <view class="btn-content">
            <AppIcon v-if="!isRequesting" name="gas" :size="20" />
            <text>{{ isRequesting ? t("requesting") : t("requestGas") }}</text>
          </view>
        </NeoButton>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton, AppIcon } from "@/shared/components";

defineProps<{
  isEligible: boolean;
  remainingQuota: number;
  requestAmount: string;
  maxRequestAmount: string;
  isRequesting: boolean;
  quickAmounts: number[];
  t: (key: string) => string;
}>();

defineEmits(["update:requestAmount", "request"]);

const formatBalance = (val: string | number) => parseFloat(String(val)).toFixed(4);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.not-eligible-msg {
  text-align: center;
  padding: 24px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border-radius: 16px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
}

.warning-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.warning-title {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 8px;
  color: white;
  display: block;
}

.warning-desc {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  margin-bottom: 4px;
  display: block;
}

.fuel-pump-display {
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.pump-screen {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  padding: 20px;
  text-align: center;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
}

.pump-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  letter-spacing: 0.1em;
  margin-bottom: 8px;
  display: block;
}

.pump-amount {
  font-size: 48px;
  font-weight: 800;
  font-family: $font-family;
  color: #00E599;
  display: block;
  line-height: 1;
  text-shadow: 0 0 20px rgba(0, 229, 153, 0.3);
}

.pump-unit {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-top: 4px;
  display: block;
}

.pump-limits {
  margin-top: 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.limit-text {
  font-size: 11px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  font-weight: 500;
}

.quick-amounts {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.quick-btn {
  flex: 1;
  padding: 12px;
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;

  &:active {
    opacity: 0.7;
    transform: scale(0.98);
  }

  text {
    font-size: 12px;
    font-weight: 600;
  }
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
</style>
