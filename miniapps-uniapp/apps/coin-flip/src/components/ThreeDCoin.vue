<template>
  <view class="coin-scene">
    <view class="coin" :class="{ flipping: flipping }" :style="coinStyle">
      <view class="face heads">
        <text class="symbol">🐲</text>
        <!-- Neo Dragon/Green -->
      </view>
      <view class="face tails">
        <text class="symbol">🔴</text>
        <!-- Red Pulse -->
      </view>
      <!-- Pseudo-thickness -->
      <view class="side"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  result: "heads" | "tails" | null; // null = initial state
  flipping: boolean;
}>();

const coinStyle = computed(() => {
  if (props.flipping) {
    return {
      transform: `rotateY(${1800 + Math.random() * 360}deg) rotateX(${Math.random() * 30}deg)`,
      transition: "transform 2s ease-in-out",
    };
  }

  // Resting state
  const rotation = props.result === "tails" ? 180 : 0;
  // Add some previous rotations if needed to prevent unwinding, but for simplicity reset or stick
  // To keep it simple we just set final rotation.
  // For a seamless specialized animation we'd need to track total rotations.
  // We'll trust the flipping clean-up or just set huge numbers.

  return {
    transform: `rotateY(${rotation}deg)`,
    transition: "transform 0.5s ease-out",
  };
});
</script>

<style scoped lang="scss">
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.coin-scene {
  width: 120px;
  height: 120px;
  perspective: 1000px;
  margin: 30px auto;
  filter: drop-shadow(0 0 20px var(--neo-green));
}

.coin {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 1s;
  border-radius: 50%;
}

.face {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 30px rgba(0, 229, 153, 0.3),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  border: 4px solid var(--brutal-orange);
}

.heads {
  background: radial-gradient(circle at 30% 30%, var(--brutal-yellow), var(--brutal-orange));
  transform: rotateY(0deg) translateZ(5px);

  .symbol {
    font-size: 60px;
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
  }
}

.tails {
  background: radial-gradient(circle at 30% 30%, var(--bg-elevated), var(--text-secondary));
  transform: rotateY(180deg) translateZ(5px);

  .symbol {
    font-size: 60px;
    filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3));
  }
}

.side {
  // Simplified for performance in uni-app/webview
}
</style>
