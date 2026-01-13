<template>
  <NeoCard variant="erobo" class="security-dashboard">
    <view class="shield-icon">🛡️</view>
    <view class="security-info">
      <text class="security-label">{{ t("securityLevel") }}</text>
      <text :class="['security-value', securityLevelClass]">{{ securityLevel }}</text>
    </view>
    <view class="security-meter-glass">
      <view class="meter-bar-glass" :style="{ width: securityPercentage + '%' }"></view>
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.security-dashboard {
  background: transparent;
  padding: $space-8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  border: none;
  box-shadow: none;
}
.shield-icon {
  font-size: 64px;
  filter: drop-shadow(0 0 20px rgba(0, 229, 153, 0.4));
}
.security-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 4px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2px 10px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.05);
}
.security-value {
  font-size: 40px;
  font-weight: 800;
  color: white;
  text-transform: uppercase;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
  &.level-critical { color: #EF4444; text-shadow: 0 0 20px rgba(239, 68, 68, 0.6); }
  &.level-high { color: #F59E0B; text-shadow: 0 0 20px rgba(245, 158, 11, 0.6); }
  &.level-medium { color: #00E599; text-shadow: 0 0 20px rgba(0, 229, 153, 0.6); }
  &.level-low { color: rgba(255, 255, 255, 0.5); }
}
.security-meter-glass {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  position: relative;
  overflow: hidden;
}
.meter-bar-glass {
  height: 100%;
  background: linear-gradient(90deg, #00E599, #00A3CC);
  border-radius: 99px;
  transition: width $transition-normal;
  box-shadow: 0 0 10px rgba(0, 229, 153, 0.4);
}
</style>
