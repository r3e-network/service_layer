<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <NeoCard
        v-if="status"
        :variant="status.type === 'error' ? 'danger' : status.type === 'loading' ? 'warning' : 'success'"
        class="mb-4 text-center glass-status"
      >
        <text class="status-msg">{{ status.msg }}</text>
      </NeoCard>

      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="status-msg text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
              t("switchToNeo")
            }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Sponsor Tab -->
      <view v-if="activeTab === 'sponsor'" class="tab-content">
        <!-- Request Sponsored Gas -->
        <RequestGasCard
          :is-eligible="isEligible"
          :remaining-quota="remainingQuota"
          v-model:requestAmount="requestAmount"
          :max-request-amount="maxRequestAmount"
          :is-requesting="isRequesting"
          :quick-amounts="quickAmounts"
          :t="t as any"
          @request="requestSponsorship"
        />
        <!-- Gas Tank Visualization -->
        <GasTank
          :fuel-level-percent="fuelLevelPercent"
          :gas-balance="gasBalance"
          :is-eligible="isEligible"
          :t="t as any"
        />
      </view>

      <!-- Donate Tab -->
      <view v-if="activeTab === 'donate'" class="tab-content">
        <NeoCard variant="accent" class="glass-container">
          <view class="donate-form">
            <text class="form-subtitle">{{ t("donateSubtitle") }}</text>
            <text class="form-description">{{ t("donateDescription") }}</text>
            <view class="input-section">
              <text class="input-label">{{ t("donateAmount") }}</text>
              <view class="preset-amounts">
                <view
                  v-for="amt in [0.1, 0.5, 1, 5]"
                  :key="amt"
                  :class="['preset-btn glass-btn', { active: donateAmount === amt.toString() }]"
                  @click="donateAmount = amt.toString()"
                >
                  <text class="preset-value">{{ amt }}</text>
                  <text class="preset-unit">GAS</text>
                </view>
              </view>
              <NeoInput v-model="donateAmount" type="number" placeholder="0.1" suffix="GAS" />
            </view>
            <NeoButton variant="primary" size="lg" block :loading="isDonating" @click="handleDonate">
              {{ isDonating ? t("donating") : t("donateBtn") }}
            </NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Send Tab -->
      <view v-if="activeTab === 'send'" class="tab-content">
        <NeoCard variant="accent" class="glass-container">
          <view class="send-form">
            <text class="form-subtitle">{{ t("sendSubtitle") }}</text>
            <view class="input-section">
              <text class="input-label">{{ t("recipientAddress") }}</text>
              <NeoInput v-model="recipientAddress" :placeholder="t('recipientPlaceholder')" />
            </view>
            <view class="input-section">
              <text class="input-label">{{ t("sendAmount") }}</text>
              <view class="preset-amounts">
                <view
                  v-for="amt in [0.05, 0.1, 0.2, 0.5]"
                  :key="amt"
                  :class="['preset-btn glass-btn', { active: sendAmount === amt.toString() }]"
                  @click="sendAmount = amt.toString()"
                >
                  <text class="preset-value">{{ amt }}</text>
                  <text class="preset-unit">GAS</text>
                </view>
              </view>
              <NeoInput v-model="sendAmount" type="number" placeholder="0.1" suffix="GAS" />
            </view>
            <NeoButton variant="primary" size="lg" block :loading="isSending" @click="handleSend">
              {{ isSending ? t("sending") : t("sendBtn") }}
            </NeoButton>
          </view>
        </NeoCard>
      </view>

      <!-- Stats Tab -->
      <view v-if="activeTab === 'stats'" class="tab-content scrollable">
        <!-- User Balance Info -->
        <UserBalanceInfo
          :loading="loading"
          :user-address="userAddress"
          :gas-balance="gasBalance"
          :is-eligible="isEligible"
          :t="t as any"
        />

        <DailyQuotaCard
          :quota-percent="quotaPercent"
          :daily-limit="dailyLimit"
          :used-quota="usedQuota"
          :remaining-quota="remainingQuota"
          :reset-time="resetTime"
          :t="t as any"
        />

        <UsageStatisticsCard
          :used-quota="usedQuota"
          :remaining-quota="remainingQuota"
          :daily-limit="dailyLimit"
          :reset-time="resetTime"
          :t="t as any"
        />

        <EligibilityStatusCard
          :gas-balance="gasBalance"
          :remaining-quota="remainingQuota"
          :user-address="userAddress"
          :t="t as any"
        />
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
        <HowItWorksCard :t="t as any" />
      </view>
    </view>
  </AppLayout>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useWallet, useGasSponsor } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoCard, NeoDoc, NeoButton, NeoInput } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import GasTank from "./components/GasTank.vue";
