<template>
  <NeoCard variant="erobo" class="arena-card">
    <view class="flex flex-col items-center gap-6">
      <ThreeDCoin :result="displayOutcome" :flipping="isFlipping" />
      <text class="status-text" :class="{ blink: isFlipping }">
        {{ isFlipping ? t("flipping") : result ? (result.won ? t("youWon") : t("youLost")) : t("placeBet") }}
      </text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import ThreeDCoin from "@/components/ThreeDCoin.vue";
import { NeoCard } from "@/shared/components";

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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";



.status-text {
  font-family: $font-mono;
  font-weight: 800;
  text-transform: uppercase;
  color: #9f9df3;
  font-size: 18px;
  background: rgba(159, 157, 243, 0.1);
  padding: 8px 16px;
  border: 1px solid rgba(159, 157, 243, 0.3);
  border-radius: 99px;
  backdrop-filter: blur(10px);
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
