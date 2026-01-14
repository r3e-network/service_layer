<template>
  <NeoCard variant="erobo-neo">

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
      <text class="helper-text neutral">{{ t("contentStorageNote") }}</text>
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

    <view class="form-section">
      <text class="form-label">{{ t("visibility") }}</text>
      <view class="visibility-actions">
        <NeoButton
          size="sm"
          :variant="isPublic ? 'secondary' : 'primary'"
          @click="$emit('update:isPublic', false)"
        >
          {{ t("private") }}
        </NeoButton>
        <NeoButton size="sm" :variant="isPublic ? 'primary' : 'secondary'" @click="$emit('update:isPublic', true)">
          {{ t("public") }}
        </NeoButton>
      </view>
      <text class="helper-text">{{ isPublic ? t("publicHint") : t("privateHint") }}</text>
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
  content: string;
  days: string;
  isPublic: boolean;
  isLoading: boolean;
  canCreate: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:content", "update:days", "update:isPublic", "create"]);
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

.helper-text.neutral {
  color: rgba(255, 255, 255, 0.6);
  margin-top: $space-2;
}

.visibility-actions {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-2;
}
</style>
