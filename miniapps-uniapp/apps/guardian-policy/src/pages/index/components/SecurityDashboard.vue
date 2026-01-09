<template>
  <NeoCard class="security-dashboard">
    <view class="shield-icon">🛡️</view>
    <view class="security-info">
      <text class="security-label">{{ t("securityLevel") }}</text>
      <text :class="['security-value', securityLevelClass]">{{ securityLevel }}</text>
    </view>
    <view class="security-meter">
      <view class="meter-bar" :style="{ width: securityPercentage + '%' }"></view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  securityLevel: string;
  securityLevelClass: string;
  securityPercentage: number;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.security-dashboard {
  background: black;
  padding: $space-8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  border: 4px solid black;
  box-shadow: 12px 12px 0 var(--brutal-yellow);
}
.shield-icon {
  font-size: 64px;
}
.security-label {
  color: white;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 4px;
  border: 1px solid white;
  padding: 2px 10px;
}
.security-value {
  font-size: 40px;
  font-weight: $font-weight-black;
  color: var(--brutal-yellow);
  text-transform: uppercase;
  text-shadow: 4px 4px 0 black;
}
.security-meter {
  width: 100%;
  height: 24px;
  background: #333;
  border: 3px solid white;
  position: relative;
  padding: 2px;
}
.meter-bar {
  height: 100%;
  background: var(--neo-green);
  border-right: 3px solid white;
  transition: width $transition-normal;
}
</style>
