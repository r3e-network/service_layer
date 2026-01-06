<template>
  <button
    :class="[
      'neo-btn',
      `neo-btn--${variant}`,
      `neo-btn--${size}`,
      { 'neo-btn--block': block, 'neo-btn--loading': loading },
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <view v-if="loading" class="neo-btn__spinner" />
    <slot v-else />
  </button>
</template>

<script setup lang="ts">
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
export type ButtonSize = "sm" | "md" | "lg";

defineProps<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  disabled?: boolean;
  loading?: boolean;
}>();

defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>

<style lang="scss">
@import "@/shared/styles/tokens.scss";

.neo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  font-family: $font-family;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  border: $border-width-md solid var(--border-color);
  transition:
    transform $transition-fast,
    box-shadow $transition-fast;

  &:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: none !important;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--block {
    width: 100%;
  }

  // Sizes
  &--sm {
    height: 36px;
    padding: 0 $space-4;
    font-size: $font-size-sm;
  }

  &--md {
    height: 48px;
    padding: 0 $space-6;
    font-size: $font-size-base;
  }

  &--lg {
    height: 56px;
    padding: 0 $space-8;
    font-size: $font-size-lg;
  }

  // Variants
  &--primary {
    background: var(--neo-green);
    color: $neo-black;
    box-shadow: $shadow-md;

    &:hover:not(:disabled) {
      background: lighten($neo-green, 5%);
    }
  }

  &--secondary {
    background: var(--bg-card);
    color: var(--text-primary);
    box-shadow: $shadow-md;

    &:hover:not(:disabled) {
      background: var(--bg-elevated);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--text-primary);
    box-shadow: none;

    &:hover:not(:disabled) {
      background: var(--bg-secondary);
    }
  }

  &--danger {
    background: var(--brutal-red);
    color: $neo-white;
    box-shadow: 5px 5px 0 darken($brutal-red, 20%);

    &:hover:not(:disabled) {
      background: lighten($brutal-red, 5%);
    }
  }

  &--success {
    background: var(--status-success);
    color: var(--text-on-success);
    box-shadow: 5px 5px 0 darken($neo-green, 20%);

    &:hover:not(:disabled) {
      background: lighten($neo-green, 5%);
    }
  }

  &--warning {
    background: var(--status-warning);
    color: var(--neo-black);
    box-shadow: 5px 5px 0 darken($brutal-yellow, 20%);

    &:hover:not(:disabled) {
      background: lighten($brutal-yellow, 5%);
    }
  }

  // Loading spinner
  &__spinner {
    width: 20px;
    height: 20px;
    border: 3px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
