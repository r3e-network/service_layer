<template>
  <NeoCard :title="t('yourCapsules')" variant="erobo">

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
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard, AppIcon, NeoButton } from "@/shared/components";

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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

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
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}
.empty-text {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  margin-top: $space-4;
  display: block;
  color: rgba(255, 255, 255, 0.4);
}

.capsule-container {
  display: flex;
  gap: $space-4;
  padding: $space-4;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  margin-bottom: $space-5;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: white;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  &.locked {
    border-color: rgba(255, 255, 255, 0.1);
  }
  &.unlocked {
    border-color: #00E599;
    background: rgba(0, 229, 153, 0.05);
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.15);
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
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
  }
}

.lock-indicator {
  color: white;
  z-index: 1;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

.capsule-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.capsule-name {
  font-size: 16px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
  color: white;
}

.countdown-display {
  display: flex;
  align-items: center;
  gap: $space-2;
  margin: 6px 0;
}
.countdown-unit {
  background: rgba(255, 255, 255, 0.05);
  color: white;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  min-width: 40px;
  text-align: center;
}
.countdown-value {
  font-size: 16px;
  font-weight: 700;
  font-family: $font-mono;
}
.countdown-unit-label {
  font-size: 8px;
  display: block;
  opacity: 0.6;
}
.countdown-separator {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
}

.unlock-date {
  font-size: 10px;
  font-weight: 600;
  opacity: 0.5;
  font-family: $font-mono;
  color: white;
}

.unlocked-label {
  font-size: 14px;
  font-weight: 700;
  color: #00E599;
  text-transform: uppercase;
  margin-bottom: 8px;
  text-shadow: 0 0 10px rgba(0, 229, 153, 0.3);
}
</style>
