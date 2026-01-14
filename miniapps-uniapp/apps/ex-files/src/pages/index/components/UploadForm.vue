<template>
  <NeoCard variant="erobo-neo">
    <template #header-extra>
      <text class="upload-icon">📤</text>
    </template>

    <text class="upload-subtitle mb-6 text-center block opacity-70">{{ t("uploadSubtitle") }}</text>

    <NeoInput
      :modelValue="recordContent"
      @update:modelValue="$emit('update:recordContent', $event)"
      :label="t('recordContent')"
      :placeholder="t('contentPlaceholder')"
      type="textarea"
      class="mb-2"
    />
    <view class="hash-note-glass mb-6">
      <text class="hash-note-text">🔒 {{ t("hashNote") }}</text>
    </view>

    <NeoInput
      :modelValue="recordRating"
      @update:modelValue="$emit('update:recordRating', $event)"
      :label="t('rating')"
      type="number"
      min="1"
      max="5"
      class="mb-8"
    />

    <NeoButton variant="primary" size="lg" block @click="$emit('create')" :loading="isLoading" :disabled="!canCreate">
      {{ t("createRecord") }}
    </NeoButton>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

defineProps<{
  recordContent: string;
  recordRating: string;
  isLoading: boolean;
  canCreate: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:recordContent", "update:recordRating", "create"]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.upload-icon {
  font-size: 20px;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.upload-subtitle {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  border-left: 2px solid #00E599;
  padding-left: 12px;
  text-align: left !important;
  background: rgba(0, 229, 153, 0.05);
  padding: 8px 12px;
  border-radius: 0 8px 8px 0;
}

.hash-note-glass {
  background: rgba(159, 157, 243, 0.1);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(159, 157, 243, 0.2);
}

.hash-note-text {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #9f9df3;
  letter-spacing: 0.05em;
}
</style>
