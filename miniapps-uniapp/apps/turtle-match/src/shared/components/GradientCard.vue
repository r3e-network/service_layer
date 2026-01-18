<template>
  <view
    :class="['gradient-card', `gradient-card--${variant}`, { 'gradient-card--hoverable': hoverable }]"
    :style="cardStyle"
    @click="hoverable && $emit('click', $event)"
  >
    <view v-if="glow" class="gradient-card__glow" :style="glowStyle" />
    <view class="gradient-card__content">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";

export type GradientVariant = "ocean" | "neo" | "gold" | "glass" | "dark";

const props = withDefaults(
  defineProps<{
    variant?: GradientVariant;
    hoverable?: boolean;
    glow?: boolean;
    glowIntensity?: number;
  }>(),
  {
    variant: "glass",
    hoverable: false,
    glow: false,
    glowIntensity: 0.3,
  },
);

defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const gradients: Record<GradientVariant, string> = {
  ocean: "linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)",
  neo: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.1) 100%)",
  gold: "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(255, 215, 0, 0.1) 100%)",
  glass: "rgba(255, 255, 255, 0.03)",
  dark: "rgba(0, 0, 0, 0.4)",
};

const glowColors: Record<GradientVariant, string> = {
  ocean: "rgba(6, 182, 212, 0.4)",
  neo: "rgba(16, 185, 129, 0.4)",
  gold: "rgba(245, 158, 11, 0.4)",
  glass: "rgba(255, 255, 255, 0.1)",
  dark: "rgba(0, 0, 0, 0.2)",
};

const cardStyle = computed(() => ({
  background: gradients[props.variant],
}));

const glowStyle = computed(() => ({
  background: glowColors[props.variant],
  opacity: props.glowIntensity,
}));
</script>

<style lang="scss">
@use "@/shared/styles/tokens.scss" as *;

.gradient-card {
  position: relative;
  border-radius: var(--card-radius, 20px);
  border: 1px solid rgba(16, 185, 129, 0.15);
  backdrop-filter: blur(var(--blur-radius, 50px));
  -webkit-backdrop-filter: blur(var(--blur-radius, 50px));
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &__glow {
    position: absolute;
    width: 150%;
    height: 150%;
    top: -25%;
    left: -25%;
    filter: blur(60px);
    pointer-events: none;
    z-index: 0;
  }

  &__content {
    position: relative;
    z-index: 1;
    padding: 20px;
  }
}

.gradient-card--hoverable {
  cursor: pointer;

  &:hover {
    transform: translateY(-4px) scale(1.01);
    border-color: var(--text-muted);
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
  }

  &:active {
    transform: translateY(-1px) scale(1);
  }
}

.gradient-card--ocean {
  border-color: rgba(6, 182, 212, 0.2);
}

.gradient-card--neo {
  border-color: rgba(16, 185, 129, 0.2);
}

.gradient-card--gold {
  border-color: rgba(245, 158, 11, 0.2);
}
</style>
