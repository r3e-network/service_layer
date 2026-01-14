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
      <NeoCard :title="t('yourPosition')" variant="erobo">
        <view class="position-info-glass">
          <view class="position-glow"></view>
          <view class="position-content">
            <text class="lp-label">NEO/GAS LP {{ t("poolShare") }}</text>
            <text class="lp-amount">0.0000</text>
            <view class="lp-tags">
              <text class="lp-tag">Active</text>
              <text class="lp-tag">0.25% Fee</text>
            </view>
          </view>
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

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

.position-info-glass {
  position: relative;
  text-align: center;
  padding: 32px 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.position-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(159, 157, 243, 0.15) 0%, transparent 70%);
  filter: blur(30px);
  z-index: 0;
}

.position-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lp-amount {
  display: block;
  font-size: 42px;
  font-weight: 900;
  margin: 12px 0;
  font-family: $font-mono;
  color: white;
  text-shadow: 0 0 25px rgba(255, 255, 255, 0.15);
  letter-spacing: -0.02em;
}

.lp-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #9f9df3;
}

.lp-tags {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.lp-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
