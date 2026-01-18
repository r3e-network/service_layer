<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-5 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <SwapTab v-if="activeTab === 'swap'" :t="t as any" />
    <PoolTab v-if="activeTab === 'pool'" :t="t as any" />

    <!-- Docs Tab -->
    <view v-if="activeTab === 'docs'" class="tab-content scrollable">
      <NeoDoc
        :title="t('title')"
        :subtitle="t('docSubtitle')"
        :description="t('docDescription')"
        :steps="docSteps"
        :features="docFeatures"
      />
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoDoc, NeoCard, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import SwapTab from "./components/SwapTab.vue";
import PoolTab from "./components/PoolTab.vue";


const { t } = useI18n();
const { chainType, switchChain } = useWallet() as any;

const navTabs = computed<NavTab[]>(() => [
  { id: "swap", icon: "swap", label: t("tabSwap") },
  { id: "pool", icon: "droplet", label: t("tabPool") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const activeTab = ref("swap");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

$defi-bg: #0b0e11;
$defi-card-bg: #151a21;
$defi-primary: #00eb88; /* Cyber neon green */
$defi-accent: #00a3ff; /* Cyber blue */
$defi-text-main: #e2e8f0;
$defi-text-muted: #64748b;
$defi-border: #2d3748;

:global(page) {
  background: $defi-bg;
}

.tab-content {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: $defi-bg;
  min-height: 100vh;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Force override component styles for DeFi Look */
:deep(.neo-card) {
  background: $defi-card-bg !important;
  border: 1px solid $defi-border !important;
  border-radius: 8px !important; /* Sharper corners */
  box-shadow: none !important;
  color: $defi-text-main !important;
}

:deep(.neo-button.variant-primary) {
  background: $defi-primary !important;
  color: #000 !important;
  border-radius: 6px !important;
  font-weight: 600 !important;
  font-family: 'Inter', $font-family, sans-serif !important;
}

:deep(.neo-input) {
  background: #000 !important;
  border: 1px solid $defi-border !important;
  color: #fff !important;
  font-family: 'JetBrains Mono', monospace !important;
  
  &:focus-within {
    border-color: $defi-primary !important;
  }
}
</style>
