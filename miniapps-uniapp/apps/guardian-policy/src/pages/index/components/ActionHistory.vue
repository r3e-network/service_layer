<template>
  <NeoCard :title="'📜 ' + t('actionHistory')" class="history-card">
    <view v-for="action in actionHistory" :key="action.id" class="history-item">
      <view class="history-icon" :class="action.type">{{ getActionIcon(action.type) }}</view>
      <view class="history-content">
        <text class="history-action">{{ action.action }}</text>
        <text class="history-time">{{ action.time }}</text>
      </view>
    </view>
  </NeoCard>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

export interface ActionHistoryItem {
  id: string;
  action: string;
  time: string;
  type: "create" | "enable" | "disable" | "update";
}

defineProps<{
  actionHistory: ActionHistoryItem[];
  t: (key: string) => string;
}>();

const getActionIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    create: "➕",
    enable: "✅",
    disable: "❌",
    update: "🔄",
  };
  return iconMap[type] || "📝";
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.history-item {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  border-bottom: 2px solid var(--border-color, black);
  background: var(--bg-card, white);
  margin-bottom: $space-2;
  box-shadow: 3px 3px 0 var(--shadow-color, black);
  color: var(--text-primary, black);
}
.history-icon {
  width: 36px;
  height: 36px;
  border: 2px solid var(--border-color, black);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: var(--bg-elevated, #eee);
}
.history-action {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.history-time {
  font-size: 10px;
  opacity: 0.6;
  font-weight: $font-weight-black;
  display: block;
}
</style>
