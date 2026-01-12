<template>
  <view class="tab-content">
    <view class="pool-section">
      <view class="pool-header">
        <text class="pool-title">{{ t("liquidityPool") }}</text>
        <text class="pool-subtitle">{{ t("poolSubtitle") }}</text>
      </view>

      <!-- Pool Stats -->
      <view class="pool-stats">
        <NeoStats :stats="poolStats" />
      </view>

      <!-- Add Liquidity Form -->
      <AddLiquidityForm
        v-model:amountA="amountA"
        v-model:amountB="amountB"
        :loading="loading"
        :t="t as any"
        @calculateA="calculateA"
        @calculateB="calculateB"
        @addLiquidity="addLiquidity"
      />

      <!-- Your Position -->
      <NeoCard :title="t('yourPosition')">
        <view class="position-info">
          <text class="lp-amount">0.0000</text>
          <text class="lp-label">NEO/GAS LP {{ t("poolShare") }}</text>
        </view>
      </NeoCard>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NeoCard, NeoStats } from "@/shared/components";
import type { StatItem } from "@/shared/components/NeoStats.vue";
import AddLiquidityForm from "./AddLiquidityForm.vue";

const props = defineProps<{
  t: (key: string) => string;
}>();

const amountA = ref("");
const amountB = ref("");
const loading = ref(false);
const rate = 8.5;

const poolStats = computed<StatItem[]>(() => [
  { label: "TVL", value: "$12.5M" },
  { label: "APR", value: "24.5%", variant: "success" },
  { label: "24h Vol", value: "$1.2M" },
]);

function calculateB() {
  const val = parseFloat(amountA.value);
  if (!Number.isNaN(val)) {
    amountB.value = (val * rate).toFixed(4);
  } else {
    amountB.value = "";
  }
}

function calculateA() {
  const val = parseFloat(amountB.value);
  if (!Number.isNaN(val)) {
    amountA.value = (val / rate).toFixed(4);
  } else {
    amountA.value = "";
  }
}

function addLiquidity() {
  if (!amountA.value || !amountB.value) return;
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    amountA.value = "";
    amountB.value = "";
    // In a real app, this would show a toast if we had a toast component exposed
  }, 1500);
}
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 24px;
  flex: 1;
}

.pool-section {
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pool-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 20px rgba(0, 229, 153, 0.2);
}

.pool-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  margin-bottom: 24px;
  display: block;
}

.pool-stats {
  background: transparent;
  margin-bottom: 16px;
}

.position-info {
  text-align: center;
  padding: 24px;
  background: var(--bg-card, rgba(255, 255, 255, 0.03));
  border-radius: 12px;
}

.lp-amount {
  display: block;
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 8px;
  font-family: $font-mono;
  color: white;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
}

.lp-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: white;
}
</style>
