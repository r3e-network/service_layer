<template>
  <view v-if="luckyMessage" class="lucky-overlay" @click="$emit('close')">
    <view class="lucky-card" @click.stop>
      <text class="lucky-header">🎉 {{ t("congratulations") }} 🎉</text>
      <view class="lucky-amount-box">
        <text class="lucky-amount">{{ luckyMessage.amount }}</text>
        <text class="lucky-currency">GAS</text>
      </view>
      <text class="lucky-from">{{ t("from").replace("{0}", luckyMessage.from) }}</text>
      <view class="coins-rain">
        <view v-for="i in 12" :key="i" class="coin-item" :style="{ animationDelay: `${i * 0.15}s`, left: `${Math.random() * 100}%` }">
          <AppIcon name="money" :size="24" class="text-accent" />
        </view>
      </view>
      <NeoButton variant="primary" size="lg" block class="mt-8" @click="$emit('close')">
        <text class="font-bold uppercase">{{ t("confirm") || "OK" }}</text>
      </NeoButton>
    </view>
  </view>
</template>

<script setup lang="ts">
import { AppIcon, NeoButton } from "@/shared/components";

defineProps<{
  luckyMessage: { amount: number; from: string } | null;
  t: (key: string) => string;
}>();

defineEmits(["close"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.lucky-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.lucky-card {
  background: rgba(26, 26, 26, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  width: 85%;
  max-width: 360px;
  position: relative;
}

.lucky-header {
  font-size: 20px;
  font-weight: 800;
  color: #00E599;
  display: block;
  text-transform: uppercase;
  margin-bottom: 24px;
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
}

.lucky-amount-box {
  margin: 32px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lucky-amount {
  font-size: 64px;
  font-weight: 800;
  color: white;
  font-family: $font-family;
  line-height: 1;
  text-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.lucky-currency {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  text-transform: uppercase;
  margin-top: 8px;
}

.lucky-from {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, rgba(255, 255, 255, 0.8));
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  padding: 8px 16px;
  border-radius: 100px;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.coins-rain { pointer-events: none; }
.coin-item {
  position: absolute; top: -50px; animation: rain 2s linear infinite;
  color: #FFDE59;
}
.text-accent { color: #FFDE59; }

@keyframes rain { 100% { top: 120%; } }

.mt-8 { margin-top: 32px; }
</style>
