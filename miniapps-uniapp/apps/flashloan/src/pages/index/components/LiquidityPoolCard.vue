<template>
  <NeoCard variant="erobo-neo" class="liquidity-card">
    <view class="card-header">
      <view class="header-left">
        <text class="card-title">{{ t("availableLiquidity") }}</text>
        <view class="live-indicator">
          <view class="live-dot"></view>
          <text class="live-text">LIVE</text>
        </view>
      </view>
      <view class="lightning-badge">⚡</view>
    </view>
    
    <view class="liquidity-grid">
      <!-- GAS Pool -->
      <view class="liquidity-item">
        <view class="item-header">
          <view class="token-badge gas">
            <text class="token-symbol">GAS</text>
          </view>
          <text class="token-amount">{{ formatNum(gasLiquidity) }}</text>
        </view>
        <view class="liquidity-track">
          <view class="liquidity-bar gas-bar" :style="{ width: '75%' }">
            <view class="bar-glow"></view>
            <view class="bar-shine"></view>
          </view>
        </view>
        <text class="utilization-text">75% Utilization</text>
      </view>

      <!-- NEO Pool -->
      <view class="liquidity-item">
        <view class="item-header">
          <view class="token-badge neo">
            <text class="token-symbol">NEO</text>
          </view>
          <text class="token-amount">{{ neoLiquidity }}</text>
        </view>
        <view class="liquidity-track">
          <view class="liquidity-bar neo-bar" :style="{ width: '60%' }">
            <view class="bar-glow"></view>
            <view class="bar-shine"></view>
          </view>
        </view>
        <text class="utilization-text">60% Utilization</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  gasLiquidity: number;
  neoLiquidity: number;
  t: (key: string) => string;
}>();

const formatNum = (n: number) => {
  if (n === undefined || n === null) return "0";
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  color: white;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.2);
}

.live-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 229, 153, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(0, 229, 153, 0.2);
}

.live-dot {
  width: 4px;
  height: 4px;
  background: #00e599;
  border-radius: 50%;
  box-shadow: 0 0 5px #00e599;
  animation: pulse 1.5s infinite;
}

.live-text {
  font-size: 8px;
  font-weight: 700;
  color: #00e599;
  letter-spacing: 0.1em;
}

.lightning-badge {
  background: rgba(0, 229, 153, 0.2);
  color: #00e599;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 0 15px rgba(0, 229, 153, 0.3);
  border: 1px solid rgba(0, 229, 153, 0.3);
}

.liquidity-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.token-badge {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  &.gas {
    background: rgba(0, 229, 153, 0.15);
    color: #00e599;
    border: 1px solid rgba(0, 229, 153, 0.3);
  }
  &.neo {
    background: rgba(167, 139, 250, 0.15);
    color: #a78bfa;
    border: 1px solid rgba(167, 139, 250, 0.3);
  }
}

.token-amount {
  font-family: $font-mono;
  font-weight: 700;
  font-size: 20px;
  color: white;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
}

.liquidity-track {
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.liquidity-bar {
  height: 100%;
  position: relative;
  border-radius: 4px;
  
  &.gas-bar {
    background: linear-gradient(90deg, #059669, #00e599);
    box-shadow: 0 0 10px rgba(0, 229, 153, 0.4);
  }
  &.neo-bar {
    background: linear-gradient(90deg, #7c3aed, #a78bfa);
    box-shadow: 0 0 10px rgba(167, 139, 250, 0.4);
  }
}

.bar-shine {
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transform: skewX(-20deg) translateX(-150%);
  animation: shine 2.5s infinite;
}

.utilization-text {
  display: block;
  text-align: right;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 4px;
  font-weight: 600;
  text-transform: uppercase;
}

@keyframes shine {
  0% { transform: skewX(-20deg) translateX(-150%); }
  50% { transform: skewX(-20deg) translateX(250%); }
  100% { transform: skewX(-20deg) translateX(250%); }
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
