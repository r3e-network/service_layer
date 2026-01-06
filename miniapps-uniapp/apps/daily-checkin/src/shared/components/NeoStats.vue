<template>
  <view class="neo-stats">
    <view
      v-for="stat in stats"
      :key="stat.label"
      class="neo-stats__item"
      :class="`neo-stats__item--${stat.variant || 'default'}`"
    >
      <text class="neo-stats__value">{{ stat.value }}</text>
      <text class="neo-stats__label">{{ stat.label }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface StatItem {
  label: string;
  value: string | number;
  variant?: "default" | "success" | "danger" | "warning" | "accent";
}

defineProps<{
  stats: StatItem[];
}>();
</script>

<style lang="scss">
@import "@/shared/styles/tokens.scss";

.neo-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-3;

  &__item {
    background: var(--bg-secondary);
    border: $border-width-md solid var(--border-color);
    box-shadow: $shadow-sm;
    padding: $space-4;
    text-align: center;

    &--success .neo-stats__value {
      color: var(--status-success);
    }
    &--danger .neo-stats__value {
      color: var(--status-error);
    }
    &--warning .neo-stats__value {
      color: var(--status-warning);
    }
    &--accent .neo-stats__value {
      color: var(--neo-green);
    }
  }

  &__value {
    display: block;
    font-size: $font-size-2xl;
    font-weight: $font-weight-black;
    color: var(--text-primary);
    font-family: $font-mono;
  }

  &__label {
    display: block;
    font-size: $font-size-xs;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-top: $space-1;
  }
}
</style>
