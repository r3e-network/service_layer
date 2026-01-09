<template>
  <NeoCard :title="t('drawYourCards')" variant="erobo" class="mystical-card">
    <view class="question-input">
      <NeoInput
        :modelValue="question"
        @update:modelValue="$emit('update:question', $event)"
        :placeholder="t('questionPlaceholder')"
      />
    </view>
    <view class="card-spread-container">
      <view class="spread-labels">
        <text class="spread-label">{{ t("past") }}</text>
        <text class="spread-label">{{ t("present") }}</text>
        <text class="spread-label">{{ t("future") }}</text>
      </view>

      <view class="cards-row">
        <TarotCard
          v-for="(card, i) in drawn"
          :key="i"
          :card="card"
          @flip="$emit('flip', i)"
        />
      </view>
    </view>

    <view class="action-buttons">
      <NeoButton v-if="!hasDrawn" variant="primary" size="lg" block :loading="isLoading" @click="$emit('draw')">
        {{ t("drawCards") }}
      </NeoButton>
      <NeoButton v-else variant="secondary" size="lg" block @click="$emit('reset')">
        {{ t("drawAgain") }}
      </NeoButton>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton } from "@/shared/components";
import TarotCard, { type Card } from "./TarotCard.vue";

defineProps<{
  question: string;
  drawn: Card[];
  hasDrawn: boolean;
  isLoading: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:question", "draw", "reset", "flip"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.mystical-card {
  padding: 24px;
}

.question-input {
  margin-bottom: 24px;
}

.spread-labels {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.spread-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.4);
  color: white;
  padding: 4px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  letter-spacing: 0.1em;
}

.cards-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}
</style>
