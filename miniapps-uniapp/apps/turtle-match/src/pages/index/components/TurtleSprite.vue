<template>
  <view 
    :class="['turtle-sprite', `turtle-sprite--${colorName}`, { 
      'turtle-sprite--matched': matched,
      'turtle-sprite--animating': animating 
    }]"
    :style="{ '--turtle-color': colorHex }"
  >
    <view class="turtle-sprite__shell">
      <view class="turtle-sprite__pattern" />
    </view>
    <view class="turtle-sprite__head" />
    <view class="turtle-sprite__legs">
      <view class="turtle-sprite__leg turtle-sprite__leg--fl" />
      <view class="turtle-sprite__leg turtle-sprite__leg--fr" />
      <view class="turtle-sprite__leg turtle-sprite__leg--bl" />
      <view class="turtle-sprite__leg turtle-sprite__leg--br" />
    </view>
    <view class="turtle-sprite__tail" />
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { TurtleColor, COLOR_CSS, COLOR_NAMES } from "@/shared/composables/useTurtleMatch";

const props = withDefaults(
  defineProps<{
    color: TurtleColor;
    matched?: boolean;
    animating?: boolean;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    matched: false,
    animating: false,
    size: "md",
  }
);

const colorHex = computed(() => COLOR_CSS[props.color]);
const colorName = computed(() => {
  const names = ["red", "orange", "yellow", "green", "blue", "purple", "pink", "gold"];
  return names[props.color] || "green";
});
</script>

<style lang="scss" scoped>
.turtle-sprite {
  --turtle-color: #22C55E;
  position: relative;
  width: 60px;
  height: 60px;
  animation: turtle-bob 2s ease-in-out infinite;

  &--matched {
    animation: turtle-match 0.5s ease-in-out;
  }

  &--animating {
    animation: turtle-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.turtle-sprite__shell {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 36px;
  background: var(--turtle-color);
  border-radius: 50% 50% 45% 45%;
  box-shadow: 
    inset 0 -8px 12px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.3);
}

.turtle-sprite__pattern {
  position: absolute;
  top: 6px;
  left: 6px;
  right: 6px;
  bottom: 8px;
  background: 
    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 40%),
    radial-gradient(circle at 70% 30%, rgba(255,255,255,0.2) 0%, transparent 35%),
    radial-gradient(circle at 50% 70%, rgba(255,255,255,0.2) 0%, transparent 35%);
  border-radius: inherit;
}

.turtle-sprite__head {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 12px;
  background: color-mix(in srgb, var(--turtle-color) 70%, #8B7355);
  border-radius: 50% 50% 40% 40%;
  
  &::before, &::after {
    content: '';
    position: absolute;
    top: 3px;
    width: 3px;
    height: 3px;
    background: #1a1a1a;
    border-radius: 50%;
  }
  &::before { left: 3px; }
  &::after { right: 3px; }
}

.turtle-sprite__leg {
  position: absolute;
  width: 10px;
  height: 8px;
  background: color-mix(in srgb, var(--turtle-color) 70%, #8B7355);
  border-radius: 50%;
  
  &--fl { top: 18px; left: 4px; }
  &--fr { top: 18px; right: 4px; }
  &--bl { bottom: 14px; left: 6px; }
  &--br { bottom: 14px; right: 6px; }
}

.turtle-sprite__tail {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 8px;
  background: color-mix(in srgb, var(--turtle-color) 70%, #8B7355);
  border-radius: 0 0 50% 50%;
}

@keyframes turtle-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes turtle-enter {
  0% { 
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% { 
    transform: scale(1) rotate(0);
    opacity: 1;
  }
}

@keyframes turtle-match {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.2); }
  50% { transform: scale(0.9); }
  75% { transform: scale(1.1); }
}
</style>
