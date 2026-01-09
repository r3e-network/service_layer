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
        :variant="record.active ? 'success' : 'default'"
        class="mb-4"
        @click="$emit('view', record)"
      >
        <template #header-extra>
          <text v-if="record.active" class="status-icon">✅</text>
          <text v-else class="status-icon">🚫</text>
        </template>

        <view class="file-body">
          <text class="file-title font-bold block mb-2">{{ t("record") }} #{{ record.id }}</text>
          <view class="file-meta flex justify-between mb-2">
            <text class="file-date text-xs">{{ record.date }}</text>
            <text class="file-type text-xs">{{ record.active ? t("statusActive") : t("statusInactive") }}</text>
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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.section-header-neo {
  display: flex; align-items: center; gap: $space-3; padding: $space-3 $space-4; background: black;
  color: white; border: 3px solid black; box-shadow: 4px 4px 0 var(--brutal-yellow);
}
.section-icon { font-size: 24px; }
.section-title { font-size: 14px; font-weight: $font-weight-black; text-transform: uppercase; letter-spacing: 1px; }

.file-body { padding: $space-2 0; }
.file-title {
  font-size: 18px; font-weight: $font-weight-black; text-transform: uppercase; color: black;
  border-bottom: 3px solid var(--brutal-yellow); display: inline-block; margin-bottom: 8px;
}
.file-date { font-size: 10px; font-weight: $font-weight-black; opacity: 0.6; font-family: $font-mono; }
.file-type {
  font-size: 10px; font-weight: $font-weight-black; text-transform: uppercase; background: var(--neo-green);
  color: black; padding: 2px 8px; border: 1px solid black;
}
.file-footer-neo {
  display: flex; justify-content: space-between; align-items: center; padding-top: $space-3;
  border-top: 2px solid black; margin-top: $space-3;
}
.view-label { font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase; color: black; }
</style>
