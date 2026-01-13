<template>
  <NeoCard :title="t('createCapsule')" variant="erobo-neo">

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
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.form-section {
  margin-bottom: $space-6;
}
.form-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: $space-2;
  display: block;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}
.textarea-field {
  min-height: 120px;
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
  font-weight: 700;
  text-transform: uppercase;
  font-size: 14px;
  color: white;
}

.helper-text {
  font-size: 10px;
  opacity: 0.6;
  font-weight: 600;
  text-transform: uppercase;
  color: #00E599;
}
</style>
