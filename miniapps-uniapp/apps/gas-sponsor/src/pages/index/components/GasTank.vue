<template>
  <NeoCard class="gas-tank-card">
    <view class="gas-tank-container">
      <view class="gas-tank">
        <!-- Technical Grid Background -->
        <view class="tank-grid"></view>

        <!-- Graduation Marks -->
        <view class="tank-graduations">
          <view class="graduation-mark" style="top: 20%"></view>
          <view class="graduation-mark" style="top: 40%"></view>
          <view class="graduation-mark" style="top: 60%"></view>
          <view class="graduation-mark" style="top: 80%"></view>
        </view>

        <view class="tank-body">
          <view class="fuel-level" :style="{ height: fuelLevelPercent + '%' }">
            <view class="fuel-surface"></view>
            <!-- Bubbles for liquid effect -->
            <view class="fuel-bubble b1"></view>
            <view class="fuel-bubble b2"></view>
            <view class="fuel-bubble b3"></view>
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.gas-tank-card { margin-bottom: 16px; }
.gas-tank-container { display: flex; flex-direction: column; align-items: center; padding: 24px; gap: 24px; }

.gas-tank {
  position: relative;
  width: 140px;
  height: 180px;
  background: var(--bg-card, rgba(20, 20, 20, 0.6));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow:
    inset 0 0 30px rgba(0, 0, 0, 0.5),
    0 10px 40px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05); /* Outer ring */
}

/* Technical Grid Overlay */
.tank-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 1;
}

.tank-graduations {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 20px;
  z-index: 4;
}

.graduation-mark {
  position: absolute;
  right: 0;
  width: 8px;
  height: 1px;
  background: rgba(255, 255, 255, 0.3);
  &::before {
    content: '';
    position: absolute;
    right: 18px;
    top: -3px;
    font-size: 8px;
    color: rgba(255, 255, 255, 0.3);
  }
}

.tank-glass-highlight {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 40px;
  height: 120px;
  background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%);
  border-radius: 12px;
  pointer-events: none;
  z-index: 5;
}

.fuel-level {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(0, 229, 153, 0.95) 0%, rgba(0, 150, 100, 0.95) 100%);
  transition: height 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 40px rgba(0, 229, 153, 0.4);
  z-index: 2;
  overflow: hidden;
}

.fuel-surface {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
}

/* Bubbles Animation */
.fuel-bubble {
  position: absolute;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: bubble-rise 4s infinite ease-in;
  bottom: -10px;
}

.b1 { width: 6px; height: 6px; left: 20%; animation-duration: 3s; animation-delay: 0s; }
.b2 { width: 4px; height: 4px; left: 50%; animation-duration: 5s; animation-delay: 1s; }
.b3 { width: 8px; height: 8px; left: 80%; animation-duration: 4s; animation-delay: 2s; }

@keyframes bubble-rise {
  0% { transform: translateY(0); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: translateY(-100px); opacity: 0; }
}

.tank-gauge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  letter-spacing: 0.1em;
  margin-bottom: 4px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}

.gauge-value {
  font-size: 28px;
  font-weight: 800;
  font-family: $font-family;
  color: white;
  text-shadow: 0 2px 10px rgba(0,0,0,0.5);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &.eligible {
    border-color: rgba(255, 222, 89, 0.6);
    color: #ffde59;
    box-shadow: 0 0 20px rgba(255, 222, 89, 0.2), inset 0 0 10px rgba(255, 222, 89, 0.1);
  }

  &.full {
    border-color: rgba(0, 229, 153, 0.6);
    color: #00E599;
    box-shadow: 0 0 20px rgba(0, 229, 153, 0.2), inset 0 0 10px rgba(0, 229, 153, 0.1);
  }
}

.status-text {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
