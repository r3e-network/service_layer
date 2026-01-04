<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'vault'" class="tab-content scrollable">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <view class="card">
        <text class="card-title">{{ t("vaultBalance") }}</text>
        <view class="balance-display">
          <text class="balance">{{ formatNum(vaultBalance) }}</text>
          <text class="balance-label">GAS</text>
        </view>
        <view class="security-row">
          <text class="security-label">{{ t("securityLevel") }}</text>
          <text class="security-value">{{ t("maximum") }}</text>
        </view>
      </view>

      <view class="card">
        <text class="card-title">{{ t("deposit") }}</text>
        <uni-easyinput v-model="depositAmount" type="number" :placeholder="t('amountToDeposit')" class="input" />
        <view class="action-btn" @click="deposit" :style="{ opacity: isLoading ? 0.6 : 1 }">
          <text>{{ isLoading ? t("processing") : t("depositToVault") }}</text>
        </view>
      </view>

      <view class="card">
        <text class="card-title">{{ t("withdraw") }}</text>
        <uni-easyinput v-model="withdrawAmount" type="number" :placeholder="t('amountToWithdraw')" class="input" />
        <text class="warning-text">{{ t("timeLockWarning") }}</text>
        <view class="action-btn secondary" @click="withdraw">
          <text>{{ t("requestWithdrawal") }}</text>
        </view>
      </view>
    </view>

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
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { formatNumber } from "@/shared/utils/format";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";

const translations = {
  title: { en: "Unbreakable Vault", zh: "坚不可摧的保险库" },
  subtitle: { en: "Secure asset storage", zh: "安全资产存储" },
  vaultBalance: { en: "Vault Balance", zh: "保险库余额" },
  securityLevel: { en: "Security Level", zh: "安全级别" },
  maximum: { en: "🔒 Maximum", zh: "🔒 最高" },
  deposit: { en: "Deposit", zh: "存款" },
  amountToDeposit: { en: "Amount to deposit", zh: "存款金额" },
  depositToVault: { en: "Deposit to Vault", zh: "存入保险库" },
  processing: { en: "Processing...", zh: "处理中..." },
  withdraw: { en: "Withdraw", zh: "取款" },
  amountToWithdraw: { en: "Amount to withdraw", zh: "取款金额" },
  timeLockWarning: { en: "⚠ 24h time lock applies", zh: "⚠ 适用24小时时间锁" },
  requestWithdrawal: { en: "Request Withdrawal", zh: "请求取款" },
  invalidAmount: { en: "Invalid amount", zh: "无效金额" },
  deposited: { en: "Deposited {amount} GAS", zh: "已存入 {amount} GAS" },
  error: { en: "Error", zh: "错误" },
  withdrawalRequested: { en: "Withdrawal request submitted. Available in 24h", zh: "取款请求已提交。24小时后可用" },
  vault: { en: "Vault", zh: "保险库" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Secure your assets in the vault.", zh: "在保险库中保护您的资产。" },
  docDescription: {
    en: "The Unbreakable Vault provides maximum security for your GAS assets with hardware-level isolation and time-lock protection.",
    zh: "坚不可摧的保险库通过硬件级隔离和时间锁保护，为您的 GAS 资产提供最高安全性。",
  },
  step1: { en: "Connect your wallet.", zh: "连接您的钱包。" },
  step2: { en: "Deposit GAS into the vault.", zh: "将 GAS 存入保险库。" },
  step3: { en: "Request withdrawal and wait for the time-lock.", zh: "请求取款并等待时间锁。" },
  feature1Name: { en: "Time-Lock", zh: "时间锁" },
  feature1Desc: { en: "24-hour protection on all withdrawals.", zh: "所有提款均受 24 小时保护。" },
  feature2Name: { en: "TEE Secured", zh: "TEE 安全性" },
  feature2Desc: { en: "Assets managed within secure environment.", zh: "在安全环境中管理的资产。" },
};

const t = createT(translations);

const navTabs = [
  { id: "vault", icon: "wallet", label: t("vault") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("vault");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-unbreakable-vault";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const vaultBalance = ref(1250.75);
const depositAmount = ref("");
const withdrawAmount = ref("");
const status = ref<{ msg: string; type: string } | null>(null);

const formatNum = (n: number) => formatNumber(n, 2);

const deposit = async () => {
  if (isLoading.value) return;
  const amount = parseFloat(depositAmount.value);
  if (!amount || amount <= 0) {
    status.value = { msg: t("invalidAmount"), type: "error" };
    return;
  }
  try {
    await payGAS(String(amount), `vault:deposit:${amount}`);
    vaultBalance.value += amount;
    status.value = { msg: t("deposited").replace("{amount}", String(amount)), type: "success" };
    depositAmount.value = "";
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const withdraw = () => {
  const amount = parseFloat(withdrawAmount.value);
  if (!amount || amount <= 0 || amount > vaultBalance.value) {
    status.value = { msg: t("invalidAmount"), type: "error" };
    return;
  }
  status.value = { msg: t("withdrawalRequested"), type: "success" };
  withdrawAmount.value = "";
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

.header {
  text-align: center;
  margin-bottom: $space-6;
}

.title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: var(--neo-purple);
  text-transform: uppercase;
}

.subtitle {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  margin-top: $space-2;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
    border-color: var(--neo-black);
  }

  &.error {
    background: var(--status-error);
    color: var(--neo-white);
    border-color: var(--neo-black);
  }
}

.card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-5;
  margin-bottom: $space-4;
}

.card-title {
  color: var(--neo-purple);
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
  display: block;
  margin-bottom: $space-3;
  text-transform: uppercase;
}

.balance-display {
  text-align: center;
  padding: $space-6;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  margin-bottom: $space-4;
}

.balance {
  font-size: $font-size-4xl;
  font-weight: $font-weight-black;
  color: var(--neo-purple);
  display: block;
}

.balance-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.security-row {
  display: flex;
  justify-content: space-between;
  padding-top: $space-2;
}

.security-label {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.security-value {
  color: var(--neo-green);
  font-weight: $font-weight-bold;
}

.input {
  margin-bottom: $space-4;
}

.warning-text {
  color: var(--brutal-yellow);
  font-size: $font-size-xs;
  display: block;
  margin-bottom: $space-4;
  text-align: center;
  font-weight: $font-weight-bold;
}

.action-btn {
  background: var(--neo-purple);
  color: var(--neo-white);
  padding: $space-4;
  border-radius: $radius-md;
  text-align: center;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: $border-width-md solid var(--neo-black);
  box-shadow: $shadow-sm;
  cursor: pointer;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  &.secondary {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }
}
</style>
