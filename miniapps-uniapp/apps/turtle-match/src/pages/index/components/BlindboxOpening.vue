<template>
  <view v-if="visible" class="blindbox-opening">
    <view class="blindbox-opening__backdrop" />
    <view :class="['blindbox-opening__box', { 'blindbox-opening__box--opening': isOpening }]">
      <view class="blindbox-opening__lid" />
      <view class="blindbox-opening__body">
        <text class="blindbox-opening__question">?</text>
      </view>
    </view>
    <view v-if="showTurtle" class="blindbox-opening__reveal">
      <TurtleSprite :color="turtleColor" animating />
    </view>
    <view v-if="isOpening" class="blindbox-opening__particles">
      <view v-for="i in 12" :key="i" class="blindbox-opening__particle" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { TurtleColor } from "@/shared/composables/useTurtleMatch";
import TurtleSprite from "./TurtleSprite.vue";

const props = defineProps<{
  visible: boolean;
  turtleColor: TurtleColor;
}>();

const emit = defineEmits<{
  (e: "complete"): void;
}>();

const isOpening = ref(false);
const showTurtle = ref(false);

watch(() => props.visible, (val) => {
  if (val) {
    isOpening.value = false;
    showTurtle.value = false;
    setTimeout(() => {
      isOpening.value = true;
    }, 300);
    setTimeout(() => {
      showTurtle.value = true;
    }, 1200);
    setTimeout(() => {
      emit("complete");
    }, 2000);
  }
});
</script>

<style lang="scss" scoped>
.blindbox-opening {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.blindbox-opening__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
}

.blindbox-opening__box {
  position: relative;
  z-index: 1;
  width: 120px;
  height: 140px;
  animation: box-shake 0.5s ease-in-out infinite;

  &--opening {
    animation: box-open 1s ease-out forwards;

    .blindbox-opening__lid {
      animation: lid-open 0.5s ease-out forwards;
    }
  }
}

.blindbox-opening__lid {
  position: absolute;
  top: 0;
  left: -5px;
  right: -5px;
  height: 30px;
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  border-radius: 8px 8px 0 0;
  transform-origin: bottom center;
  box-shadow: 0 -4px 12px rgba(16, 185, 129, 0.3);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 8px;
    background: #F59E0B;
    border-radius: 4px;
  }
}

.blindbox-opening__body {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 110px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
}

.blindbox-opening__question {
  font-size: 48px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.blindbox-opening__reveal {
  position: absolute;
  z-index: 2;
  animation: turtle-reveal 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.blindbox-opening__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.blindbox-opening__particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: #F59E0B;
  border-radius: 50%;

  @for $i from 1 through 12 {
    &:nth-child(#{$i}) {
      animation: particle-burst 1s ease-out forwards;
      animation-delay: #{$i * 0.05}s;
      --angle: #{$i * 30}deg;
    }
  }
}

@keyframes box-shake {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

@keyframes box-open {
  0% { transform: scale(1); }
  30% { transform: scale(1.1); }
  50% { transform: scale(1.05); }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

@keyframes lid-open {
  0% { transform: rotateX(0); }
  100% { transform: rotateX(-120deg); }
}

@keyframes turtle-reveal {
  0% {
    transform: scale(0) translateY(50px);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) translateY(-20px);
    opacity: 1;
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes particle-burst {
  0% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--angle)) translateX(100px);
    opacity: 0;
  }
}
</style>
