<template>
  <view class="graveyard-hero">
    <view class="tombstone-scene">
      <view class="moon"></view>
      <view class="fog fog-1"></view>
      <view class="fog fog-2"></view>
      <view v-for="i in 3" :key="i" :class="['tombstone', `tombstone-${i}`]">
        <view class="tombstone-top"></view>
        <view class="tombstone-body">
          <text class="rip">R.I.P</text>
        </view>
      </view>
      <view class="ground"></view>
    </view>
    <view class="hero-stats">
      <view class="hero-stat">
        <text class="hero-stat-icon">💀</text>
        <text class="hero-stat-value">{{ totalDestroyed }}</text>
        <text class="hero-stat-label">{{ t("itemsDestroyed") }}</text>
      </view>
      <view class="hero-stat">
        <AppIcon name="gas" :size="28" class="hero-stat-icon" />
        <text class="hero-stat-value">{{ formatNum(gasReclaimed) }}</text>
        <text class="hero-stat-label">{{ t("gasReclaimed") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { formatNumber } from "@/shared/utils/format";
import { AppIcon } from "@/shared/components";

defineProps<{
  totalDestroyed: number;
  gasReclaimed: number;
  t: (key: string) => string;
}>();

const formatNum = (n: number) => formatNumber(n, 2);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.graveyard-hero {
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  padding: $space-8;
  position: relative;
  overflow: hidden;
  box-shadow: 12px 12px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
}

.tombstone-scene {
  height: 140px;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  margin-bottom: $space-8;
  position: relative;
  border-bottom: 6px solid var(--border-color, black);
  background: var(--bg-elevated, #f0f0f0);
  padding: 0 20px;
}

.moon {
  position: absolute;
  top: 15px;
  right: 30px;
  width: 50px;
  height: 50px;
  background: #ffde59;
  border: 4px solid var(--border-color, black);
}

.tombstone {
  width: 60px;
  height: 90px;
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  box-shadow: 4px -4px 0 var(--shadow-color, black);
  &.tombstone-1 {
    transform: rotate(-5deg);
  }
  &.tombstone-3 {
    transform: rotate(5deg);
  }
}

.rip {
  font-size: 14px;
  color: var(--text-primary, black);
  font-weight: $font-weight-black;
  letter-spacing: 2px;
  font-style: italic;
}

.hero-stats {
  display: flex;
  gap: $space-4;
}
.hero-stat {
  flex: 1;
  text-align: center;
  background: #ffde59;
  padding: $space-4;
  border: 4px solid var(--border-color, black);
  box-shadow: 6px 6px 0 var(--shadow-color, black);
  transition: transform 0.2s;
  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 var(--shadow-color, black);
  }
}
.hero-stat-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}
.hero-stat-value {
  font-size: 24px;
  font-weight: $font-weight-black;
  color: var(--text-primary, black);
  font-family: $font-mono;
  display: block;
  font-style: italic;
}
.hero-stat-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: var(--text-primary, black);
  letter-spacing: 1px;
}
</style>
