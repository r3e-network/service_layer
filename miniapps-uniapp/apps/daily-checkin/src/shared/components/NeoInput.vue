<template>
  <view class="neo-input" :class="{ 'neo-input--error': error, 'neo-input--disabled': disabled }">
    <text v-if="label" class="neo-input__label">{{ label }}</text>
    <view class="neo-input__wrapper">
      <textarea
        v-if="type === 'textarea'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="neo-input__field neo-input__textarea"
        @input="$emit('update:modelValue', ($event as any).detail.value)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />
      <input
        v-else
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        class="neo-input__field"
        @input="$emit('update:modelValue', ($event as any).detail.value)"
        @focus="$emit('focus', $event)"
        @blur="$emit('blur', $event)"
      />
      <text v-if="suffix" class="neo-input__suffix">{{ suffix }}</text>
    </view>
    <text v-if="error" class="neo-input__error">{{ error }}</text>
    <text v-else-if="hint" class="neo-input__hint">{{ hint }}</text>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string | number;
  type?: "text" | "number" | "password" | "textarea";
  label?: string;
  placeholder?: string;
  suffix?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "focus", event: FocusEvent): void;
  (e: "blur", event: FocusEvent): void;
}>();
</script>

<style lang="scss">
@import "@/shared/styles/tokens.scss";

.neo-input {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-bold;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  &__wrapper {
    display: flex;
    align-items: center;
    background: var(--bg-secondary);
    border: $border-width-md solid var(--border-color);
    box-shadow: $shadow-sm;
    transition: box-shadow $transition-fast;

    &:focus-within {
      box-shadow: 5px 5px 0 var(--neo-green);
      border-color: var(--neo-green);
    }
  }

  &__field {
    flex: 1;
    height: 48px;
    padding: 0 $space-4;
    background: transparent;
    border: none;
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: var(--text-primary);
    width: 100%; /* Ensure width for textarea */

    &::placeholder {
      color: var(--text-muted);
    }
  }

  &__textarea {
    height: 120px;
    padding: $space-3 $space-4;
    line-height: 1.5;
  }

  &__suffix {
    padding: 0 $space-4;
    font-weight: $font-weight-bold;
    color: var(--neo-green);
  }

  &__hint {
    font-size: $font-size-xs;
    color: var(--text-muted);
  }

  &__error {
    font-size: $font-size-xs;
    color: var(--status-error);
    font-weight: $font-weight-medium;
  }

  &--error &__wrapper {
    border-color: var(--status-error);
    box-shadow: 5px 5px 0 var(--status-error);
  }

  &--disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
