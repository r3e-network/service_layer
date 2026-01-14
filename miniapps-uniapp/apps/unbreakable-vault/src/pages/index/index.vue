<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="chainType === 'evm'" class="px-4 mb-4">
      <NeoCard variant="danger">
        <view class="flex flex-col items-center gap-2 py-1">
          <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
          <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
            t("switchToNeo")
          }}</NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'vault'" class="tab-content scrollable">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center glass-status">
        <text class="font-bold uppercase status-text">{{ status.msg }}</text>
      </NeoCard>

      <!-- Vault Balance Main Card -->
      <view class="vault-hero-card">
        <view class="vault-glow"></view>
        <view class="vault-content">
           <view class="security-level">
              <view class="level-indicator active"></view>
              <view class="level-indicator active"></view>
              <view class="level-indicator active"></view>
              <view class="level-indicator active"></view>
              <text class="security-label">{{ t("maximum") }} {{ t("securityLevel") }}</text>
           </view>
           
           <view class="balance-wrapper">
             <text class="balance-value">{{ formatNum(vaultBalance) }}</text>
             <text class="balance-unit">GAS</text>
           </view>
           
           <view class="vault-id">
              <text class="id-label">VAULT ID</text>
              <text class="id-value">0x...71A2</text>
           </view>
        </view>
      </view>

      <!-- Action Cards -->
      <view class="action-grid">
        <NeoCard :title="t('deposit')" variant="erobo-neo" class="action-card">
          <view class="action-body">
            <view class="input-wrapper">
              <NeoInput v-model="depositAmount" type="number" :placeholder="t('amountToDeposit')" suffix="GAS" />
            </view>
            <NeoButton variant="primary" block size="lg" :loading="isLoading" @click="deposit">
              {{ isLoading ? t("processing") : t("depositToVault") }}
            </NeoButton>
          </view>
        </NeoCard>

        <NeoCard :title="t('withdraw')" variant="erobo" class="action-card">
          <view class="action-body">
             <view class="input-wrapper">
               <NeoInput v-model="withdrawAmount" type="number" :placeholder="t('amountToWithdraw')" suffix="GAS" />
             </view>
             <view class="warning-badge-glass mb-4">
               <text class="warning-icon">⚠</text>
               <text class="warning-text">{{ t("timeLockWarning") }}</text>
             </view>
             <NeoButton variant="secondary" block size="lg" @click="withdraw">
               {{ t("requestWithdrawal") }}
             </NeoButton>
          </view>
        </NeoCard>
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
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";

const translations = {
  title: { en: "Unbreakable Vault", zh: "坚不可摧的保险库" },
  subtitle: { en: "Secure asset storage", zh: "安全资产存储" },
  vaultBalance: { en: "Vault Balance", zh: "保险库余额" },
  securityLevel: { en: "Security", zh: "安全级别" },
  maximum: { en: "MAXIMUM", zh: "最高" },
  deposit: { en: "Deposit", zh: "存款" },
  amountToDeposit: { en: "Amount", zh: "存款金额" },
  depositToVault: { en: "Deposit Assets", zh: "存入资产" },
  processing: { en: "Processing...", zh: "处理中..." },
  withdraw: { en: "Withdraw", zh: "取款" },
  amountToWithdraw: { en: "Amount", zh: "取款金额" },
  timeLockWarning: { en: "24h Time Lock Active", zh: "24小时时间锁已激活" },
  requestWithdrawal: { en: "Request Withdrawal", zh: "请求取款" },
  invalidAmount: { en: "Invalid amount", zh: "无效金额" },
  deposited: { en: "Deposited {amount} GAS", zh: "已存入 {amount} GAS" },
  error: { en: "Error", zh: "错误" },
  withdrawalRequested: { en: "Withdrawal requested", zh: "已请求取款" },
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
  wrongChain: { en: "Wrong Chain", zh: "链错误" },
  wrongChainMessage: {
    en: "This app requires Neo N3. Please switch networks.",
    zh: "此应用需要 Neo N3 网络，请切换网络。",
  },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
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
const { address, connect, chainType, switchChain } = useWallet() as any;
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-6;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.status-text {
  font-size: 14px;
  letter-spacing: 0.05em;
  color: white;
}

/* Hero Vault Card */
.vault-hero-card {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.4) 0%, rgba(10, 10, 20, 0.6) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  padding: $space-6;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(15px);
}

.vault-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(0, 229, 153, 0.2) 0%, transparent 70%);
  filter: blur(40px);
  z-index: 0;
}

.vault-content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
}

.security-level {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(0, 229, 153, 0.2);
}

.level-indicator {
  width: 4px;
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  
  &.active {
    background: #00e599;
    box-shadow: 0 0 8px rgba(0, 229, 153, 0.5);
  }
}

.security-label {
  font-size: 10px;
  font-weight: 800;
  color: #00e599;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-left: 4px;
}

.balance-wrapper {
  text-align: center;
}

.balance-value {
  font-size: 56px;
  font-weight: 900;
  color: white;
  line-height: 1;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
  font-family: $font-family;
  letter-spacing: -0.02em;
}

.balance-unit {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin-top: 4px;
  display: block;
}

.vault-id {
  position: absolute;
  bottom: -40px;
  right: -10px;
  text-align: right;
  opacity: 0.3;
  transform: rotate(-5deg);
}

.id-label {
  display: block;
  font-size: 8px;
  font-weight: 800;
}
.id-value {
  font-family: monospace;
  font-size: 10px;
}

/* Action Grid */
.action-grid {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.input-wrapper {
  margin-bottom: $space-4;
}

.warning-badge-glass {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: $space-3;
  background: rgba(255, 222, 89, 0.1);
  border: 1px solid rgba(255, 222, 89, 0.2);
  border-radius: 8px;
  margin-bottom: $space-4;
}

.warning-icon {
  font-size: 16px;
  color: #ffde59;
}

.warning-text {
  font-size: 12px;
  font-weight: 700;
  color: #ffde59;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.glass-status {
  padding: 12px;
  backdrop-filter: blur(10px);
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
