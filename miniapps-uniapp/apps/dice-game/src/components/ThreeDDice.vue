<template>
  <view class="scene">
    <view class="cube" :class="{ rolling: rolling }" :style="cubeStyle">
      <view class="face front">
        <view class="dot center"></view>
      </view>
      <view class="face back">
        <view class="dot top-left"></view>
        <view class="dot bottom-right"></view>
        <view class="dot top-right"></view>
        <view class="dot bottom-left"></view>
        <view class="dot center-left"></view>
        <view class="dot center-right"></view>
      </view>
      <view class="face right">
        <!-- 4 -->
        <view class="dot top-left"></view>
        <view class="dot top-right"></view>
        <view class="dot bottom-left"></view>
        <view class="dot bottom-right"></view>
      </view>
      <view class="face left">
        <!-- 3 -->
        <view class="dot top-left"></view>
        <view class="dot center"></view>
        <view class="dot bottom-right"></view>
      </view>
      <view class="face top">
        <!-- 2 -->
        <view class="dot top-left"></view>
        <view class="dot bottom-right"></view>
      </view>
      <view class="face bottom">
        <!-- 5 -->
        <view class="dot top-left"></view>
        <view class="dot top-right"></view>
        <view class="dot center"></view>
        <view class="dot bottom-left"></view>
        <view class="dot bottom-right"></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  value: number;
  rolling: boolean;
}>();

const cubeStyle = computed(() => {
  // Rotations for each number to face forward
  const rotations: Record<number, string> = {
    1: "rotateX(0deg) rotateY(0deg)",
    2: "rotateX(-90deg) rotateY(0deg)",
    3: "rotateX(0deg) rotateY(90deg)",
    4: "rotateX(0deg) rotateY(-90deg)",
    5: "rotateX(90deg) rotateY(0deg)",
    6: "rotateX(180deg) rotateY(0deg)",
  };

  if (props.rolling) {
    return {
      transform: "rotateX(720deg) rotateY(720deg)",
      transition: "transform 0.5s linear",
    };
  }

  return {
    transform: rotations[props.value] || rotations[1],
    transition: "transform 0.5s ease-out",
  };
});
</script>

<style scoped lang="scss">
.scene {
  width: 100px;
  height: 100px;
  perspective: 400px;
  margin: 20px auto;
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 1s;
}

.face {
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.95);
  border: 2px solid #ccc;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.1);
}

// Dot positioning
.dot {
  width: 18px;
  height: 18px;
  background: #333;
  border-radius: 50%;
  position: absolute;
  box-shadow: inset 0 3px 5px rgba(0, 0, 0, 0.3);
}

.center { top: 50%; left: 50%; transform: translate(-50%, -50%); }
.top-left { top: 20%; left: 20%; }
.top-right { top: 20%; right: 20%; }
.bottom-left { bottom: 20%; left: 20%; }
.bottom-right { bottom: 20%; right: 20%; }
.center-left { top: 50%; left: 20%; transform: translateY(-50%); }
.center-right { top: 50%; right: 20%; transform: translateY(-50%); }

// Face Orientations
// Front: 1
.front { transform: translateZ(50px); }
// Back: 6
.back { transform: rotateY(180deg) translateZ(50px); }
// Right: 4
.right { transform: rotateY(90deg) translateZ(50px); }
// Left: 3
.left { transform: rotateY(-90deg) translateZ(50px); }
// Top: 2
.top { transform: rotateX(90deg) translateZ(50px); }
// Bottom: 5
.bottom { transform: rotateX(-90deg) translateZ(50px); }
</style>
