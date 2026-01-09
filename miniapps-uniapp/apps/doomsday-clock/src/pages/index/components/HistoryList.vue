<template>
  <NeoCard :title="t('eventHistory')">
    <view v-if="history.length === 0" class="empty-state">
      <text>{{ t("noHistory") }}</text>
    </view>
    <view class="history-list">
      <view v-for="event in history" :key="event.id" class="history-item">
        <view class="history-header">
          <text class="history-title">{{ event.title }}</text>
          <text class="history-date">{{ event.date }}</text>
        </view>
        <text class="history-desc">{{ event.details }}</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

export interface HistoryEvent {
  id: number;
  title: string;
  details: string;
  date: string;
}

defineProps<{
  history: HistoryEvent[];
  t: (key: string) => string;
}>();
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.empty-state {
  text-align: center;
  padding: $space-6;
  opacity: 0.6;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}
.history-item {
  padding: $space-4;
  background: var(--bg-card, white);
  border: 3px solid var(--border-color, black);
  box-shadow: 6px 6px 0 var(--shadow-color, black);
  margin-bottom: $space-2;
  color: var(--text-primary, black);
}
.history-title {
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-size: 14px;
  border-bottom: 2px solid var(--border-color, black);
  margin-bottom: 4px;
  display: inline-block;
}
.history-date {
  font-size: 10px;
  opacity: 0.6;
  font-weight: $font-weight-black;
  display: block;
  margin-bottom: 8px;
}
.history-desc {
  font-size: 12px;
  font-family: $font-mono;
  background: var(--bg-elevated, #f0f0f0);
  padding: 4px 8px;
  border: 1px solid var(--border-color, black);
  color: var(--text-primary, black);
}
</style>
