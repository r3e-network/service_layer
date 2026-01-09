<template>
  <view class="card">
    <text class="card-title">{{ t("createCapsule") }}</text>

    <view class="form-section">
      <text class="form-label">{{ t("capsuleName") }}</text>
      <view class="input-wrapper-clean">
        <NeoInput
          :modelValue="name"
          @update:modelValue="$emit('update:name', $event)"
          :placeholder="t('capsuleNamePlaceholder')"
        />
      </view>
    </view>

    <view class="form-section">
      <text class="form-label">{{ t("secretMessage") }}</text>
      <view class="input-wrapper-clean">
        <NeoInput
          :modelValue="content"
          @update:modelValue="$emit('update:content', $event)"
          :placeholder="t('secretMessagePlaceholder')"
          type="textarea"
          class="textarea-field"
        />
      </view>
    </view>

    <view class="form-section">
      <text class="form-label">{{ t("unlockIn") }}</text>
      <view class="date-picker">
        <view class="input-wrapper-clean small">
          <NeoInput
            :modelValue="days"
            @update:modelValue="$emit('update:days', $event)"
            type="number"
            :placeholder="t('daysPlaceholder')"
            class="days-input"
          />
        </view>
        <text class="days-text">{{ t("days") }}</text>
      </view>
      <text class="helper-text">{{ t("unlockDateHelper") }}</text>
    </view>

    <NeoButton
      variant="primary"
      size="lg"
      block
      :loading="isLoading"
      :disabled="isLoading || !canCreate"
      @click="$emit('create')"
      class="mt-6"
    >
      {{ isLoading ? t("creating") : t("createCapsuleButton") }}
    </NeoButton>
  </view>
</template>

<script setup lang="ts">
import { NeoInput, NeoButton } from "@/shared/components";

defineProps<{
  name: string;
  content: string;
  days: string;
  isLoading: boolean;
  canCreate: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:name", "update:content", "update:days", "create"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.card {
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  box-shadow: 10px 10px 0 var(--shadow-color, black);
  padding: $space-6;
  margin-bottom: $space-6;
  color: var(--text-primary, black);
}

.card-title {
  color: var(--text-primary, black);
  font-size: 24px;
  font-weight: $font-weight-black;
  margin-bottom: $space-6;
  text-transform: uppercase;
  border-bottom: 4px solid var(--brutal-yellow);
  display: inline-block;
}

.form-section {
  margin-bottom: $space-6;
}
.form-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: $space-2;
  display: block;
}
.textarea-field {
  min-height: 120px;
  border: 3px solid var(--border-color, black) !important;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-2;
}
.days-input {
  width: 100px;
}
.days-text {
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 14px;
}

.helper-text {
  font-size: 10px;
  opacity: 0.6;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
</style>
