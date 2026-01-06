<template>
  <view v-if="category" class="founder-detail">
    <!-- Summary Card -->
    <NeoCard variant="success" class="mb-6 text-center">
      <view class="detail-header-neo py-4">
        <text class="detail-name text-xs font-black uppercase opacity-60 block mb-2">{{ category.name }}</text>
        <text class="detail-usd text-4xl font-black block mb-6">${{ formatNum(category.totalUsd) }}</text>
        <view class="detail-tokens flex justify-center gap-12">
          <view class="detail-token">
            <text class="token-label text-[10px] font-black uppercase opacity-60 block">NEO</text>
            <text class="token-value font-bold text-lg">{{ formatNum(category.totalNeo) }}</text>
          </view>
          <view class="detail-token">
            <text class="token-label text-[10px] font-black uppercase opacity-60 block">GAS</text>
            <text class="token-value font-bold text-lg">{{ formatNum(category.totalGas, 2) }}</text>
          </view>
        </view>
      </view>
    </NeoCard>
 
    <!-- Wallet Count -->
    <view class="wallet-header flex justify-between items-center mb-4 px-2">
      <text class="wallet-title text-xs font-black uppercase opacity-60">{{ t("walletList") }}</text>
      <text class="wallet-count font-mono text-xs">{{ category.wallets.length }} {{ t("addresses") }}</text>
    </view>
 
    <!-- Wallet List -->
    <view class="wallet-list flex flex-col gap-4">
      <NeoCard
        v-for="(wallet, idx) in category.wallets"
        :key="wallet.address"
        class="wallet-card-neo"
        @click="toggleWallet(idx)"
      >
        <view class="wallet-row-neo flex justify-between items-center">
          <view class="wallet-info-neo flex items-center gap-3">
            <text class="wallet-idx font-mono text-xs opacity-40">#{{ idx + 1 }}</text>
            <text class="wallet-addr font-mono text-sm font-bold">{{ shortAddr(wallet.address) }}</text>
          </view>
          <view class="wallet-balance-neo flex items-center gap-3">
            <text class="wallet-usd-neo font-black text-success">${{ formatNum(walletUsd(wallet)) }}</text>
            <view :class="['expand-icon-neo', { rotated: expandedIdx === idx }]">
              <AppIcon name="chevron-right" :size="16" />
            </view>
          </view>
        </view>
 
        <!-- Expanded Details -->
        <view v-if="expandedIdx === idx" class="wallet-expanded-neo mt-4 pt-4 border-t-2 border-dashed border-neo-black/10">
          <view class="full-addr-neo mb-4">
            <text class="addr-label-neo text-[10px] font-black uppercase opacity-60 block mb-1">{{ t("address") }}</text>
            <text class="addr-value-neo font-mono text-[11px] break-all leading-relaxed">{{ wallet.address }}</text>
          </view>
          <view class="token-details-neo space-y-2">
            <view class="token-row-neo flex justify-between items-center bg-neo-black/5 p-2 border border-neo-black/10">
              <text class="font-mono text-xs">NEO</text>
              <view class="text-right">
                <text class="font-bold text-sm block">{{ formatNum(wallet.neo) }}</text>
                <text class="text-[10px] opacity-60">≈ ${{ formatNum(wallet.neo * prices.neo.usd) }}</text>
              </view>
            </view>
            <view class="token-row-neo flex justify-between items-center bg-neo-black/5 p-2 border border-neo-black/10">
              <text class="font-mono text-xs">GAS</text>
              <view class="text-right">
                <text class="font-bold text-sm block">{{ formatNum(wallet.gas, 2) }}</text>
                <text class="text-[10px] opacity-60">≈ ${{ formatNum(wallet.gas * prices.gas.usd) }}</text>
              </view>
            </view>
          </view>
        </view>
      </NeoCard>
    </view>
  </view>
</template>
 
<script setup lang="ts">
import { ref } from "vue";
import { AppIcon, NeoCard } from "@/shared/components";
import { createT } from "@/shared/utils/i18n";
import type { CategoryBalance, PriceData } from "@/utils/treasury";
 
const props = defineProps<{
  category: CategoryBalance | null;
  prices: PriceData;
}>();
 
const translations = {
  walletList: { en: "Wallet Addresses", zh: "钱包地址" },
  addresses: { en: "addresses", zh: "个地址" },
  address: { en: "Address", zh: "地址" },
};
 
const t = createT(translations);
const expandedIdx = ref<number | null>(null);
 
function formatNum(n: number, decimals = 0): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: decimals });
}
 
function shortAddr(addr: string): string {
  return addr.slice(0, 10) + "..." + addr.slice(-8);
}
 
function walletUsd(wallet: { neo: number; gas: number }): number {
  return wallet.neo * props.prices.neo.usd + wallet.gas * props.prices.gas.usd;
}
 
function toggleWallet(idx: number) {
  expandedIdx.value = expandedIdx.value === idx ? null : idx;
}
</script>
 
<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";
 
.founder-detail {
  padding-bottom: $space-8;
}
 
.expand-icon-neo {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  &.rotated {
    transform: rotate(90deg);
  }
}
 
.wallet-card-neo {
  transition: transform 0.1s ease;
  &:active {
    transform: scale(0.98);
  }
}
 
.wallet-usd-neo {
  text-shadow: 1px 1px 0 var(--neo-black);
}
</style>
