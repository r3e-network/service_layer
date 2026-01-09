<template>
  <NeoCard variant="default" class="flow-card">
    <view class="flow-header">
      <text class="flow-title">⚡ {{ t("flashLoanFlow") }}</text>
    </view>
    <view class="flow-diagram">
      <view class="flow-step">
        <view class="flow-icon">💰</view>
        <text class="flow-label">{{ t("borrow") }}</text>
      </view>
      <view class="flow-arrow">→</view>
      <view class="flow-step">
        <view class="flow-icon">🔄</view>
        <text class="flow-label">{{ t("execute") }}</text>
      </view>
      <view class="flow-arrow">→</view>
      <view class="flow-step">
        <view class="flow-icon">✓</view>
        <text class="flow-label">{{ t("repay") }}</text>
      </view>
    </view>
    <view class="flow-note">
      <text class="note-text">{{ t("flowNote") }}</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.flow-card {
  border-left: 8px solid var(--neo-purple) !important;
}
.flow-diagram {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: $space-6 0;
  background: var(--bg-elevated, #eee);
  padding: $space-4;
  border: 2px solid var(--border-color, black);
  box-shadow: inset 4px 4px 0 var(--shadow-color, rgba(0, 0, 0, 0.1));
  color: var(--text-primary, #000);
}
.flow-step {
  text-align: center;
  flex: 1;
}
.flow-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 4px;
}
.flow-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.flow-arrow {
  font-size: 24px;
  font-weight: $font-weight-black;
  color: var(--neo-purple);
}
.flow-note {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-align: center;
  border-top: 3px solid black;
  padding-top: 8px;
  margin-top: 4px;
}
</style>
