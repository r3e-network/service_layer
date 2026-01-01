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
      <text class="card-title">{{ t("createEnvelope") }}</text>
      <uni-easyinput v-model="amount" type="number" :placeholder="t('totalGasPlaceholder')" />
      <uni-easyinput v-model="count" type="number" :placeholder="t('packetsPlaceholder')" />
      <view class="action-btn" @click="create">
        <text>{{ isLoading ? t("creating") : t("sendRedEnvelope") }}</text>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("availableEnvelopes") }}</text>
      <view v-for="env in envelopes" :key="env.id" class="envelope-item" @click="claim(env)">
        <text class="envelope-icon">🧧</text>
        <view class="envelope-info">
          <text class="envelope-from">{{ t("from").replace("{0}", env.from) }}</text>
          <text class="envelope-remaining">{{
            t("remaining").replace("{0}", String(env.remaining)).replace("{1}", String(env.total))
          }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Red Envelope", zh: "红包" },
  subtitle: { en: "Lucky red packets", zh: "幸运红包" },
  createEnvelope: { en: "Create Envelope", zh: "创建红包" },
  totalGasPlaceholder: { en: "Total GAS", zh: "总 GAS" },
  packetsPlaceholder: { en: "Number of packets", zh: "红包数量" },
  creating: { en: "Creating...", zh: "创建中..." },
  sendRedEnvelope: { en: "Send Red Envelope", zh: "发送红包" },
  availableEnvelopes: { en: "Available Envelopes", zh: "可用红包" },
  from: { en: "From {0}", zh: "来自 {0}" },
  remaining: { en: "{0}/{1} left", zh: "剩余 {0}/{1}" },
  envelopeSent: { en: "Envelope sent!", zh: "红包已发送！" },
  claimedFrom: { en: "Claimed from {0}!", zh: "已领取来自 {0} 的红包！" },
  error: { en: "Error", zh: "错误" },
};
const t = createT(translations);

const APP_ID = "miniapp-redenvelope";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const amount = ref("");
const count = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const envelopes = ref([
  { id: "1", from: "NX8...abc", remaining: 3, total: 5, amount: 10 },
  { id: "2", from: "NY2...def", remaining: 1, total: 3, amount: 5 },
]);

const create = async () => {
  if (isLoading.value) return;
  try {
    await payGAS(amount.value, `redenvelope:${count.value}`);
    status.value = { msg: t("envelopeSent"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const claim = async (env: any) => {
  status.value = { msg: t("claimedFrom").replace("{0}", env.from), type: "success" };
  env.remaining--;
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
.action-btn {
  background: linear-gradient(135deg, $color-social 0%, darken($color-social, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
  margin-top: 12px;
}
.envelope-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba($color-social, 0.1);
  border-radius: 10px;
  margin-bottom: 8px;
}
.envelope-icon {
  font-size: 2em;
  margin-right: 12px;
}
.envelope-info {
  flex: 1;
}
.envelope-from {
  display: block;
  font-weight: bold;
}
.envelope-remaining {
  color: $color-text-secondary;
  font-size: 0.85em;
}
</style>
