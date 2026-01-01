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
      <text class="card-title">{{ t("createContract") }}</text>
      <uni-easyinput v-model="partnerAddress" :placeholder="t('partnerPlaceholder')" />
      <uni-easyinput v-model="stakeAmount" type="number" :placeholder="t('stakePlaceholder')" />
      <uni-easyinput v-model="duration" type="number" :placeholder="t('durationPlaceholder')" />
      <view class="action-btn" @click="createContract">
        <text>{{ isLoading ? t("creating") : t("createBtn") }}</text>
      </view>
    </view>
    <view class="card">
      <text class="card-title">{{ t("activeContracts") }}</text>
      <view v-for="contract in contracts" :key="contract.id" class="contract-item">
        <view class="contract-header">
          <text class="contract-partner">{{ contract.partner }}</text>
          <text class="contract-stake">{{ contract.stake }} GAS</text>
        </view>
        <view class="contract-progress">
          <view class="progress-bar" :style="{ width: contract.progress + '%' }"></view>
        </view>
        <view class="contract-footer">
          <text class="contract-days">{{ contract.daysLeft }} {{ t("daysLeft") }}</text>
          <view class="contract-btn" @click="claimReward(contract)">
            <text>{{ t("claim") }}</text>
          </view>
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
  title: { en: "Breakup Contract", zh: "分手合约" },
  subtitle: { en: "Relationship stakes", zh: "关系赌注" },
  createContract: { en: "Create Contract", zh: "创建合约" },
  partnerPlaceholder: { en: "Partner's address", zh: "伴侣地址" },
  stakePlaceholder: { en: "Stake amount (GAS)", zh: "质押金额（GAS）" },
  durationPlaceholder: { en: "Duration (days)", zh: "持续时间（天）" },
  creating: { en: "Creating...", zh: "创建中..." },
  createBtn: { en: "Create Contract", zh: "创建合约" },
  activeContracts: { en: "Active Contracts", zh: "活跃合约" },
  daysLeft: { en: "days left", zh: "天剩余" },
  claim: { en: "Claim", zh: "领取" },
  contractCreated: { en: "Contract created!", zh: "合约已创建！" },
  notCompleted: { en: "Contract not completed yet!", zh: "合约尚未完成！" },
  claimed: { en: "Claimed", zh: "已领取" },
  error: { en: "Error", zh: "错误" },
};

const t = createT(translations);

const APP_ID = "miniapp-breakupcontract";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const partnerAddress = ref("");
const stakeAmount = ref("");
const duration = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const contracts = ref([
  { id: "1", partner: "NX8...abc", stake: "10", progress: 65, daysLeft: 105 },
  { id: "2", partner: "NY2...def", stake: "5", progress: 30, daysLeft: 210 },
]);

const createContract = async () => {
  if (!partnerAddress.value || !stakeAmount.value || isLoading.value) return;
  try {
    await payGAS(stakeAmount.value, `contract:${partnerAddress.value.slice(0, 10)}`);
    status.value = { msg: t("contractCreated"), type: "success" };
    partnerAddress.value = "";
    stakeAmount.value = "";
    duration.value = "";
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const claimReward = async (contract: any) => {
  if (contract.progress < 100) {
    status.value = { msg: t("notCompleted"), type: "error" };
    return;
  }
  status.value = { msg: `${t("claimed")} ${contract.stake} GAS!`, type: "success" };
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
.contract-item {
  padding: 14px;
  background: rgba($color-social, 0.1);
  border-radius: 10px;
  margin-bottom: 10px;
}
.contract-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.contract-partner {
  font-weight: bold;
}
.contract-stake {
  color: $color-social;
  font-weight: bold;
}
.contract-progress {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 10px;
}
.progress-bar {
  height: 100%;
  background: $color-social;
}
.contract-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.contract-days {
  font-size: 0.85em;
  color: $color-text-secondary;
}
.contract-btn {
  padding: 6px 16px;
  background: $color-social;
  border-radius: 8px;
  font-size: 0.85em;
  font-weight: bold;
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
