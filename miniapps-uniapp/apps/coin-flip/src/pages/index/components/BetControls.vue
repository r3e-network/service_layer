<template>
  <NeoCard :title="t('makeChoice')" variant="erobo-neo">
    <view class="choice-row">
      <view :class="['choice-btn', choice === 'heads' && 'active-heads']" @click="$emit('update:choice', 'heads')">
        <AppIcon name="heads" :size="32" />
        <text class="choice-label">{{ t("heads") }}</text>
      </view>
      <view :class="['choice-btn', choice === 'tails' && 'active-tails']" @click="$emit('update:choice', 'tails')">
        <AppIcon name="tails" :size="32" />
        <text class="choice-label">{{ t("tails") }}</text>
      </view>
    </view>

    <view class="bet-form">
      <NeoInput
        :modelValue="betAmount"
        @update:modelValue="$emit('update:betAmount', $event)"
        type="number"
        :label="t('wager')"
        :placeholder="t('betAmountPlaceholder')"
        suffix="GAS"
        :hint="t('minBet')"
      />

      <NeoButton
        variant="primary"
        size="lg"
        block
        :disabled="isFlipping || !canBet"
        :loading="isFlipping"
        @click="$emit('flip')"
      >
        {{ isFlipping ? t("flipping") : t("flipCoin") }}
      </NeoButton>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoInput, NeoButton, AppIcon } from "@/shared/components";

defineProps<{
  choice: "heads" | "tails";
  betAmount: string;
  isFlipping: boolean;
  canBet: boolean;
  t: (key: string) => string;
}>();

defineEmits(["update:choice", "update:betAmount", "flip"]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.choice-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.bet-form {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.choice-btn {
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.active-heads {
    background: rgba(0, 229, 153, 0.1);
    border-color: #00E599;
    box-shadow: 0 0 20px rgba(0, 229, 153, 0.2);
    transform: scale(1.02);
  }
  
  &.active-tails {
    background: rgba(168, 85, 247, 0.1);
    border-color: #a855f7;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.2);
    transform: scale(1.02);
  }
}

.choice-label {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
  letter-spacing: 0.05em;
}
</style>
