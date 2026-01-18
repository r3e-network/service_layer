<template>
  <NeoCard variant="erobo-neo" class="graveyard-hero-card">
    <view class="tombstone-scene-glass">
      <view class="moon-glass"></view>
      <view class="fog fog-1"></view>
      <view class="fog fog-2"></view>
      <view v-for="i in 3" :key="i" :class="['tombstone-glass', `tombstone-${i}`]">
        <text class="rip-glass">{{ t("rip") }}</text>
      </view>
    </view>
    
    <view class="hero-stats-glass">
      <view class="hero-stat-glass">
        <text class="hero-stat-icon">💀</text>
        <text class="hero-stat-value-glass">{{ totalDestroyed }}</text>
        <text class="hero-stat-label-glass">{{ t("itemsDestroyed") }}</text>
      </view>
      <view class="hero-stat-glass">
        <AppIcon name="gas" :size="28" class="hero-stat-icon" />
        <text class="hero-stat-value-glass">{{ formatNum(gasReclaimed) }}</text>
        <text class="hero-stat-label-glass">{{ t("gasReclaimed") }}</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { formatNumber } from "@/shared/utils/format";
import { AppIcon, NeoCard } from "@/shared/components";

defineProps<{
  totalDestroyed: number;
  gasReclaimed: number;
  t: (key: string) => string;
}>();

const formatNum = (n: number) => formatNumber(n, 2);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.graveyard-hero-card {
  overflow: hidden;
}

.tombstone-scene-glass {
  height: 140px;
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  margin-bottom: $space-6;
  position: relative;
  background: linear-gradient(180deg, rgba(20, 20, 40, 0.4), rgba(40, 40, 60, 0.6));
  border-radius: 8px;
  padding: 0 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.moon-glass {
  position: absolute;
  top: 15px;
  right: 30px;
  width: 40px;
  height: 40px;
  background: #ffde59;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(255, 222, 89, 0.6);
  opacity: 0.8;
}

.tombstone-glass {
  width: 50px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 25px 25px 4px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
  backdrop-filter: blur(4px);
  &.tombstone-1 { bottom: 0; transform: scale(0.9); }
  &.tombstone-2 { bottom: 0; transform: scale(1.1); z-index: 3; }
  &.tombstone-3 { bottom: 0; transform: scale(0.95); }
}

.rip-glass {
  font-size: 10px;
  color: var(--text-secondary);
  font-weight: 700;
  letter-spacing: 1px;
}

.hero-stats-glass {
  display: flex;
  gap: $space-4;
}

.hero-stat-glass {
  flex: 1;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  padding: $space-4;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: background 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.hero-stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.hero-stat-value-glass {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: $font-mono;
  display: block;
}

.hero-stat-label-glass {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary);
  letter-spacing: 1px;
  margin-top: 4px;
  display: block;
}

.fog {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.1), transparent);
  filter: blur(8px);
  z-index: 10;
}
</style>