import UserBalanceInfo from "./components/UserBalanceInfo.vue";
import RequestGasCard from "./components/RequestGasCard.vue";
import DailyQuotaCard from "./components/DailyQuotaCard.vue";
import UsageStatisticsCard from "./components/UsageStatisticsCard.vue";
import EligibilityStatusCard from "./components/EligibilityStatusCard.vue";
import HowItWorksCard from "./components/HowItWorksCard.vue";

const translations = {
  title: { en: "Gas Sponsor", zh: "Gas 赞助" },
  subtitle: { en: "Get free GAS for transactions", zh: "获取免费 GAS 进行交易" },
  yourBalance: { en: "Your Balance", zh: "您的余额" },
  dailyQuota: { en: "Daily Quota", zh: "每日配额" },
  remainingToday: { en: "Remaining Today", zh: "今日剩余" },
  resetsIn: { en: "Resets In", zh: "重置时间" },
  balanceExceeds: { en: "Your GAS balance exceeds 0.1 GAS.", zh: "您的 GAS 余额超过 0.1 GAS。" },
  newUsersOnly: { en: "This service is for new users only.", zh: "此服务仅供新用户使用。" },
  quotaExhausted: { en: "Daily quota exhausted", zh: "每日配额已用完" },
  tryTomorrow: { en: "Please try again tomorrow.", zh: "请明天再试。" },
  amountToRequest: { en: "Amount to request", zh: "请求数量" },
  requesting: { en: "Requesting...", zh: "请求中..." },
  requestGas: { en: "Request GAS", zh: "请求 GAS" },
  maxRequest: { en: "Max request", zh: "最大请求" },
  remaining: { en: "Remaining", zh: "剩余" },
  requestSuccess: { en: "GAS sponsored successfully!", zh: "GAS 赞助成功！" },
  error: { en: "Error", zh: "错误" },
  tabSponsor: { en: "Sponsor", zh: "赞助" },
  tabStats: { en: "Stats", zh: "统计" },
  needsFuel: { en: "Needs Fuel", zh: "需要加油" },
  tankFull: { en: "Tank Full", zh: "油箱已满" },
  checkingEligibility: { en: "Checking eligibility...", zh: "检查资格中..." },
  walletAddress: { en: "Wallet Address", zh: "钱包地址" },
  gasBalance: { en: "GAS Balance", zh: "GAS 余额" },
  eligibility: { en: "Eligibility", zh: "资格" },
  eligible: { en: "Eligible", zh: "符合资格" },
  notEligible: { en: "Not Eligible", zh: "不符合资格" },
  notEligibleTitle: { en: "Not Eligible", zh: "不符合资格" },
  requestAmount: { en: "Request Amount", zh: "请求数量" },
  howItWorks: { en: "How It Works", zh: "如何使用" },
  step1: { en: "New users with less than 0.1 GAS are eligible", zh: "余额少于 0.1 GAS 的新用户符合资格" },
  step2: { en: "Request up to 0.1 GAS per day for free", zh: "每天可免费请求最多 0.1 GAS" },
  step3: { en: "Use sponsored gas to pay transaction fees", zh: "使用赞助的 gas 支付交易费用" },
  step4: { en: "Once you have enough GAS, help others!", zh: "当您有足够的 GAS 后，帮助其他人！" },
  todayUsage: { en: "Today's Usage", zh: "今日使用" },
  statistics: { en: "Statistics", zh: "统计数据" },
  usedToday: { en: "Used Today", zh: "今日已用" },
  available: { en: "Available", zh: "可用" },
  dailyLimit: { en: "Daily Limit", zh: "每日限额" },
  nextReset: { en: "Next Reset", zh: "下次重置" },
  eligibilityStatus: { en: "Eligibility Status", zh: "资格状态" },
  balanceCheck: { en: "Balance < 0.1 GAS", zh: "余额 < 0.1 GAS" },
  quotaCheck: { en: "Quota Available", zh: "配额可用" },
  walletCheck: { en: "Wallet Connected", zh: "钱包已连接" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: {
    en: "Free GAS for new users to start transacting",
    zh: "为新用户提供免费 GAS 开始交易",
  },
  docDescription: {
    en: "Gas Sponsor provides free GAS to new Neo users with low balances. Request up to 0.1 GAS daily to cover transaction fees and get started on the Neo network.",
    zh: "Gas Sponsor 为低余额的 Neo 新用户提供免费 GAS。每天可请求最多 0.1 GAS 来支付交易费用，开始使用 Neo 网络。",
  },
  feature1Name: { en: "Daily Quota", zh: "每日配额" },
  feature1Desc: {
    en: "Request up to 0.1 GAS per day when your balance is low.",
    zh: "当余额较低时，每天可请求最多 0.1 GAS。",
  },
  feature2Name: { en: "Auto-Reset", zh: "自动重置" },
  feature2Desc: {
    en: "Quota resets daily at midnight UTC for continued access.",
    zh: "配额每天 UTC 午夜自动重置，持续可用。",
  },
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
  // Donate tab
  tabDonate: { en: "Donate", zh: "捐赠" },
  donateTitle: { en: "Donate to Gas Pool", zh: "捐赠到 Gas 池" },
  donateSubtitle: { en: "Help new users get started on Neo", zh: "帮助新用户开始使用 Neo" },
  donateAmount: { en: "Donation Amount", zh: "捐赠金额" },
  donating: { en: "Donating...", zh: "捐赠中..." },
  donateBtn: { en: "Donate GAS", zh: "捐赠 GAS" },
  donateSuccess: { en: "Thank you for your donation!", zh: "感谢您的捐赠！" },
  donateDescription: {
    en: "Your donation helps new users cover transaction fees.",
    zh: "您的捐赠帮助新用户支付交易费用。",
  },
  // Send tab
  tabSend: { en: "Send", zh: "发送" },
  sendTitle: { en: "Send GAS to Address", zh: "发送 GAS 到地址" },
  sendSubtitle: { en: "Help someone with low GAS balance", zh: "帮助 GAS 余额不足的人" },
  recipientAddress: { en: "Recipient Address", zh: "接收地址" },
  recipientPlaceholder: { en: "Enter Neo N3 address...", zh: "输入 Neo N3 地址..." },
  sendAmount: { en: "Amount to Send", zh: "发送金额" },
  sending: { en: "Sending...", zh: "发送中..." },
  sendBtn: { en: "Send GAS", zh: "发送 GAS" },
  sendSuccess: { en: "GAS sent successfully!", zh: "GAS 发送成功！" },
  invalidAddress: { en: "Invalid address", zh: "无效地址" },
};

const t = createT(translations);

const { address, connect, invokeContract, chainType, switchChain } = useWallet() as any;
const { isRequestingSponsorship: isRequesting, checkEligibility, requestSponsorship: apiRequest } = useGasSponsor();

const ELIGIBILITY_THRESHOLD = 0.1;

const activeTab = ref("sponsor");
const navTabs: NavTab[] = [
  { id: "sponsor", icon: "gift", label: t("tabSponsor") },
  { id: "donate", icon: "heart", label: t("tabDonate") },
  { id: "send", icon: "send", label: t("tabSend") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const userAddress = ref("");
const gasBalance = ref("0");
const usedQuota = ref("0");
const dailyLimit = ref("0.1");
const resetsAt = ref("");
const loading = ref(true);
const requestAmount = ref("0.01");
const status = ref<{ msg: string; type: string } | null>(null);

const quickAmounts = [0.01, 0.02, 0.05, 0.1];

// Donate and Send state
const donateAmount = ref("0.1");
const sendAmount = ref("0.1");
const recipientAddress = ref("");
const isDonating = ref(false);
const isSending = ref(false);
const GAS_CONTRACT = "0xd2a4cff31913016155e38e474a2c06d08be276cf";
const SPONSOR_POOL_ADDRESS = "NikhQp1aAD1YFCiwknhM5LQQebj4464bCJ"; // Gas sponsor pool

const isEligible = computed(() => parseFloat(gasBalance.value) < ELIGIBILITY_THRESHOLD);
const remainingQuota = computed(() => Math.max(0, parseFloat(dailyLimit.value) - parseFloat(usedQuota.value)));
const quotaPercent = computed(() => (parseFloat(usedQuota.value) / parseFloat(dailyLimit.value)) * 100);
const maxRequestAmount = computed(() => Math.min(remainingQuota.value, 0.05).toString());
const fuelLevelPercent = computed(() => {
  const balance = parseFloat(gasBalance.value);
  return Math.min((balance / ELIGIBILITY_THRESHOLD) * 100, 100);
});

const resetTime = computed(() => {
  if (!resetsAt.value) return "--";
  const resetDate = new Date(resetsAt.value);
  const now = new Date();
  const diff = resetDate.getTime() - now.getTime();
  if (diff <= 0) return "Now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
});

const showStatus = (msg: string, type: string) => {
  status.value = { msg, type };
  setTimeout(() => (status.value = null), 5000);
};

const loadUserData = async () => {
  loading.value = true;
  try {
    await connect();
    userAddress.value = address.value || "";

    const statusData = await checkEligibility();
    gasBalance.value = statusData.gas_balance;
    usedQuota.value = statusData.used_today;
    dailyLimit.value = statusData.daily_limit;
    resetsAt.value = statusData.resets_at;
  } catch (e: any) {
    showStatus(e.message || "Failed to load data", "error");
  } finally {
    loading.value = false;
  }
};

const requestSponsorship = async () => {
  if (!isEligible.value || remainingQuota.value <= 0) return;

  const amount = parseFloat(requestAmount.value);
  if (Number.isNaN(amount) || amount <= 0 || amount > remainingQuota.value) {
    showStatus("Invalid amount", "error");
    return;
  }

  try {
    showStatus("Requesting sponsored gas...", "loading");
    const result = await apiRequest(requestAmount.value);
    showStatus(`Request submitted! ID: ${result.request_id.slice(0, 8)}...`, "success");
    requestAmount.value = "0.01";
    await loadUserData();
  } catch (e: any) {
    showStatus(e.message || "Sponsorship request failed", "error");
  }
};

const toFixed8 = (value: string) => {
  const num = Number.parseFloat(value);
  if (!Number.isFinite(num)) return "0";
  return Math.floor(num * 1e8).toString();
};

const handleDonate = async () => {
  if (isDonating.value) return;
  const amount = parseFloat(donateAmount.value);
  if (Number.isNaN(amount) || amount <= 0) {
    showStatus("Invalid amount", "error");
    return;
  }
  isDonating.value = true;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error("Wallet not connected");
    await invokeContract({
      contractAddress: GAS_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Hash160", value: SPONSOR_POOL_ADDRESS },
        { type: "Integer", value: toFixed8(donateAmount.value) },
        { type: "Any", value: null },
      ],
    });
    showStatus(t("donateSuccess"), "success");
    donateAmount.value = "0.1";
    await loadUserData();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    isDonating.value = false;
  }
};

const handleSend = async () => {
  if (isSending.value) return;
  if (!recipientAddress.value || recipientAddress.value.length < 30) {
    showStatus(t("invalidAddress"), "error");
    return;
  }
  const amount = parseFloat(sendAmount.value);
  if (Number.isNaN(amount) || amount <= 0) {
    showStatus("Invalid amount", "error");
    return;
  }
  isSending.value = true;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error("Wallet not connected");
    await invokeContract({
      contractAddress: GAS_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: address.value },
        { type: "Hash160", value: recipientAddress.value },
        { type: "Integer", value: toFixed8(sendAmount.value) },
        { type: "Any", value: null },
      ],
    });
    showStatus(t("sendSuccess"), "success");
    sendAmount.value = "0.1";
    recipientAddress.value = "";
    await loadUserData();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    isSending.value = false;
  }
};

onMounted(() => {
  loadUserData();
  // We can't auto-refresh due to rate limits potentially, but could add a timer if needed
});

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.app-container {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-msg {
  font-weight: 700;
  text-transform: uppercase;
  font-family: $font-mono;
  font-size: 12px;
  color: white;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.donate-form,
.send-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-subtitle {
  font-weight: 800;
  font-size: 14px;
  color: white;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.form-description {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin-bottom: 8px;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.05em;
}

.preset-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.preset-btn {
  padding: 16px 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(5px);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  &.active {
    background: rgba(0, 229, 153, 0.15);
    border-color: #00e599;
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.2);
  }
}

.preset-value {
  font-weight: 800;
  font-size: 18px;
  color: white;
  font-family: $font-mono;
}

.preset-unit {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.7;
  color: rgba(255, 255, 255, 0.8);
}

.glass-status {
  backdrop-filter: blur(10px);
}
</style>
