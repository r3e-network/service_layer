<template>
  <NeoCard :title="t('queryRecord')" class="mb-6">
    <template #header-extra>
      <text class="section-icon">🔎</text>
    </template>

    <NeoInput
      :modelValue="queryInput"
      @update:modelValue="$emit('update:queryInput', $event)"
      :label="t('queryLabel')"
      :placeholder="t('queryPlaceholder')"
      class="mb-4"
    />

    <NeoButton
      variant="primary"
      block
      @click="$emit('query')"
      :loading="isLoading"
      :disabled="!queryInput.trim()"
      class="mb-4"
    >
      {{ t("queryRecord") }}
    </NeoButton>

    <view v-if="queryResult" class="result-card-neo">
      <text class="result-title font-bold block mb-2">{{ t("queryResult") }}</text>
      <view class="result-info">
        <text class="result-line">{{ t("record") }} #{{ queryResult.id }}</text>
        <text class="result-line">{{ t("rating") }}: {{ queryResult.rating }}</text>
        <text class="result-line">{{ t("totalQueries") }}: {{ queryResult.queryCount }}</text>
        <text class="result-line word-break">{{ t("hashLabel") }}: {{ queryResult.dataHash }}</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";

export interface RecordItem {
  id: number;
  dataHash: string;
  rating: number;
  queryCount: number;
  createTime: number;
  active: boolean;
  date: string;
  hashShort: string;
}

defineProps<{
  queryInput: string;
  queryResult: RecordItem | null;
  isLoading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:queryInput", "query"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.section-icon {
  font-size: 24px;
}
.result-card-neo {
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  padding: $space-6;
  box-shadow: 8px 8px 0 var(--shadow-color, black);
  margin-top: $space-4;
  position: relative;
  color: var(--text-primary, black);
  &::before {
    content: "QUERY HIT";
    position: absolute;
    top: -12px;
    right: $space-4;
    background: var(--brutal-yellow);
    border: 2px solid var(--border-color, black);
    padding: 2px 10px;
    font-size: 10px;
    font-weight: $font-weight-black;
  }
}
.result-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.result-line {
  font-size: 12px;
  font-family: $font-mono;
  font-weight: $font-weight-black;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}
.word-break {
  word-break: break-all;
}
</style>
