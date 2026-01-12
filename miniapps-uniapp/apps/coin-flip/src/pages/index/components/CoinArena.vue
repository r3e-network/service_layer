<template>
  <view class="arena">
    <ThreeDCoin :result="displayOutcome" :flipping="isFlipping" />
    <text class="status-text" :class="{ blink: isFlipping }">
      {{ isFlipping ? t("flipping") : result ? (result.won ? t("youWon") : t("youLost")) : t("placeBet") }}
    </text>
  </view>
</template>

<script setup lang="ts">
import ThreeDCoin from "@/components/ThreeDCoin.vue";

export interface GameResult {
  won: boolean;
  outcome: string;
}

defineProps<{
  displayOutcome: "heads" | "tails" | null;
  isFlipping: boolean;
  result: GameResult | null;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.arena {
  background: linear-gradient(135deg, rgba(159, 157, 243, 0.05) 0%, rgba(123, 121, 209, 0.03) 100%);
  border: 1px solid rgba(159, 157, 243, 0.2);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0 0 30px rgba(159, 157, 243, 0.15);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.status-text {
  font-family: $font-mono;
  font-weight: 800;
  text-transform: uppercase;
  color: #9f9df3;
  font-size: 18px;
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 16px;
  border: 1px solid rgba(159, 157, 243, 0.3);
  border-radius: 99px;
  backdrop-filter: blur(5px);
  text-shadow: 0 0 10px rgba(159, 157, 243, 0.5);
}

.blink {
  animation: flash-status 0.5s infinite;
}
@keyframes flash-status {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}
</style>
