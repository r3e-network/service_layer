<template>
  <NeoCard variant="accent" :class="['doomsday-clock-card', dangerLevel]">
    <view class="clock-header">
      <text class="clock-label">{{ t("timeUntilEvent") }}</text>
      <view :class="['danger-badge', dangerLevel]">
        <text class="danger-text">{{ dangerLevelText }}</text>
      </view>
    </view>

    <view class="clock-display">
      <text :class="['clock-time', dangerLevel, { pulse: shouldPulse }]">{{ countdown }}</text>
    </view>

    <!-- Danger Level Meter -->
    <view class="danger-meter">
      <view class="meter-labels">
        <text class="meter-label">{{ t("safe") }}</text>
        <text class="meter-label">{{ t("critical") }}</text>
      </view>
      <view class="meter-bar">
        <view :class="['meter-fill', dangerLevel]" :style="{ width: dangerProgress + '%' }"></view>
        <view class="meter-indicator" :style="{ left: dangerProgress + '%' }"></view>
      </view>
    </view>

    <!-- Event Description -->
    <view class="event-description">
      <text class="event-title">{{ t("nextEvent") }}</text>
      <text class="event-text">{{ currentEventDescription }}</text>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

defineProps<{
  dangerLevel: string;
  dangerLevelText: string;
  shouldPulse: boolean;
  countdown: string;
  dangerProgress: number;
  currentEventDescription: string;
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.doomsday-clock-card {
  position: relative;
  overflow: hidden;
  border-width: 4px !important;
  box-shadow: 12px 12px 0 black !important;
  &.critical {
    border-color: var(--brutal-red) !important;
    box-shadow: 12px 12px 0 var(--brutal-red) !important;
  }
}

.clock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-6;
}
.clock-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 2px solid var(--border-color, black);
  padding: 2px 8px;
  background: var(--bg-card, white);
  color: var(--text-primary, black);
}

.danger-badge {
  padding: 4px 12px;
  border: 3px solid var(--border-color, black);
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  &.low {
    background: var(--neo-green);
  }
  &.medium {
    background: var(--brutal-yellow);
  }
  &.high {
    background: var(--brutal-orange);
    color: white;
  }
  &.critical {
    background: var(--brutal-red);
    color: white;
    animation: pulse-red 0.5s infinite;
  }
}

@keyframes pulse-red {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.clock-display {
  text-align: center;
  margin: $space-8 0;
  background: black;
  padding: $space-6;
  border: 3px solid black;
  box-shadow: inset 8px 8px 0 rgba(255, 255, 255, 0.1);
}
.clock-time {
  font-size: 56px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
  line-height: 1;
  color: var(--brutal-green);
  &.critical {
    color: var(--brutal-red);
  }
  &.pulse {
    animation: time-pulse 0.5s infinite;
  }
}

@keyframes time-pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

.danger-meter {
  margin-top: $space-6;
}
.meter-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.meter-label {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}

.meter-bar {
  height: 20px;
  background: var(--bg-elevated, #eee);
  border: 3px solid var(--border-color, black);
  position: relative;
  overflow: hidden;
  padding: 2px;
}
.meter-fill {
  height: 100%;
  transition: width 0.3s ease;
  background: black;
  &.critical {
    background: var(--brutal-red);
  }
  &.high {
    background: var(--brutal-orange);
  }
}

.event-description {
  margin-top: $space-6;
  padding: $space-4;
  background: var(--brutal-yellow);
  border: 2px solid var(--border-color, black);
  box-shadow: 4px 4px 0 var(--shadow-color, black);
}
.event-title {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border-bottom: 2px solid var(--border-color, black);
  margin-bottom: 4px;
  display: inline-block;
}
.event-text {
  font-size: 14px;
  font-weight: $font-weight-black;
  display: block;
  text-transform: uppercase;
}
</style>
