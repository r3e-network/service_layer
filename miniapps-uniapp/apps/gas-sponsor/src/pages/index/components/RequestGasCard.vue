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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.request-card {
  perspective: 1000px;
}

.not-eligible-msg {
  text-align: center;
  padding: 30px;
  background: rgba(239, 68, 68, 0.05); // Red tint
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  backdrop-filter: blur(10px);
}

.warning-icon {
  font-size: 40px;
  margin-bottom: 12px;
  filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.4));
}

.warning-title {
  font-weight: 800;
  font-size: 18px;
  margin-bottom: 8px;
  color: #F87171;
  display: block;
}

.warning-desc {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
  display: block;
}

.fuel-pump-display {
  background: linear-gradient(180deg, rgba(20, 20, 22, 0.6) 0%, rgba(10, 10, 12, 0.8) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: 
    0 10px 30px rgba(0, 0, 0, 0.5),
    inset 0 1px 1px rgba(255, 255, 255, 0.05);
}

.pump-screen {
  background: #0d1117;
  border-radius: 12px;
  border: 1px solid rgba(0, 229, 153, 0.2);
  padding: 24px;
  text-align: center;
  box-shadow: 
    inset 0 0 20px rgba(0, 229, 153, 0.05),
    0 0 10px rgba(0, 0, 0, 0.5);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 229, 153, 0.5), transparent);
  }
}

.pump-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(0, 229, 153, 0.6);
  letter-spacing: 0.2em;
  margin-bottom: 8px;
  display: block;
}

.pump-amount {
  font-size: 56px;
  font-weight: 800;
  font-family: monospace, ui-monospace, SFMono-Regular; 
  color: #00E599;
  display: block;
  line-height: 1;
  text-shadow: 
    0 0 20px rgba(0, 229, 153, 0.5),
    0 0 40px rgba(0, 229, 153, 0.1);
  letter-spacing: -2px;
}

.pump-unit {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 8px;
  display: block;
  letter-spacing: 0.05em;
}

.pump-limits {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.limit-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
  letter-spacing: 0.02em;
}

.quick-amounts {
  display: flex;
  gap: 12px;
  margin: 20px 0;
}

.quick-btn {
  flex: 1;
  padding: 14px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: white;
  position: relative;
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(0, 229, 153, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    
    text {
      color: #00E599;
    }
  }

  &:active {
    transform: translateY(0);
    opacity: 0.8;
  }

  text {
    font-size: 13px;
    font-weight: 700;
    transition: color 0.3s;
  }
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
</style>
