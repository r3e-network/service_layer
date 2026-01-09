<template>
  <NeoCard :title="t('uploadMemory')">
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
    <text class="hash-note text-[10px] font-bold uppercase opacity-60 mb-6 block">{{ t("hashNote") }}</text>

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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.upload-subtitle {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: $space-6;
  display: block;
  border-left: 4px solid black;
  padding-left: 8px;
}
.hash-note {
  font-size: 10px;
  font-weight: $font-weight-black;
  opacity: 0.8;
  background: var(--bg-elevated, #eee);
  padding: 4px 8px;
  border: 1px solid var(--border-color, black);
  color: var(--text-primary, black);
}
</style>
