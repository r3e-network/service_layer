<template>
  <view class="contracts-list">
    <text class="section-title">{{ t("activeContracts") }}</text>

    <ContractCard
      v-for="contract in contracts"
      :key="contract.id"
      :contract="contract"
      :address="address"
      :t="t as any"
      @sign="$emit('sign', $event)"
      @break="$emit('break', $event)"
    />
  </view>
</template>

<script setup lang="ts">
import ContractCard from "./ContractCard.vue";

interface RelationshipContractView {
  id: number;
  party1: string;
  party2: string;
  partner: string;
  stake: number;
  stakeRaw: string;
  progress: number;
  daysLeft: number;
  status: "pending" | "active" | "broken" | "ended";
}

defineProps<{
  contracts: RelationshipContractView[];
  address: string | null;
  t: (key: string) => string;
}>();

defineEmits(["sign", "break"]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.contracts-list { display: flex; flex-direction: column; gap: $space-4; }
.section-title {
  font-size: 16px; font-weight: $font-weight-black; text-transform: uppercase;
  border-bottom: 2px solid black; padding-bottom: $space-1;
}
</style>
