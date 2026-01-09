<template>
  <view class="tab-content scrollable">
    <NeoCard :title="t('networkInfo')" variant="erobo">
      <NeoStats :stats="infoStats" />
    </NeoCard>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { formatAddress } from "@/shared/utils/format";
import { NeoCard, NeoStats, type StatItem } from "@/shared/components";

const props = defineProps<{
  address: string | null;
  contractHash: string | null;
  epochEndTime: number;
  currentStrategy: string;
  t: (key: string) => string;
}>();

const toMillis = (value: number) => (value > 1_000_000_000_000 ? value : value * 1000);

const formatEpochEnd = (value: number) => {
  if (!value) return "--";
  const date = new Date(toMillis(value));
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const strategyLabel = computed(() => {
  if (props.currentStrategy === "self") return props.t("strategySelf");
  if (props.currentStrategy === "neoburger") return props.t("strategyNeoBurger");
  return props.currentStrategy || "--";
});

const infoStats = computed<StatItem[]>(() => [
  { label: props.t("wallet"), value: props.address ? formatAddress(props.address) : "--" },
  { label: props.t("contract"), value: props.contractHash ? formatAddress(props.contractHash) : "--" },
  { label: props.t("epochEndsAt"), value: formatEpochEnd(props.epochEndTime) },
  { label: props.t("currentStrategy"), value: strategyLabel.value },
]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
