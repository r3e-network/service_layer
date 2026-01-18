<template>
  <NeoCard variant="erobo-neo">
    <view class="choice-container">
      <view
        :class="['choice-btn', choice === 'heads' ? 'active-heads' : 'inactive']"
        @click="$emit('update:choice', 'heads')"
      >
        <view class="choice-glow" v-if="choice === 'heads'"></view>
        <view class="choice-content">
          <AppIcon name="heads" :size="48" class="choice-icon" />
          <text class="choice-label">{{ t("heads") }}</text>
        </view>
      </view>

      <view
        :class="['choice-btn', choice === 'tails' ? 'active-tails' : 'inactive']"
        @click="$emit('update:choice', 'tails')"
      >
        <view class="choice-glow" v-if="choice === 'tails'"></view>
        <view class="choice-content">
          <AppIcon name="tails" :size="48" class="choice-icon" />
          <text class="choice-label">{{ t("tails") }}</text>
        </view>
      </view>
    </view>

    <view class="bet-form">
      <view class="wager-selector">
        <text class="wager-label">{{ t("wager") }}</text>
        <view class="wager-options">
          <view
            v-for="amount in ['1', '3', '5', '10']"
            :key="amount"
            :class="['wager-btn', betAmount === amount ? 'active' : '']"
            @click="$emit('update:betAmount', amount)"
          >
            <text class="wager-value">{{ amount }}</text>
            <text class="wager-unit">GAS</text>
          </view>
        </view>
      </view>

      <NeoButton
        variant="primary"
        size="lg"
        block
        :disabled="isFlipping || !canBet"
        :loading="isFlipping"
        @click="$emit('flip')"
        class="flip-btn"
      >
        {{ isFlipping ? t("flipping") : t("flipCoin") }}
      </NeoButton>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, NeoButton, AppIcon } from "@/shared/components";

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

.choice-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 32px;
}

.choice-btn {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-2px);
  }

  &.inactive {
    opacity: 0.7;
    &:hover {
      opacity: 1;
    }
  }

  &.active-heads {
    background: linear-gradient(135deg, rgba(0, 229, 153, 0.15) 0%, rgba(0, 229, 153, 0.05) 100%);
    border-color: #00e599;
    box-shadow: 0 10px 30px -10px rgba(0, 229, 153, 0.3);
    transform: scale(1.05);

    .choice-label {
      color: #00e599;
      text-shadow: 0 0 10px rgba(0, 229, 153, 0.5);
    }
  }

  &.active-tails {
    background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%);
    border-color: #a855f7;
    box-shadow: 0 10px 30px -10px rgba(168, 85, 247, 0.3);
    transform: scale(1.05);

    .choice-label {
      color: #d8b4fe;
      text-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
    }
  }
}

.choice-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, currentColor 0%, transparent 70%);
  opacity: 0.2;
  filter: blur(20px);
}

.choice-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.choice-icon {
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2));
}

.choice-label {
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  color: var(--text-primary);
  letter-spacing: 0.1em;
  transition: color 0.3s;
}

.bet-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.wager-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wager-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}

.wager-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.wager-btn {
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  &.active {
    background: rgba(0, 229, 153, 0.15);
    border-color: #00e599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.2);

    .wager-value {
      color: #00e599;
    }
  }
}

.wager-value {
  font-weight: 800;
  font-size: 18px;
  color: white;
  font-family: $font-mono;
}

.wager-unit {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.7;
  color: rgba(255, 255, 255, 0.8);
}

.flip-btn {
  margin-top: 8px;
}
</style>
