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
      transform: "rotateY(1800deg) rotateX(15deg)",
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.coin-scene {
  width: 120px;
  height: 120px;
  perspective: 1000px;
  margin: 30px auto;
  filter: drop-shadow(0 0 20px rgba(0, 229, 153, 0.4));
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
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.2);
}

.heads {
  background: radial-gradient(circle at 30% 30%, #00E599, #008f5d);
  transform: rotateY(0deg) translateZ(5px);
  border: 4px solid #00E599;
  box-shadow: 0 0 30px rgba(0, 229, 153, 0.3);

  .symbol {
    font-size: 60px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
}

.tails {
  background: radial-gradient(circle at 30% 30%, #a855f7, #6b21a8);
  transform: rotateY(180deg) translateZ(5px);
  border: 4px solid #a855f7;
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.3);

  .symbol {
    font-size: 60px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
}

.side {
  // Simplified for performance in uni-app/webview
}
</style>
