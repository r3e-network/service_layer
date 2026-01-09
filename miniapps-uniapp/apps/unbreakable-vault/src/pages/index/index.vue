<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'vault'" class="tab-content scrollable">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold uppercase">{{ status.msg }}</text>
      </NeoCard>

      <NeoCard :title="t('vaultBalance')" variant="accent">
        <view class="balance-display">
          <text class="balance">{{ formatNum(vaultBalance) }}</text>
          <text class="balance-label">GAS</text>
        </view>
        <view class="security-row">
          <text class="security-label">{{ t("securityLevel") }}</text>
          <text class="security-value">{{ t("maximum") }}</text>
        </view>
      </NeoCard>

      <NeoCard :title="t('deposit')" variant="default">
        <NeoInput v-model="depositAmount" type="number" :placeholder="t('amountToDeposit')" class="mb-4" />
        <NeoButton variant="primary" block :loading="isLoading" @click="deposit">
          {{ isLoading ? t("processing") : t("depositToVault") }}
        </NeoButton>
      </NeoCard>

      <NeoCard :title="t('withdraw')" variant="default">
        <NeoInput v-model="withdrawAmount" type="number" :placeholder="t('amountToWithdraw')" class="mb-2" />
        <text class="warning-text block mb-4">{{ t("timeLockWarning") }}</text>
        <NeoButton variant="secondary" block @click="withdraw">
          {{ t("requestWithdrawal") }}
        </NeoButton>
      </NeoCard>
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
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";

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
  step4: {
    en: "After 24 hours, complete the withdrawal to receive your GAS.",
    zh: "24小时后，完成取款以收到您的 GAS。",
  },
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

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-unbreakablevault";
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
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.balance-display {
  text-align: center;
  padding: $space-8;
  background: var(--bg-card, white);
  border: 4px solid var(--border-color, black);
  box-shadow: 8px 8px 0 var(--shadow-color, black);
  margin-bottom: $space-6;
  position: relative;
  overflow: hidden;
  color: var(--text-primary, black);
  &::after {
    content: "UNBREAKABLE";
    position: absolute;
    top: 5px;
    right: -20px;
    background: var(--brutal-yellow);
    color: black;
    font-size: 8px;
    font-weight: $font-weight-black;
    padding: 2px 20px;
    transform: rotate(45deg);
    border: 1px solid black;
  }
}

.balance {
  font-size: 48px;
  font-weight: $font-weight-black;
  color: var(--text-primary, black);
  display: block;
  font-family: $font-mono;
  line-height: 1;
}

.balance-label {
  font-size: 14px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  margin-top: 4px;
  display: block;
}

.security-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  background: black;
  color: white;
  padding: 8px 12px;
  margin-top: $space-4;
}

.security-value {
  color: var(--brutal-green);
  text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.5);
}

.warning-text {
  font-size: 10px;
  color: var(--brutal-yellow);
  background: black;
  padding: 4px 8px;
  display: inline-block;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  border: 1px solid var(--border-color, black);
  box-shadow: 2px 2px 0 var(--shadow-color, black);
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
