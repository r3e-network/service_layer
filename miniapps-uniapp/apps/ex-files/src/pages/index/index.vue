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
      <text class="card-title">{{ t("sharedMemories") }}</text>
      <view v-for="memory in memories" :key="memory.id" class="memory-item" @click="viewMemory(memory)">
        <view class="memory-icon">{{ memory.type === "photo" ? "📷" : "📝" }}</view>
        <view class="memory-info">
          <text class="memory-title">{{ memory.title }}</text>
          <text class="memory-date">{{ memory.date }}</text>
        </view>
        <view class="memory-lock">🔒</view>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("uploadMemory") }}</text>
      <uni-easyinput v-model="memoryTitle" :placeholder="t('memoryTitle')" />
      <uni-easyinput v-model="memoryContent" :placeholder="t('contentOrUrl')" />
      <view class="action-btn" @click="uploadMemory">
        <text>{{ isLoading ? t("uploading") : t("uploadMemoryBtn") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Ex Files", zh: "前任档案" },
  subtitle: { en: "Shared memories vault", zh: "共享回忆保险库" },
  sharedMemories: { en: "Shared Memories", zh: "共享回忆" },
  uploadMemory: { en: "Upload Memory", zh: "上传回忆" },
  memoryTitle: { en: "Memory title", zh: "回忆标题" },
  contentOrUrl: { en: "Content or URL", zh: "内容或链接" },
  uploading: { en: "Uploading...", zh: "上传中..." },
  uploadMemoryBtn: { en: "Upload Memory", zh: "上传回忆" },
  viewing: { en: "Viewing", zh: "查看" },
  memoryUploaded: { en: "Memory uploaded securely!", zh: "回忆已安全上传！" },
  error: { en: "Error", zh: "错误" },
  firstDate: { en: "First Date", zh: "初次约会" },
  loveLetter: { en: "Love Letter", zh: "情书" },
  anniversary: { en: "Anniversary", zh: "纪念日" },
};

const t = createT(translations);

const APP_ID = "miniapp-exfiles";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const memoryTitle = ref("");
const memoryContent = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const memories = ref([
  { id: "1", title: t("firstDate"), type: "photo", date: "2023-06-15" },
  { id: "2", title: t("loveLetter"), type: "text", date: "2023-08-20" },
  { id: "3", title: t("anniversary"), type: "photo", date: "2024-06-15" },
]);

const viewMemory = (memory: any) => {
  status.value = { msg: `${t("viewing")}: ${memory.title}`, type: "success" };
};

const uploadMemory = async () => {
  if (!memoryTitle.value || !memoryContent.value || isLoading.value) return;
  try {
    await payGAS("0.5", `upload:${memoryTitle.value.slice(0, 20)}`);
    status.value = { msg: t("memoryUploaded"), type: "success" };
    memoryTitle.value = "";
    memoryContent.value = "";
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
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
  color: $color-social;
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
  color: $color-social;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}
.memory-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba($color-social, 0.1);
  border-radius: 10px;
  margin-bottom: 8px;
}
.memory-icon {
  font-size: 2em;
  margin-right: 12px;
}
.memory-info {
  flex: 1;
}
.memory-title {
  display: block;
  font-weight: bold;
}
.memory-date {
  color: $color-text-secondary;
  font-size: 0.85em;
}
.memory-lock {
  font-size: 1.2em;
  color: $color-social;
}
.action-btn {
  background: linear-gradient(135deg, $color-social 0%, darken($color-social, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
  margin-top: 12px;
}
</style>
