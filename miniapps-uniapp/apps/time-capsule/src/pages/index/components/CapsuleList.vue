<template>
  <view class="card">
    <text class="card-title">{{ t("yourCapsules") }}</text>

    <view v-if="capsules.length === 0" class="empty-state">
      <view class="empty-icon"><AppIcon name="archive" :size="64" class="text-secondary" /></view>
      <text class="empty-text">{{ t("noCapsules") }}</text>
    </view>

    <view v-for="cap in capsules" :key="cap.id" :class="['capsule-container', cap.locked ? 'locked' : 'unlocked']">
      <!-- Capsule Visual -->
      <view class="capsule-visual">
        <view class="capsule-body">
          <view class="capsule-top"></view>
          <view class="capsule-middle">
            <view class="lock-indicator">
              <AppIcon v-if="cap.locked" name="lock" :size="20" />
              <AppIcon v-else name="unlock" :size="20" />
            </view>
          </view>
          <view class="capsule-bottom"></view>
        </view>
      </view>

      <!-- Capsule Info -->
      <view class="capsule-details">
        <text class="capsule-name">{{ cap.name }}</text>

        <!-- Countdown Timer for Locked Capsules -->
        <view v-if="cap.locked" class="countdown-section">
          <text class="countdown-label">{{ t("timeRemaining") }}</text>
          <view class="countdown-display">
            <view class="countdown-unit">
              <text class="countdown-value">{{ getCountdown(cap.unlockDate).days }}</text>
              <text class="countdown-unit-label">{{ t("daysShort") }}</text>
            </view>
            <text class="countdown-separator">:</text>
            <view class="countdown-unit">
              <text class="countdown-value">{{ getCountdown(cap.unlockDate).hours }}</text>
              <text class="countdown-unit-label">{{ t("hoursShort") }}</text>
            </view>
            <text class="countdown-separator">:</text>
            <view class="countdown-unit">
              <text class="countdown-value">{{ getCountdown(cap.unlockDate).minutes }}</text>
              <text class="countdown-unit-label">{{ t("minShort") }}</text>
            </view>
          </view>
          <text class="unlock-date">{{ t("unlocks") }} {{ cap.unlockDate }}</text>
        </view>

        <!-- Unlocked Status -->
        <view v-else class="unlocked-section">
          <text class="unlocked-label">{{ t("unlocked") }}</text>
          <NeoButton variant="success" size="md" @click="$emit('open', cap)">
            {{ t("open") }}
          </NeoButton>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { AppIcon, NeoButton } from "@/shared/components";

export interface Capsule {
  id: string;
  name: string;
  content: string;
  unlockDate: string;
  locked: boolean;
}

const props = defineProps<{
  capsules: Capsule[];
  currentTime: number;
  t: (key: string) => string;
}>();

defineEmits(["open"]);

const getCountdown = (unlockDate: string) => {
  const now = props.currentTime;
  const target = new Date(unlockDate).getTime();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
  };
};
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

.empty-state {
  text-align: center;
  padding: $space-8;
}
.empty-text {
  font-size: 14px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-top: $space-4;
  display: block;
}

.capsule-container {
  display: flex;
  gap: $space-4;
  padding: $space-4;
  background: var(--bg-elevated, #f8f8f8);
  border: 3px solid var(--border-color, black);
  box-shadow: 6px 6px 0 var(--shadow-color, black);
  margin-bottom: $space-5;
  transition: all $transition-fast;
  color: var(--text-primary, black);
  &:active {
    transform: translate(2px, 2px);
    box-shadow: 4px 4px 0 var(--shadow-color, black);
  }

  &.locked {
    border-color: var(--border-color, black);
    background: var(--bg-card, white);
  }
  &.unlocked {
    border-color: var(--border-color, black);
    background: var(--brutal-green-light, #e8f5e9);
    border-width: 4px;
    box-shadow: 8px 8px 0 var(--shadow-color, black);
  }
}

.capsule-visual {
  flex-shrink: 0;
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capsule-body {
  width: 40px;
  height: 80px;
  border: 3px solid var(--border-color, black);
  background: var(--bg-card, white);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.1);
}

.lock-indicator {
  color: var(--text-primary, black);
}

.capsule-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.capsule-name {
  font-size: 18px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.countdown-display {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 4px 0;
}
.countdown-unit {
  background: black;
  color: white;
  padding: 4px 8px;
  border: 2px solid black;
  min-width: 40px;
  text-align: center;
}
.countdown-value {
  font-size: 18px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
}
.countdown-unit-label {
  font-size: 8px;
  display: block;
  opacity: 0.8;
}
.countdown-separator {
  font-weight: $font-weight-black;
}

.unlock-date {
  font-size: 10px;
  font-weight: $font-weight-black;
  opacity: 0.6;
  font-family: $font-mono;
}

.unlocked-label {
  font-size: 14px;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  text-transform: uppercase;
  margin-bottom: 8px;
}
</style>
