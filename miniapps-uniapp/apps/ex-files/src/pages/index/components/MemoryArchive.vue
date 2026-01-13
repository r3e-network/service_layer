<template>
  <view class="archive-section">
    <view class="section-header-neo mb-4">
      <text class="section-icon">📁</text>
      <text class="section-title font-bold">{{ t("memoryArchive") }}</text>
    </view>

    <view class="timeline">
      <NeoCard
        v-for="record in sortedRecords"
        :key="record.id"
        :variant="record.active ? 'erobo-neo' : 'erobo'"
        class="mb-4"
        @click="$emit('view', record)"
      >
        <template #header-extra>
          <view class="status-badge" :class="record.active ? 'active' : 'inactive'">
            <text class="status-text">{{ record.active ? t("statusActive") : t("statusInactive") }}</text>
          </view>
        </template>

        <view class="file-body">
          <text class="file-title font-bold block mb-2">{{ t("record") }} #{{ record.id }}</text>
          <view class="file-meta flex justify-between mb-2">
            <text class="file-date text-xs">{{ record.date }}</text>
          </view>
          <text class="file-desc text-sm opacity-80">{{ record.hashShort }}</text>
        </view>

        <template #footer>
          <view class="file-footer-neo flex justify-between items-center w-full">
            <text class="file-id text-xs opacity-60">ID: {{ record.id }}</text>
            <text class="view-label font-bold">{{ t("tapToView") }} →</text>
          </view>
        </template>
      </NeoCard>
    </view>
  </view>
</template>

<script setup lang="ts">
import { NeoCard } from "@/shared/components";
import type { RecordItem } from "./QueryRecordForm.vue";

defineProps<{
  sortedRecords: RecordItem[];
  t: (key: string) => string;
}>();

defineEmits(["view"]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.section-header-neo {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-2 0;
  margin-bottom: $space-4;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.section-icon { font-size: 20px; text-shadow: 0 0 10px rgba(255, 255, 255, 0.3); }
.section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: white; }

.file-body { padding: $space-2 0; }
.file-title {
  font-size: 16px; font-weight: 700; text-transform: uppercase; color: white;
  margin-bottom: 8px; letter-spacing: 0.05em;
}
.file-date { font-size: 10px; font-weight: 600; opacity: 0.6; font-family: $font-mono; color: white; }

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 700;
  &.active { background: rgba(0, 229, 153, 0.1); color: #00E599; border: 1px solid rgba(0, 229, 153, 0.2); }
  &.inactive { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); }
}

.file-footer-neo {
  display: flex; justify-content: space-between; align-items: center; padding-top: $space-3;
  border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: $space-3;
}
.view-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #9f9df3; }
.file-id { color: rgba(255, 255, 255, 0.4); font-family: $font-mono; }
</style>
