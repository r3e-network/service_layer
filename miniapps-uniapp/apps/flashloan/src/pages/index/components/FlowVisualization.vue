<template>
  <NeoCard variant="erobo-neo" class="flow-card">
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.flow-title {
  font-size: 14px;
  font-weight: 700;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 12px;
}

.flow-diagram {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: $space-4 0;
  background: rgba(255, 255, 255, 0.05);
  padding: $space-4;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}
.flow-step {
  text-align: center;
  flex: 1;
}
.flow-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 4px;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
}
.flow-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.1em;
}
.flow-arrow {
  font-size: 24px;
  font-weight: 700;
  color: #00E599;
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
}
.flow-note {
  font-size: 10px;
  font-weight: 600;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 12px;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}
</style>
