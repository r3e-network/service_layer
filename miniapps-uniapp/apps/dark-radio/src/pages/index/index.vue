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
      <text class="card-title">{{ t("liveStations") }}</text>
      <view v-for="station in stations" :key="station.id" class="station-item" @click="tuneIn(station)">
        <view class="station-icon">📻</view>
        <view class="station-info">
          <text class="station-name">{{ station.name }}</text>
          <text class="station-listeners">{{ station.listeners }} {{ t("listening") }}</text>
        </view>
        <view class="station-status" :class="{ active: currentStation?.id === station.id }">
          <text>{{ currentStation?.id === station.id ? "🔊" : "▶️" }}</text>
        </view>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("broadcastMessage") }}</text>
      <uni-easyinput v-model="message" :placeholder="t('yourMessage')" />
      <view class="action-btn" @click="broadcast">
        <text>{{ isLoading ? t("broadcasting") : t("broadcast") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Dark Radio", zh: "暗黑电台" },
  subtitle: { en: "Anonymous broadcasts", zh: "匿名广播" },
  liveStations: { en: "Live Stations", zh: "在线电台" },
  listening: { en: "listening", zh: "收听中" },
  broadcastMessage: { en: "Broadcast Message", zh: "广播消息" },
  yourMessage: { en: "Your anonymous message...", zh: "你的匿名消息..." },
  broadcasting: { en: "Broadcasting...", zh: "广播中..." },
  broadcast: { en: "Broadcast", zh: "广播" },
  tunedTo: { en: "Tuned to", zh: "已调至" },
  messageBroadcasted: { en: "Message broadcasted anonymously!", zh: "消息已匿名广播！" },
  error: { en: "Error", zh: "错误" },
};

const t = createT(translations);

const APP_ID = "miniapp-darkradio";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const message = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const currentStation = ref<any>(null);
const stations = ref([
  { id: "1", name: "Midnight Whispers", listeners: 42 },
  { id: "2", name: "Shadow Frequency", listeners: 28 },
  { id: "3", name: "Anonymous Echo", listeners: 15 },
]);

const tuneIn = (station: any) => {
  currentStation.value = station;
  status.value = { msg: `${t("tunedTo")} ${station.name}`, type: "success" };
};

const broadcast = async () => {
  if (!message.value.trim() || isLoading.value) return;
  try {
    await payGAS("0.5", `broadcast:${message.value.slice(0, 20)}`);
    status.value = { msg: t("messageBroadcasted"), type: "success" };
    message.value = "";
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
.station-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba($color-social, 0.1);
  border-radius: 10px;
  margin-bottom: 8px;
}
.station-icon {
  font-size: 2em;
  margin-right: 12px;
}
.station-info {
  flex: 1;
}
.station-name {
  display: block;
  font-weight: bold;
}
.station-listeners {
  color: $color-text-secondary;
  font-size: 0.85em;
}
.station-status {
  font-size: 1.2em;
  &.active {
    color: $color-social;
  }
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
