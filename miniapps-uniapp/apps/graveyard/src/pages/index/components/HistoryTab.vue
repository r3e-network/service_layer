<template>
  <view class="tab-content scrollable">
    <view class="history-header">
      <text class="history-title">🪦 {{ t("recentDestructions") }}</text>
      <text class="history-count">{{ history.length }} {{ t("records") }}</text>
    </view>

    <view v-if="history.length === 0" class="empty-state">
      <text class="empty-icon">🕊️</text>
      <text class="empty-text">{{ t("noDestructions") }}</text>
    </view>

    <view v-else class="history-list">
      <view
        v-for="(item, index) in history"
        :key="item.id"
        class="history-item"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <view class="history-icon">
          <text>{{ getDestructionIcon(index) }}</text>
        </view>
        <view class="history-info">
          <text class="history-hash">{{ item.hash.slice(0, 16) }}...</text>
          <text class="history-time">{{ item.time }}</text>
        </view>
        <view class="history-badge">
          <text class="badge-text">{{ t("destroyed") }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-6;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-8;
  border-bottom: 6px solid black;
  padding-bottom: $space-3;
}
.history-title {
  font-size: 24px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  font-style: italic;
}
.history-count {
  font-size: 14px;
  font-weight: $font-weight-black;
  background: black;
  color: var(--neo-green);
  padding: 4px 12px;
  border: 2px solid black;
  transform: rotate(3deg);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: $space-6;
}

.history-item {
  display: flex;
  align-items: center;
  gap: $space-5;
  padding: $space-6;
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  box-shadow: 8px 8px 0 var(--shadow-color, black);
  transition: transform 0.2s;
  color: var(--text-primary, black);
  &:hover {
    transform: translate(-3px, -3px);
    box-shadow: 11px 11px 0 var(--shadow-color, black);
  }
}

.history-icon {
  font-size: 40px;
  width: 60px;
  text-align: center;
  border-right: 4px solid black;
  margin-right: $space-3;
}
.history-hash {
  font-family: $font-mono;
  font-size: 14px;
  font-weight: $font-weight-black;
  display: block;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.history-time {
  font-size: 11px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  color: #666;
}
.history-badge {
  background: black;
  color: white;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: $font-weight-black;
  border: 2px solid black;
  transform: skew(-10deg);
}

.empty-state {
  text-align: center;
  padding: $space-8;
}
.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: $space-4;
}
.empty-text {
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
</style>
