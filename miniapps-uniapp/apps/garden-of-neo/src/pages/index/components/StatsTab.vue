<template>
  <view class="tab-content">
    <NeoCard :title="t('gardenStats')">
      <NeoStats :stats="statsData" />
    </NeoCard>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NeoCard, NeoStats } from "@/shared/components";
import type { StatItem } from "@/shared/components/NeoStats.vue";

const props = defineProps<{
  t: (key: string) => string;
  totalPlants: number;
  readyToHarvest: number;
  totalHarvested: number;
}>();

const statsData = computed<StatItem[]>(() => [
  { label: props.t("plants"), value: props.totalPlants, variant: "default" },
  { label: props.t("ready"), value: props.readyToHarvest, variant: "accent" },
  { label: props.t("harvested"), value: props.totalHarvested, variant: "success" },
]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-6;
  flex: 1;
  background-color: white;
}
</style>
