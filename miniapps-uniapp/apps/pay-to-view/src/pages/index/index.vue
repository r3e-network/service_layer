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
      <text class="card-title">{{ t("premiumContent") }}</text>
      <view class="content-list">
        <view v-for="item in contents" :key="item.id" class="content-item" @click="viewContent(item)">
          <text class="content-icon">{{ item.icon }}</text>
          <view class="content-info">
            <text class="content-title">{{ item.title }}</text>
            <text class="content-creator">{{ t("by") }} {{ item.creator }}</text>
            <text class="content-views">{{ item.views }} {{ t("views") }}</text>
          </view>
          <view class="content-price">
            <text v-if="item.unlocked" class="unlocked-badge">{{ t("unlocked") }}</text>
            <text v-else class="price-text">{{ item.price }} GAS</text>
          </view>
        </view>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("createContent") }}</text>
      <view class="create-form">
        <input class="input-field" :placeholder="t('contentTitle')" v-model="newContent.title" />
        <input class="input-field" :placeholder="t('priceInGAS')" v-model="newContent.price" type="number" />
        <textarea class="textarea-field" :placeholder="t('contentDescription')" v-model="newContent.description" />
        <view class="btn-primary" @click="createContent" :style="{ opacity: isLoading ? 0.6 : 1 }">
          <text>{{ isLoading ? t("creating") : t("create") }}</text>
        </view>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("yourStats") }}</text>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ unlockedCount }}</text>
          <text class="stat-label">{{ t("unlockedCount") }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ createdCount }}</text>
          <text class="stat-label">{{ t("createdCount") }}</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ earnings }}</text>
          <text class="stat-label">{{ t("earned") }}</text>
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
  title: { en: "Pay to View", zh: "付费查看" },
  subtitle: { en: "Gated content NFTs", zh: "门控内容 NFT" },
  premiumContent: { en: "Premium Content", zh: "优质内容" },
  by: { en: "by", zh: "作者" },
  views: { en: "views", zh: "浏览" },
  unlocked: { en: "Unlocked", zh: "已解锁" },
  createContent: { en: "Create Content", zh: "创建内容" },
  contentTitle: { en: "Content title", zh: "内容标题" },
  priceInGAS: { en: "Price in GAS", zh: "GAS 价格" },
  contentDescription: { en: "Content description", zh: "内容描述" },
  create: { en: "Create (5 GAS fee)", zh: "创建 (5 GAS 费用)" },
  creating: { en: "Creating...", zh: "创建中..." },
  yourStats: { en: "Your Stats", zh: "您的统计" },
  unlockedCount: { en: "Unlocked", zh: "已解锁" },
  createdCount: { en: "Created", zh: "已创建" },
  earned: { en: "Earned", zh: "已赚取" },
  viewingContent: { en: "Viewing content...", zh: "查看内容中..." },
  unlockingContent: { en: "Unlocking content...", zh: "解锁内容中..." },
  contentUnlocked: { en: "Content unlocked!", zh: "内容已解锁！" },
  creatingContent: { en: "Creating content...", zh: "创建内容中..." },
  contentCreated: { en: "Content created!", zh: "内容已创建！" },
  fillAllFields: { en: "Please fill all fields", zh: "请填写所有字段" },
};

const t = createT(translations);

const APP_ID = "miniapp-paytoview";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

interface Content {
  id: string;
  title: string;
  creator: string;
  price: string;
  views: number;
  icon: string;
  unlocked: boolean;
}

const contents = ref<Content[]>([
  { id: "1", title: "Secret Trading Strategy", creator: "Alice", price: "10", views: 234, icon: "📊", unlocked: false },
  { id: "2", title: "Exclusive Art Collection", creator: "Bob", price: "15", views: 189, icon: "🎨", unlocked: true },
  { id: "3", title: "Premium Tutorial Series", creator: "Carol", price: "8", views: 456, icon: "📚", unlocked: false },
  { id: "4", title: "Behind the Scenes", creator: "Dave", price: "5", views: 321, icon: "🎬", unlocked: false },
]);

const newContent = ref({
  title: "",
  price: "",
  description: "",
});

const status = ref<{ msg: string; type: string } | null>(null);
const createdCount = ref(3);
const earnings = ref("42 GAS");

const unlockedCount = computed(() => contents.value.filter((c) => c.unlocked).length);

const viewContent = async (item: Content) => {
  if (item.unlocked) {
    status.value = { msg: t("viewingContent"), type: "success" };
    return;
  }
  if (isLoading.value) return;
  try {
    status.value = { msg: t("unlockingContent"), type: "loading" };
    await payGAS(item.price, `unlock:${item.id}`);
    item.unlocked = true;
    item.views++;
    status.value = { msg: t("contentUnlocked"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || "Error", type: "error" };
  }
};

const createContent = async () => {
  if (!newContent.value.title || !newContent.value.price) {
    status.value = { msg: t("fillAllFields"), type: "error" };
    return;
  }
  if (isLoading.value) return;
  try {
    status.value = { msg: t("creatingContent"), type: "loading" };
    await payGAS("5", `create:${Date.now()}`);
    const icons = ["📊", "🎨", "📚", "🎬", "🎵", "📹"];
    contents.value.unshift({
      id: Date.now().toString(),
      title: newContent.value.title,
      creator: "You",
      price: newContent.value.price,
      views: 0,
      icon: icons[Math.floor(Math.random() * icons.length)],
      unlocked: true,
    });
    createdCount.value++;
    newContent.value = { title: "", price: "", description: "" };
    status.value = { msg: t("contentCreated"), type: "success" };
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
.content-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.content-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba($color-nft, 0.1);
  border-radius: 10px;
}
.content-icon {
  font-size: 1.8em;
  margin-right: 12px;
}
.content-info {
  flex: 1;
}
.content-title {
  display: block;
  font-weight: bold;
}
.content-creator {
  color: $color-text-secondary;
  font-size: 0.85em;
  display: block;
}
.content-views {
  color: $color-text-secondary;
  font-size: 0.8em;
  display: block;
  margin-top: 2px;
}
.content-price {
  text-align: right;
}
.price-text {
  color: $color-nft;
  font-weight: bold;
}
.unlocked-badge {
  color: $color-success;
  font-size: 0.85em;
  font-weight: bold;
}
.create-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.input-field {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid $color-border;
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 0.95em;
}
.textarea-field {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid $color-border;
  border-radius: 8px;
  padding: 12px;
  color: #fff;
  font-size: 0.95em;
  min-height: 80px;
}
.btn-primary {
  background: linear-gradient(135deg, $color-nft 0%, darken($color-nft, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.stat-item {
  text-align: center;
  padding: 12px;
  background: rgba($color-nft, 0.1);
  border-radius: 10px;
}
.stat-value {
  display: block;
  font-size: 1.5em;
  font-weight: bold;
  color: $color-nft;
  margin-bottom: 4px;
}
.stat-label {
  color: $color-text-secondary;
  font-size: 0.85em;
}
</style>
