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
      <text class="card-title">{{ t("yourParasites") }}</text>
      <view v-for="parasite in parasites" :key="parasite.id" class="parasite-item">
        <text class="parasite-icon">{{ parasite.icon }}</text>
        <view class="parasite-info">
          <text class="parasite-name">{{ parasite.name }}</text>
          <text class="parasite-level">{{ t("level") }} {{ parasite.level }}</text>
          <view class="energy-bar">
            <view class="energy-fill" :style="{ width: parasite.energy + '%' }"></view>
          </view>
        </view>
        <view class="parasite-stats">
          <text class="stat-text">{{ parasite.victims }} {{ t("victims") }}</text>
        </view>
      </view>
      <view class="mint-btn" @click="mintParasite" :style="{ opacity: isLoading ? 0.6 : 1 }">
        <text>{{ isLoading ? t("minting") : t("mintParasite") }}</text>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("availableHosts") }}</text>
      <view class="hosts-list">
        <view v-for="host in hosts" :key="host.id" class="host-item" @click="attachTo(host)">
          <text class="host-icon">{{ host.icon }}</text>
          <view class="host-info">
            <text class="host-name">{{ host.name }}</text>
            <text class="host-owner">{{ t("owner") }}: {{ host.owner }}</text>
          </view>
          <text class="host-value">{{ host.value }} GAS</text>
        </view>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("howItWorks") }}</text>
      <view class="info-section">
        <text class="info-text">{{ t("step1") }}</text>
        <text class="info-text">{{ t("step2") }}</text>
        <text class="info-text">{{ t("step3") }}</text>
        <text class="info-text">{{ t("step4") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Parasite NFT", zh: "寄生 NFT" },
  subtitle: { en: "NFTs that feed on others", zh: "以其他 NFT 为食的 NFT" },
  yourParasites: { en: "Your Parasites", zh: "您的寄生体" },
  level: { en: "Level", zh: "等级" },
  victims: { en: "victims", zh: "宿主" },
  mintParasite: { en: "Mint Parasite (8 GAS)", zh: "铸造寄生体 (8 GAS)" },
  minting: { en: "Minting...", zh: "铸造中..." },
  availableHosts: { en: "Available Hosts", zh: "可用宿主" },
  owner: { en: "Owner", zh: "所有者" },
  howItWorks: { en: "How It Works", zh: "工作原理" },
  step1: { en: "1. Mint a Parasite NFT", zh: "1. 铸造寄生体 NFT" },
  step2: { en: "2. Attach it to other NFTs as a host", zh: "2. 将其附着到其他 NFT 作为宿主" },
  step3: { en: "3. Drain energy over time to level up", zh: "3. 随时间吸取能量以升级" },
  step4: { en: "4. Higher levels = more drain power", zh: "4. 等级越高 = 吸取能力越强" },
  mintingParasite: { en: "Minting parasite...", zh: "正在铸造寄生体..." },
  parasiteMinted: { en: "Parasite minted!", zh: "寄生体已铸造！" },
  attachingParasite: { en: "Attaching parasite...", zh: "正在附着寄生体..." },
  attachedTo: { en: "Attached to", zh: "已附着到" },
  needParasiteFirst: { en: "You need a parasite first", zh: "您需要先拥有寄生体" },
};

const t = createT(translations);

const APP_ID = "miniapp-parasite";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

interface Parasite {
  id: string;
  name: string;
  icon: string;
  level: number;
  energy: number;
  victims: number;
}

interface Host {
  id: string;
  name: string;
  icon: string;
  owner: string;
  value: string;
}

const parasites = ref<Parasite[]>([
  { id: "1", name: "Shadow Leech", icon: "🦠", level: 3, energy: 65, victims: 8 },
  { id: "2", name: "Void Tick", icon: "🕷️", level: 2, energy: 40, victims: 4 },
]);

const hosts = ref<Host[]>([
  { id: "1", name: "Golden Dragon", icon: "🐉", owner: "Alice", value: "50" },
  { id: "2", name: "Crystal Phoenix", icon: "🦅", owner: "Bob", value: "35" },
  { id: "3", name: "Mystic Wolf", icon: "🐺", owner: "Carol", value: "28" },
  { id: "4", name: "Ancient Tree", icon: "🌳", owner: "Dave", value: "42" },
]);

const status = ref<{ msg: string; type: string } | null>(null);

const mintParasite = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("mintingParasite"), type: "loading" };
    await payGAS("8", `mint:${Date.now()}`);
    const names = ["Shadow Leech", "Void Tick", "Dark Mite", "Chaos Worm"];
    const icons = ["🦠", "🕷️", "🐛", "🪱"];
    const idx = Math.floor(Math.random() * names.length);
    parasites.value.push({
      id: Date.now().toString(),
      name: names[idx],
      icon: icons[idx],
      level: 1,
      energy: 100,
      victims: 0,
    });
    status.value = { msg: t("parasiteMinted"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
  }
};

const attachTo = async (host: Host) => {
  if (parasites.value.length === 0) {
    status.value = { msg: t("needParasiteFirst"), type: "error" };
    return;
  }
  if (isLoading.value) return;
  try {
    status.value = { msg: t("attachingParasite"), type: "loading" };
    await payGAS("3", `attach:${host.id}`);
    const parasite = parasites.value[0];
    parasite.victims++;
    parasite.energy = Math.min(100, parasite.energy + 20);
    if (parasite.victims % 5 === 0) {
      parasite.level++;
    }
    status.value = { msg: `${t("attachedTo")} ${host.name}!`, type: "success" };
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
.parasite-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba($color-nft, 0.1);
  border-radius: 10px;
  margin-bottom: 10px;
}
.parasite-icon {
  font-size: 2em;
  margin-right: 12px;
}
.parasite-info {
  flex: 1;
}
.parasite-name {
  display: block;
  font-weight: bold;
}
.parasite-level {
  color: $color-nft;
  font-size: 0.85em;
  display: block;
  margin-bottom: 4px;
}
.energy-bar {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 4px;
}
.energy-fill {
  height: 100%;
  background: $color-nft;
}
.parasite-stats {
  text-align: right;
}
.stat-text {
  color: $color-text-secondary;
  font-size: 0.85em;
}
.mint-btn {
  background: linear-gradient(135deg, $color-nft 0%, darken($color-nft, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
  margin-top: 12px;
}
.hosts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.host-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba($color-nft, 0.1);
  border-radius: 10px;
}
.host-icon {
  font-size: 1.8em;
  margin-right: 12px;
}
.host-info {
  flex: 1;
}
.host-name {
  display: block;
  font-weight: bold;
}
.host-owner {
  color: $color-text-secondary;
  font-size: 0.85em;
}
.host-value {
  color: $color-nft;
  font-weight: bold;
}
.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.info-text {
  color: $color-text-secondary;
  font-size: 0.9em;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}
</style>
