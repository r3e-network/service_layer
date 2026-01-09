<template>
  <view class="position-summary">
    <view class="health-section">
      <text class="section-label">{{ t("healthFactor") }}</text>
      <view class="health-gauge">
        <view class="gauge-circle" :style="{ background: healthGradient }">
          <view class="gauge-inner">
            <text class="gauge-value">{{ healthFactor.toFixed(2) }}</text>
            <text class="gauge-label">{{ healthStatus }}</text>
          </view>
        </view>
      </view>
      <view class="health-legend">
        <view class="legend-item">
          <view class="legend-dot safe"></view>
          <text class="legend-text">{{ t("safe") }} (&gt;2.0)</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot warning"></view>
          <text class="legend-text">{{ t("warning") }} (1.2-2.0)</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot danger"></view>
          <text class="legend-text">{{ t("danger") }} (&lt;1.2)</text>
        </view>
      </view>
    </view>

    <view class="metrics-grid">
      <view class="metric-card">
        <text class="metric-label">{{ t("totalBorrowed") }}</text>
        <text class="metric-value borrowed">{{ fmt(loan.borrowed, 2) }}</text>
        <text class="metric-unit">GAS</text>
      </view>
      <view class="metric-card">
        <text class="metric-label">{{ t("collateralLocked") }}</text>
        <text class="metric-value collateral">{{ fmt(loan.collateralLocked, 2) }}</text>
        <text class="metric-unit">GAS</text>
      </view>
      <view class="metric-card">
        <text class="metric-label">{{ t("currentLTV") }}</text>
        <text class="metric-value ltv">{{ currentLTV }}%</text>
        <text class="metric-unit">{{ t("maxLTV") }}: 66.7%</text>
      </view>
      <view class="metric-card">
        <text class="metric-label">{{ t("interestRate") }}</text>
        <text class="metric-value rate">{{ terms.interestRate }}%</text>
        <text class="metric-unit">APR</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatNumber } from "@/shared/utils/format";

const props = defineProps<{
  loan: any;
  terms: any;
  healthFactor: number;
  currentLTV: number;
  t: (key: string) => string;
}>();

const fmt = (n: number, d = 2) => formatNumber(n, d);

const healthStatus = computed(() => {
  const hf = props.healthFactor;
  if (hf >= 2.0) return props.t("safe");
  if (hf >= 1.2) return props.t("warning");
  return props.t("danger");
});

const healthGradient = computed(() => {
  const hf = props.healthFactor;
  if (hf >= 2.0) return "conic-gradient(var(--neo-green) 0% 75%, var(--bg-secondary) 75% 100%)";
  if (hf >= 1.5) return "conic-gradient(var(--brutal-yellow) 0% 50%, var(--bg-secondary) 50% 100%)";
  return "conic-gradient(var(--brutal-red) 0% 25%, var(--bg-secondary) 25% 100%)";
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.position-summary {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-lg;
  padding: $space-4;
  margin-bottom: $space-3;
}

.health-section { margin-bottom: $space-4; }

.section-label {
  display: block;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  margin-bottom: $space-3;
  text-transform: uppercase;
}

.health-gauge {
  display: flex;
  justify-content: center;
  margin-bottom: $space-3;
}

.gauge-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
}

.gauge-inner {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: $border-width-sm solid var(--border-color);
}

.gauge-value {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  line-height: 1;
}

.gauge-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  margin-top: $space-1;
  text-transform: uppercase;
}

.health-legend {
  display: flex;
  justify-content: space-around;
  gap: $space-2;
}

.legend-item { display: flex; align-items: center; gap: $space-1; }

.legend-dot {
  width: 12px; height: 12px;
  border: $border-width-sm solid var(--border-color);
  &.safe { background: var(--neo-green); }
  &.warning { background: var(--brutal-yellow); }
  &.danger { background: var(--brutal-red); }
}

.legend-text { font-size: $font-size-xs; color: var(--text-secondary); }

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-3;
}

.metric-card {
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  padding: $space-3;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.metric-label { font-size: $font-size-xs; color: var(--text-secondary); text-transform: uppercase; }

.metric-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  line-height: 1;
  &.borrowed { color: var(--brutal-yellow); }
  &.collateral { color: var(--neo-green); }
  &.ltv { color: var(--brutal-blue); }
  &.rate { color: var(--text-primary); }
}

.metric-unit { font-size: $font-size-xs; color: var(--text-muted); }
</style>
