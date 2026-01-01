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
      <text class="card-title">{{ t("messageChain") }}</text>
      <view v-for="msg in chain" :key="msg.id" class="chain-item">
        <view class="chain-header">
          <text class="chain-author">{{ t("anonymous") }}{{ msg.author }}</text>
          <text class="chain-time">{{ msg.time }}</text>
        </view>
        <text class="chain-message">{{ msg.message }}</text>
        <text class="chain-hops">{{ msg.hops }} {{ t("hops") }}</text>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("addToChain") }}</text>
      <uni-easyinput v-model="newMessage" :placeholder="t('yourMessagePlaceholder')" />
      <view class="action-btn" @click="addToChain">
        <text>{{ isLoading ? t("sending") : t("addToChainButton") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments, useRNG } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Whisper Chain", zh: "耳语链" },
  subtitle: { en: "Anonymous messaging", zh: "匿名消息" },
  messageChain: { en: "Message Chain", zh: "消息链" },
  anonymous: { en: "Anonymous #", zh: "匿名 #" },
  hops: { en: "hops", zh: "跳数" },
  addToChain: { en: "Add to Chain", zh: "添加到链" },
  yourMessagePlaceholder: { en: "Your anonymous message...", zh: "你的匿名消息..." },
  addToChainButton: { en: "Add to Chain", zh: "添加到链" },
  sending: { en: "Sending...", zh: "发送中..." },
  messageAdded: { en: "Message added to chain!", zh: "消息已添加到链！" },
  error: { en: "Error", zh: "错误" },
};

const t = createT(translations);

const APP_ID = "miniapp-whisperchain";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);
const { generateRandom } = useRNG(APP_ID);

const newMessage = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const chain = ref([
  { id: "1", author: "7342", message: "The truth is out there...", hops: 5, time: "2h ago" },
  { id: "2", author: "9128", message: "Follow the white rabbit", hops: 3, time: "1h ago" },
  { id: "3", author: "4567", message: "Nothing is as it seems", hops: 1, time: "30m ago" },
]);

const addToChain = async () => {
  if (!newMessage.value.trim() || isLoading.value) return;
  try {
    const randomId = await generateRandom(1000, 9999);
    await payGAS("0.3", `chain:${newMessage.value.slice(0, 20)}`);
    chain.value.push({
      id: Date.now().toString(),
      author: randomId.toString(),
      message: newMessage.value,
      hops: 0,
      time: "Just now",
    });
    status.value = { msg: t("messageAdded"), type: "success" };
    newMessage.value = "";
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
.chain-item {
  padding: 14px;
  background: rgba($color-social, 0.1);
  border-radius: 10px;
  margin-bottom: 10px;
  border-left: 3px solid $color-social;
}
.chain-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.chain-author {
  font-weight: bold;
  color: $color-social;
}
.chain-time {
  font-size: 0.85em;
  color: $color-text-secondary;
}
.chain-message {
  display: block;
  margin-bottom: 6px;
  line-height: 1.4;
}
.chain-hops {
  font-size: 0.8em;
  color: $color-text-secondary;
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
