<template>
  <view
    :class="['neo-card', `neo-card--${variant}`, { 'neo-card--hoverable': hoverable, 'neo-card--flat': flat }]"
    @click="hoverable && $emit('click', $event)"
  >
    <view v-if="title || $slots.header" class="neo-card__header">
      <text v-if="title" class="neo-card__title">{{ title }}</text>
      <slot name="header" />
    </view>
    <view class="neo-card__body">
      <slot />
    </view>
    <view v-if="$slots.footer" class="neo-card__footer">
      <slot name="footer" />
    </view>
  </view>
</template>

<script setup lang="ts">
export type CardVariant = "default" | "accent" | "success" | "warning" | "danger";

defineProps<{
  title?: string;
  variant?: CardVariant;
  hoverable?: boolean;
  flat?: boolean;
}>();

defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>

<style lang="scss">
@import "@/shared/styles/tokens.scss";

.neo-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;

  &--flat {
    box-shadow: none;
  }

  &--hoverable {
    cursor: pointer;
    &:hover {
      transform: translate(-2px, -2px);
      box-shadow: $shadow-lg;
    }
    &:active {
      transform: translate(2px, 2px);
      box-shadow: $shadow-sm;
    }
  }

  // Variants
  &--accent {
    border-color: var(--neo-green);
    box-shadow: 5px 5px 0 var(--neo-green);
  }

  &--success {
    border-color: var(--status-success);
    box-shadow: 5px 5px 0 var(--status-success);
  }

  &--warning {
    border-color: var(--status-warning);
    box-shadow: 5px 5px 0 var(--status-warning);
  }

  &--danger {
    border-color: var(--status-error);
    box-shadow: 5px 5px 0 var(--status-error);
  }

  &__header {
    padding: $space-4 $space-5;
    border-bottom: $border-width-sm solid var(--border-color);
  }

  &__title {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  &__body {
    padding: $space-5;
  }

  &__footer {
    padding: $space-4 $space-5;
    border-top: $border-width-sm solid var(--border-color);
    background: var(--bg-secondary);
  }
}
</style>
