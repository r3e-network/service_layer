<template>
  <view class="card borrow-card">
    <text class="card-title">{{ t("takeSelfLoan") }}</text>

    <view class="input-section">
      <NeoInput
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)"
        type="number"
        :label="t('borrowAmount')"
        :placeholder="t('amountToBorrow')"
      />
    </view>

    <view class="ltv-section">
      <view class="ltv-header">
        <text class="ltv-label">{{ t("loanToValue") }}</text>
        <text :class="['ltv-value', getLTVClass()]">{{ calculatedLTV }}%</text>
      </view>
      <view class="ltv-bar">
        <view class="ltv-fill" :style="{ width: calculatedLTV + '%', background: getLTVColor() }"></view>
        <view class="ltv-marker safe" style="left: 50%"></view>
        <view class="ltv-marker warning" style="left: 66.7%"></view>
      </view>
      <view class="ltv-labels">
        <text class="ltv-min">0%</text>
        <text class="ltv-mid">50%</text>
        <text class="ltv-max">100%</text>
      </view>
    </view>

    <view class="calculation-grid">
      <view class="calc-row">
        <text class="calc-label">{{ t("collateralRequired") }}</text>
        <text class="calc-value collateral-req">{{ fmt(parseFloat(modelValue || "0") * 1.5, 2) }} GAS</text>
      </view>
      <view class="calc-row">
        <text class="calc-label">{{ t("monthlyPayment") }}</text>
        <text class="calc-value payment">{{ fmt(parseFloat(modelValue || "0") * 0.085, 3) }} GAS</text>
      </view>
      <view class="calc-row">
        <text class="calc-label">{{ t("totalRepayment") }}</text>
        <text class="calc-value total">{{ fmt(parseFloat(modelValue || "0") * 1.02, 2) }} GAS</text>
      </view>
    </view>

    <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="$emit('takeLoan')">
      <text>{{ isLoading ? t("processing") : t("borrowNow") }}</text>
    </NeoButton>
    <text class="note">{{ t("note") }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/shared/utils/format";
import { NeoInput, NeoButton } from "@/shared/components";

const props = defineProps<{
  modelValue: string;
  terms: any;
  isLoading: boolean;
  t: (key: string) => string;
}>();

const emit = defineEmits(["update:modelValue", "takeLoan"]);

const fmt = (n: number, d = 2) => formatNumber(n, d);

const calculatedLTV = computed(() => {
  const amount = parseFloat(props.modelValue || "0");
  const collateral = amount * 1.5;
  if (collateral === 0) return 0;
  return Math.min(Math.round((amount / collateral) * 100), 100);
});

const getLTVClass = () => {
  const ltv = calculatedLTV.value;
  if (ltv <= 50) return "safe";
  if (ltv <= 66.7) return "warning";
  return "danger";
};

const getLTVColor = () => {
  const ltv = calculatedLTV.value;
  if (ltv <= 50) return "var(--neo-green)";
  if (ltv <= 66.7) return "var(--brutal-yellow)";
  return "var(--brutal-red)";
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin-bottom: $space-3;
}

.card-title {
  color: var(--neo-green);
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-3;
  text-transform: uppercase;
}

.borrow-card { background: var(--bg-card); }

.input-section { margin-bottom: $space-4; }

.ltv-section {
  margin-bottom: $space-4;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.ltv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.ltv-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--text-secondary);
  text-transform: uppercase;
}

.ltv-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  &.safe { color: var(--neo-green); }
  &.warning { color: var(--brutal-yellow); }
  &.danger { color: var(--brutal-red); }
}

.ltv-bar {
  height: 24px;
  background: var(--bg-primary);
  border: $border-width-sm solid var(--border-color);
  position: relative;
  margin-bottom: $space-2;
  overflow: hidden;
}

.ltv-fill {
  flex: 1;
  min-height: 0;
  transition: width $transition-normal, background $transition-normal;
}

.ltv-marker {
  position: absolute; top: 0; width: 2px; flex: 1; min-height: 0;
  background: var(--border-color); z-index: 1;
  &.safe { background: var(--neo-green); }
  &.warning { background: var(--brutal-yellow); }
}

.ltv-labels {
  display: flex; justify-content: space-between;
  font-size: $font-size-xs; color: var(--text-muted);
}

.ltv-min, .ltv-mid, .ltv-max { font-weight: $font-weight-medium; }

.calculation-grid {
  display: flex; flex-direction: column; gap: $space-2; margin-bottom: $space-4;
}

.calc-row {
  display: flex; justify-content: space-between;
  padding: $space-3; background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
}

.calc-label { font-size: $font-size-sm; color: var(--text-secondary); }

.calc-value {
  font-size: $font-size-sm; font-weight: $font-weight-bold;
  &.collateral-req { color: var(--brutal-yellow); }
  &.payment { color: var(--neo-green); }
  &.total { color: var(--brutal-blue); }
}

.note {
  display: block; margin-top: $space-3;
  font-size: $font-size-sm; color: var(--text-secondary);
  text-align: center;
}
</style>
