<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>
    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>
    <view class="card">
      <text class="card-title">{{ t("selectNFTs") }}</text>
      <view class="fusion-slots">
        <view class="slot" @click="selectSlot(0)">
          <text v-if="slots[0]" class="slot-icon">{{ slots[0].icon }}</text>
          <text v-else class="slot-empty">+</text>
        </view>
        <text class="fusion-symbol">⚡</text>
        <view class="slot" @click="selectSlot(1)">
          <text v-if="slots[1]" class="slot-icon">{{ slots[1].icon }}</text>
          <text v-else class="slot-empty">+</text>
        </view>
      </view>
      <view v-if="slots[0] && slots[1]" class="fusion-result">
        <text class="result-label">{{ t("resultPreview") }}</text>
        <text class="result-icon">{{ getFusionResult() }}</text>
        <text class="result-name">{{ getFusionName() }}</text>
      </view>
      <view class="fuse-btn" @click="fuse" :style="{ opacity: canFuse ? 1 : 0.5 }">
        <text>{{ isLoading ? t("fusing") : t("fuseNFTs") }}</text>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("yourNFTs") }}</text>
      <view class="nft-grid">
        <view v-for="nft in nfts" :key="nft.id" class="nft-card" @click="addToSlot(nft)">
          <text class="nft-icon">{{ nft.icon }}</text>
          <text class="nft-name">{{ nft.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "NFT Chimera", zh: "NFT 嵌合体" },
  subtitle: { en: "Fuse NFTs to create new ones", zh: "融合 NFT 创造新物种" },
  selectNFTs: { en: "Select NFTs to Fuse", zh: "选择要融合的 NFT" },
  resultPreview: { en: "Result Preview", zh: "结果预览" },
  fuseNFTs: { en: "Fuse NFTs (10 GAS)", zh: "融合 NFT (10 GAS)" },
  fusing: { en: "Fusing...", zh: "融合中..." },
  yourNFTs: { en: "Your NFTs", zh: "您的 NFT" },
  chimeraCreated: { en: "Created", zh: "已创建" },
  fusingNFTs: { en: "Fusing NFTs...", zh: "正在融合 NFT..." },
  chimeraName: { en: "Chimera Beast", zh: "嵌合兽" },
};

const t = createT(translations);

const APP_ID = "miniapp-nftchimera";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

interface NFT {
  id: string;
  name: string;
  icon: string;
}

const nfts = ref<NFT[]>([
  { id: "1", name: "Fire Dragon", icon: "🐉" },
  { id: "2", name: "Ice Phoenix", icon: "🦅" },
  { id: "3", name: "Earth Golem", icon: "🗿" },
  { id: "4", name: "Wind Spirit", icon: "🌪️" },
]);
const slots = ref<(NFT | null)[]>([null, null]);
const currentSlot = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);

const canFuse = computed(() => slots.value[0] && slots.value[1] && !isLoading.value);

const selectSlot = (index: number) => {
  currentSlot.value = index;
};

const addToSlot = (nft: NFT) => {
  if (slots.value.includes(nft)) return;
  slots.value[currentSlot.value] = nft;
  currentSlot.value = currentSlot.value === 0 ? 1 : 0;
};

const getFusionResult = () => {
  const icons = [slots.value[0]?.icon, slots.value[1]?.icon];
  return icons.includes("🐉") && icons.includes("🦅") ? "🦖" : "✨";
};

const getFusionName = () => {
  return t("chimeraName");
};

const fuse = async () => {
  if (!canFuse.value) return;
  try {
    status.value = { msg: t("fusingNFTs"), type: "loading" };
    await payGAS("10", `fuse:${slots.value[0]!.id}:${slots.value[1]!.id}`);
    const result = { id: Date.now().toString(), name: getFusionName(), icon: getFusionResult() };
    nfts.value = nfts.value.filter((n) => n.id !== slots.value[0]!.id && n.id !== slots.value[1]!.id);
    nfts.value.push(result);
    status.value = { msg: `${t("chimeraCreated")} ${result.name}!`, type: "success" };
    slots.value = [null, null];
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
  }
};
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: #fff;
  padding: 20px;
}
.header {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: 1.8em;
  font-weight: bold;
  color: $color-nft;
}
.subtitle {
  color: $color-text-secondary;
  font-size: 0.9em;
  margin-top: 8px;
}
.status-msg {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  &.success {
    background: rgba($color-success, 0.15);
    color: $color-success;
  }
  &.error {
    background: rgba($color-error, 0.15);
    color: $color-error;
  }
}
.card {
  background: $color-bg-card;
  border: 1px solid $color-border;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.card-title {
  color: $color-nft;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 16px;
}
.fusion-slots {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}
.slot {
  width: 80px;
  height: 80px;
  background: rgba($color-nft, 0.1);
  border: 2px dashed $color-nft;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.slot-icon {
  font-size: 3em;
}
.slot-empty {
  font-size: 2em;
  color: $color-nft;
}
.fusion-symbol {
  font-size: 1.5em;
  color: $color-nft;
}
.fusion-result {
  text-align: center;
  padding: 16px;
  background: rgba($color-nft, 0.1);
  border-radius: 12px;
  margin-bottom: 16px;
}
.result-label {
  display: block;
  color: $color-text-secondary;
  font-size: 0.85em;
  margin-bottom: 8px;
}
.result-icon {
  display: block;
  font-size: 3em;
  margin-bottom: 8px;
}
.result-name {
  display: block;
  color: $color-nft;
  font-weight: bold;
}
.fuse-btn {
  background: linear-gradient(135deg, $color-nft 0%, darken($color-nft, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}
.nft-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.nft-card {
  background: rgba($color-nft, 0.1);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}
.nft-icon {
  display: block;
  font-size: 2em;
  margin-bottom: 8px;
}
.nft-name {
  display: block;
  font-size: 0.8em;
  color: $color-text-secondary;
}
</style>
