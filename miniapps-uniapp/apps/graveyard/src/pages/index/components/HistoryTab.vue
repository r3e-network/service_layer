<template>
  <view class="tab-content scrollable">
    <view class="history-header">
      <text class="history-label">{{ t("recentDestructions") }}</text>
      <text class="history-count">{{ history.length }}</text>
    </view>

    <view v-if="history.length === 0" class="empty-state">
      <text class="empty-icon">🕊️</text>
      <text class="empty-text">{{ t("noDestructions") }}</text>
    </view>

    <view v-else class="history-list">
      <NeoCard
        v-for="(item, index) in history"
        :key="item.id"
        variant="erobo-neo"
        class="history-card"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <view class="history-item-content">
          <view class="history-icon-container">
            <text class="history-icon">{{ getDestructionIcon(index) }}</text>
          </view>
          
          <view class="history-info">
            <text class="history-hash">{{ item.hash.slice(0, 10) }}...{{ item.hash.slice(-6) }}</text>
            <text class="history-time">{{ item.time }}</text>
          </view>
          
          <view class="history-badge">
            <text class="badge-text">{{ t("destroyed") }}</text>
          </view>
        </view>
      </NeoCard>
    </view>
  </view>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";

interface HistoryItem {
  id: string;
  hash: string;
  time: string;
}

defineProps<{
  history: HistoryItem[];
  t: (key: string) => string;
}>();

const getDestructionIcon = (index: number) => {
  const icons = ["💀", "⚰️", "🪦", "☠️", "🔥"];
  return icons[index % icons.length];
};
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
  padding: 0 $space-1;
}

.history-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.1em;
}

.history-count {
  font-size: 12px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  margin-bottom: 0;
  padding: 12px;
  animation: slide-in 0.4s ease-out backwards;
}

.history-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-icon-container {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.history-icon {
  font-size: 20px;
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-hash {
  font-family: $font-mono;
  font-size: 13px;
  font-weight: 700;
  color: white;
  display: block;
  margin-bottom: 2px;
}

.history-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.history-badge {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 4px 8px;
  border-radius: 4px;
}

.badge-text {
  color: #ef4444;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 12px;
  filter: grayscale(1) opacity(0.5);
}

.empty-text {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.05em;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
