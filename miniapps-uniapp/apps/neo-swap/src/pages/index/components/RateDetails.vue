<template>
  <view class="rate-card">
    <view class="rate-header" @click="showDetails = !showDetails">
      <view class="rate-info">
        <text class="rate-label">{{ t("exchangeRate") }}</text>
        <text class="rate-value">1 {{ fromSymbol }} ≈ {{ exchangeRate }} {{ toSymbol }}</text>
      </view>
      <view class="rate-actions">
        <AppIcon name="history" :size="20" class="refresh-icon" @click.stop="$emit('refresh')" />
        <AppIcon name="chevron-right" :size="16" :rotate="showDetails ? 270 : 90" />
      </view>
    </view>

    <!-- Transaction Details Accordion -->
    <view v-if="showDetails" class="details-accordion">
      <view class="detail-row">
        <text class="detail-label">{{ t("priceImpact") }}</text>
        <text :class="['detail-value', priceImpactClass]">{{ priceImpact }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">{{ t("slippage") }}</text>
        <text class="detail-value">{{ slippage }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">{{ t("liquidityPool") }}</text>
        <text class="detail-value">{{ liquidityPool }}</text>
      </view>
      <view class="detail-row">
        <text class="detail-label">{{ t("minReceived") }}</text>
        <text class="detail-value">{{ minReceived }} {{ toSymbol }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { AppIcon } from "@/shared/components";

const props = defineProps<{
  fromSymbol: string;
  toSymbol: string;
  exchangeRate: string;
  priceImpact: string;
  slippage: string;
  liquidityPool: string;
  minReceived: string;
  t: (key: string) => string;
}>();

defineEmits(["refresh"]);

const showDetails = ref(false);

const priceImpactClass = computed(() => {
  const impact = parseFloat(props.priceImpact);
  if (impact < 1) return "impact-low";
  if (impact < 3) return "impact-medium";
  return "impact-high";
});
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.rate-card {
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  padding: 12px;
  margin-bottom: 24px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.rate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.rate-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.1em;
  display: block;
}

.rate-value {
  font-weight: 700;
  font-size: 13px;
  font-family: $font-mono;
  color: white;
}

.rate-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-icon {
  cursor: pointer;
  transition: opacity 0.2s;
  &:active { opacity: 0.6; }
}

.details-accordion {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.detail-label {
  font-size: 10px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  font-weight: 500;
}

.detail-value {
  font-size: 11px;
  font-weight: 700;
  color: white;

  &.impact-low { color: #10b981; }
  &.impact-medium { color: #F59E0B; }
  &.impact-high { color: #EF4444; }
}
</style>
