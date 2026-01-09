<template>
  <NeoCard title="" class="gas-tank-card">
    <view class="gas-tank-container">
      <view class="gas-tank">
        <view class="tank-body">
          <view class="fuel-level" :style="{ height: fuelLevelPercent + '%' }">
            <view class="fuel-surface"></view>
          </view>
          <view class="tank-glass-highlight"></view>
          <view class="tank-gauge">
            <text class="gauge-label">GAS</text>
            <text class="gauge-value">{{ formatBalance(gasBalance) }}</text>
          </view>
        </view>
      </view>
      <view class="tank-status">
        <view :class="['status-indicator', isEligible ? 'eligible' : 'full']">
          <text class="status-icon">{{ isEligible ? "⚡" : "✓" }}</text>
          <text class="status-text">{{ isEligible ? t("needsFuel") : t("tankFull") }}</text>
        </view>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  fuelLevelPercent: number;
  gasBalance: string;
  isEligible: boolean;
  t: (key: string) => string;
}>();

const formatBalance = (val: string | number) => parseFloat(String(val)).toFixed(4);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.gas-tank-card { margin-bottom: 16px; }
.gas-tank-container { display: flex; flex-direction: column; align-items: center; padding: 24px; gap: 24px; }

.gas-tank {
  position: relative;
  width: 120px;
  height: 160px;
  background: var(--bg-card, rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  box-shadow:
    inset 0 0 30px rgba(0, 0, 0, 0.5),
    0 10px 30px rgba(0, 0, 0, 0.3);
}

.tank-glass-highlight {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 100px;
  background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%);
  border-radius: 10px;
  pointer-events: none;
  z-index: 3;
}

.fuel-level {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(0, 229, 153, 0.9) 0%, rgba(0, 150, 100, 0.9) 100%);
  transition: height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 30px rgba(0, 229, 153, 0.3);
}

.fuel-surface {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.tank-gauge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.1em;
  margin-bottom: 4px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.gauge-value {
  font-size: 24px;
  font-weight: 800;
  font-family: 'Inter', sans-serif;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &.eligible {
    border-color: rgba(255, 222, 89, 0.5);
    color: #ffde59;
    box-shadow: 0 0 15px rgba(255, 222, 89, 0.15);
  }

  &.full {
    border-color: rgba(0, 229, 153, 0.5);
    color: #00E599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.15);
  }
}

.status-text {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
