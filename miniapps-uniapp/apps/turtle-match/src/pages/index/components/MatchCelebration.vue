<template>
  <view v-if="visible" class="match-celebration">
    <view class="match-celebration__backdrop" />

    <!-- Matched turtles -->
    <view class="match-celebration__turtles">
      <view class="match-celebration__turtle match-celebration__turtle--left">
        <TurtleSprite :color="turtleColor" matched />
      </view>
      <view class="match-celebration__turtle match-celebration__turtle--right">
        <TurtleSprite :color="turtleColor" matched />
      </view>
    </view>

    <!-- Reward display -->
    <view class="match-celebration__reward">
      <text class="match-celebration__amount">+{{ formattedReward }}</text>
      <text class="match-celebration__unit">GAS</text>
    </view>

    <!-- Coin particles -->
    <view class="match-celebration__coins">
      <view v-for="i in 8" :key="i" class="match-celebration__coin">
        <text>🪙</text>
      </view>
    </view>

    <!-- Confetti -->
    <view class="match-celebration__confetti">
      <view v-for="i in 20" :key="i" class="match-celebration__confetti-piece" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { TurtleColor } from "@/shared/composables/useTurtleMatch";
import TurtleSprite from "./TurtleSprite.vue";

const props = defineProps<{
  visible: boolean;
  turtleColor: TurtleColor;
  reward: bigint;
}>();

const emit = defineEmits<{
  (e: "complete"): void;
}>();

const formattedReward = computed(() => {
  const gas = Number(props.reward) / 100000000;
  return gas.toFixed(2);
});

watch(() => props.visible, (val) => {
  if (val) {
    setTimeout(() => {
      emit("complete");
    }, 1500);
  }
});
</script>

<style lang="scss" scoped>
.match-celebration {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  pointer-events: none;
}

.match-celebration__backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
  animation: backdrop-pulse 0.5s ease-out;
}

.match-celebration__turtles {
  display: flex;
  gap: 40px;
  margin-bottom: 20px;
}

.match-celebration__turtle {
  animation: turtle-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

  &--left {
    animation-delay: 0s;
  }
  &--right {
    animation-delay: 0.1s;
  }
}

.match-celebration__reward {
  display: flex;
  align-items: baseline;
  gap: 8px;
  animation: reward-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}

.match-celebration__amount {
  font-size: 48px;
  font-weight: bold;
  color: #F59E0B;
  text-shadow: 0 0 20px rgba(245, 158, 11, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3);
}

.match-celebration__unit {
  font-size: 24px;
  font-weight: 600;
  color: #FCD34D;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.match-celebration__coins {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.match-celebration__coin {
  position: absolute;
  top: 50%;
  left: 50%;
  font-size: 24px;

  @for $i from 1 through 8 {
    &:nth-child(#{$i}) {
      animation: coin-burst 1s ease-out forwards;
      animation-delay: #{$i * 0.05}s;
      --angle: #{$i * 45}deg;
      --distance: #{60 + random(40)}px;
    }
  }
}

.match-celebration__confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.match-celebration__confetti-piece {
  position: absolute;
  width: 10px;
  height: 10px;
  top: -20px;

  @for $i from 1 through 20 {
    &:nth-child(#{$i}) {
      left: #{random(100)}%;
      background: nth((#EF4444, #F97316, #EAB308, #22C55E, #3B82F6, #A855F7), random(6));
      animation: confetti-fall #{1 + random(10) * 0.1}s linear #{$i * 0.05}s forwards;
      transform: rotate(#{random(360)}deg);
    }
  }
}

@keyframes backdrop-pulse {
  0% { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes turtle-bounce {
  0% { transform: scale(0) rotate(-20deg); }
  50% { transform: scale(1.3) rotate(10deg); }
  100% { transform: scale(1) rotate(0); }
}

@keyframes reward-pop {
  0% { transform: scale(0) translateY(20px); opacity: 0; }
  70% { transform: scale(1.2) translateY(-10px); opacity: 1; }
  100% { transform: scale(1) translateY(0); opacity: 1; }
}

@keyframes coin-burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0) scale(0);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(calc(var(--distance) * 1.5)) scale(0.5);
    opacity: 0;
  }
}

@keyframes confetti-fall {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
</style>
