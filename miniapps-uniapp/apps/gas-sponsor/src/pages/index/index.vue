<template>
  <AppLayout class="theme-gas-sponsor" :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
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
            <text class="status-title">{{ t("wrongChain") }}</text>
            <text class="status-detail">{{ t("wrongChainMessage") }}</text>
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
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoCard, NeoDoc, NeoButton, NeoInput } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import GasTank from "./components/GasTank.vue";
import UserBalanceInfo from "./components/UserBalanceInfo.vue";
import RequestGasCard from "./components/RequestGasCard.vue";
import DailyQuotaCard from "./components/DailyQuotaCard.vue";
import UsageStatisticsCard from "./components/UsageStatisticsCard.vue";
import EligibilityStatusCard from "./components/EligibilityStatusCard.vue";
import HowItWorksCard from "./components/HowItWorksCard.vue";


const { t } = useI18n();

const { address, connect, invokeContract, chainType, switchChain } = useWallet() as any;
const { isRequestingSponsorship: isRequesting, checkEligibility, requestSponsorship: apiRequest } = useGasSponsor();

const ELIGIBILITY_THRESHOLD = 0.1;

const activeTab = ref("sponsor");
const navTabs = computed<NavTab[]>(() => [
  { id: "sponsor", icon: "gift", label: t("tabSponsor") },
  { id: "donate", icon: "heart", label: t("tabDonate") },
  { id: "send", icon: "send", label: t("tabSend") },
  { id: "stats", icon: "chart", label: t("tabStats") },
  { id: "docs", icon: "book", label: t("docs") },
]);

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
const quotaPercent = computed(() => {
  const limit = parseFloat(dailyLimit.value);
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return (parseFloat(usedQuota.value) / limit) * 100;
});
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
  if (diff <= 0) return t("now");
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}${t("hoursShort")} ${minutes}${t("minutesShort")}`;
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
    showStatus(e.message || t("loadFailed"), "error");
  } finally {
    loading.value = false;
  }
};

const requestSponsorship = async () => {
  if (!isEligible.value || remainingQuota.value <= 0) return;

  const amount = parseFloat(requestAmount.value);
  if (Number.isNaN(amount) || amount <= 0 || amount > remainingQuota.value) {
    showStatus(t("invalidAmount"), "error");
    return;
  }

  try {
    showStatus(t("requestingSponsorship"), "loading");
    const result = await apiRequest(requestAmount.value);
    showStatus(t("requestSubmitted", { id: `${result.request_id.slice(0, 8)}...` }), "success");
    requestAmount.value = "0.01";
    await loadUserData();
  } catch (e: any) {
    showStatus(e.message || t("requestFailed"), "error");
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
    showStatus(t("invalidAmount"), "error");
    return;
  }
  isDonating.value = true;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("walletNotConnected"));
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
    showStatus(t("invalidAmount"), "error");
    return;
  }
  isSending.value = true;
  try {
    if (!address.value) await connect();
    if (!address.value) throw new Error(t("walletNotConnected"));
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

:global(.theme-gas-sponsor) {
  --gas-font: 'Orbitron', 'Space Grotesk', sans-serif;
  --gas-bg: #1a0b2e;
  --gas-bg-secondary: #140822;
  --gas-bg-elevated: #221035;
  --gas-card-bg: rgba(26, 11, 46, 0.88);
  --gas-card-border: #d946ef;
  --gas-card-border-secondary: #06b6d4;
  --gas-card-shadow: 0 0 15px rgba(217, 70, 239, 0.2), inset 0 0 20px rgba(6, 182, 212, 0.12);
  --gas-card-danger-bg: rgba(40, 10, 10, 0.9);
  --gas-card-danger-border: rgba(239, 68, 68, 0.7);
  --gas-card-danger-text: #fecaca;
  --gas-card-danger-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
  --gas-text: #f8f4ff;
  --gas-text-secondary: rgba(233, 225, 255, 0.78);
  --gas-text-muted: rgba(233, 225, 255, 0.55);
  --gas-text-inverse: #0b0b12;
  --gas-grid: rgba(217, 70, 239, 0.18);
  --gas-inset-shadow: rgba(0, 0, 0, 0.7);
  --gas-accent: #d946ef;
  --gas-accent-strong: #701a75;
  --gas-accent-secondary: #06b6d4;
  --gas-accent-glow: rgba(217, 70, 239, 0.7);
  --gas-highlight: #00e599;
  --gas-highlight-shadow: 0 0 10px rgba(0, 229, 153, 0.25);
  --gas-warning-text: #ffde59;
  --gas-button-primary-bg: linear-gradient(90deg, #d946ef, #06b6d4);
  --gas-button-primary-text: #ffffff;
  --gas-button-primary-shadow: 0 0 20px rgba(217, 70, 239, 0.5);
  --gas-button-secondary-bg: transparent;
  --gas-button-secondary-border: rgba(6, 182, 212, 0.7);
  --gas-button-secondary-text: #06b6d4;
  --gas-button-secondary-shadow: 0 0 5px rgba(6, 182, 212, 0.3);
  --gas-input-bg: rgba(0, 0, 0, 0.4);
  --gas-input-border: rgba(217, 70, 239, 0.7);
  --gas-input-text: #ffffff;
  --gas-status-shadow: 0 0 5px rgba(6, 182, 212, 0.8);
  --gas-divider: rgba(255, 255, 255, 0.08);
  --gas-form-description: rgba(209, 213, 219, 0.9);
  --gas-preset-bg: rgba(255, 255, 255, 0.05);
  --gas-preset-border: rgba(112, 26, 117, 0.6);
  --gas-preset-hover-bg: rgba(255, 255, 255, 0.1);
  --gas-preset-hover-border: rgba(217, 70, 239, 0.5);
  --gas-preset-active-bg: rgba(217, 70, 239, 0.2);
  --gas-preset-active-shadow: 0 0 15px rgba(217, 70, 239, 0.5);
  --gas-preset-active-text: #f8e9ff;
  --gas-quota-fill: #7000ff;
  --gas-quota-fill-shadow: 0 0 10px rgba(112, 0, 255, 0.4);
  --gas-quota-bar-bg: rgba(255, 255, 255, 0.06);
  --gas-pump-bg: linear-gradient(180deg, rgba(20, 20, 22, 0.6) 0%, rgba(10, 10, 12, 0.8) 100%);
  --gas-pump-border: rgba(255, 255, 255, 0.1);
  --gas-pump-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05);
  --gas-pump-screen-bg: #0d1117;
  --gas-pump-screen-border: rgba(0, 229, 153, 0.2);
  --gas-pump-screen-shadow: inset 0 0 20px rgba(0, 229, 153, 0.05), 0 0 10px rgba(0, 0, 0, 0.5);
  --gas-pump-screen-sheen: linear-gradient(90deg, transparent, rgba(0, 229, 153, 0.5), transparent);
  --gas-pump-label: rgba(0, 229, 153, 0.6);
  --gas-pump-amount: #00e599;
  --gas-pump-amount-shadow: 0 0 20px rgba(0, 229, 153, 0.5), 0 0 40px rgba(0, 229, 153, 0.1);
  --gas-quick-btn-bg: rgba(255, 255, 255, 0.03);
  --gas-quick-btn-border: rgba(255, 255, 255, 0.1);
  --gas-quick-btn-hover-bg: rgba(255, 255, 255, 0.08);
  --gas-quick-btn-hover-border: rgba(0, 229, 153, 0.3);
  --gas-quick-btn-hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  --gas-quick-btn-hover-text: #00e599;
  --gas-tank-bg: rgba(20, 20, 20, 0.6);
  --gas-tank-border: rgba(255, 255, 255, 0.1);
  --gas-tank-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5), 0 10px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
  --gas-tank-grid: rgba(255, 255, 255, 0.03);
  --gas-tank-graduation: rgba(255, 255, 255, 0.3);
  --gas-tank-highlight: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  --gas-fuel-start: rgba(0, 229, 153, 0.95);
  --gas-fuel-end: rgba(0, 150, 100, 0.95);
  --gas-fuel-shadow: 0 0 40px rgba(0, 229, 153, 0.4);
  --gas-fuel-surface: rgba(255, 255, 255, 0.8);
  --gas-fuel-surface-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
  --gas-bubble: rgba(255, 255, 255, 0.2);
  --gas-status-pill-bg: rgba(0, 0, 0, 0.6);
  --gas-status-pill-border: rgba(255, 255, 255, 0.1);
  --gas-status-eligible-border: rgba(255, 222, 89, 0.6);
  --gas-status-eligible-text: #ffde59;
  --gas-status-eligible-shadow: 0 0 20px rgba(255, 222, 89, 0.2), inset 0 0 10px rgba(255, 222, 89, 0.1);
  --gas-status-full-border: rgba(0, 229, 153, 0.6);
  --gas-status-full-text: #00e599;
  --gas-status-full-shadow: 0 0 20px rgba(0, 229, 153, 0.2), inset 0 0 10px rgba(0, 229, 153, 0.1);
  --gas-badge-eligible-bg: rgba(0, 229, 153, 0.1);
  --gas-badge-eligible-border: rgba(0, 229, 153, 0.2);
  --gas-badge-eligible-text: #00e599;
  --gas-badge-ineligible-bg: rgba(239, 68, 68, 0.1);
  --gas-badge-ineligible-border: rgba(239, 68, 68, 0.2);
  --gas-badge-ineligible-text: #ef4444;
  --bg-primary: var(--gas-bg);
  --bg-secondary: var(--gas-bg-secondary);
  --bg-card: var(--gas-card-bg);
  --bg-elevated: var(--gas-bg-elevated);
  --text-primary: var(--gas-text);
  --text-secondary: var(--gas-text-secondary);
  --text-muted: var(--gas-text-muted);
  --border-color: var(--gas-card-border);
  --shadow-color: rgba(0, 0, 0, 0.35);
}

:global(.theme-light .theme-gas-sponsor),
:global([data-theme="light"] .theme-gas-sponsor) {
  --gas-bg: #f7f2ff;
  --gas-bg-secondary: #efe8ff;
  --gas-bg-elevated: #ffffff;
  --gas-card-bg: rgba(255, 255, 255, 0.92);
  --gas-card-border: #c026d3;
  --gas-card-border-secondary: #0891b2;
  --gas-card-shadow: 0 10px 20px rgba(88, 28, 135, 0.12), inset 0 0 10px rgba(6, 182, 212, 0.08);
  --gas-card-danger-bg: #fee2e2;
  --gas-card-danger-border: rgba(239, 68, 68, 0.5);
  --gas-card-danger-text: #b91c1c;
  --gas-card-danger-shadow: 0 8px 16px rgba(239, 68, 68, 0.15);
  --gas-text: #2a0a3d;
  --gas-text-secondary: #5b3b7a;
  --gas-text-muted: #7b6a94;
  --gas-text-inverse: #ffffff;
  --gas-grid: rgba(217, 70, 239, 0.12);
  --gas-inset-shadow: rgba(88, 28, 135, 0.12);
  --gas-accent: #c026d3;
  --gas-accent-strong: #86198f;
  --gas-accent-secondary: #0891b2;
  --gas-accent-glow: rgba(192, 38, 211, 0.35);
  --gas-highlight: #059669;
  --gas-highlight-shadow: 0 0 8px rgba(5, 150, 105, 0.25);
  --gas-warning-text: #a16207;
  --gas-button-primary-bg: linear-gradient(90deg, #c026d3, #22d3ee);
  --gas-button-primary-text: #ffffff;
  --gas-button-primary-shadow: 0 12px 22px rgba(88, 28, 135, 0.2);
  --gas-button-secondary-bg: rgba(255, 255, 255, 0.6);
  --gas-button-secondary-border: rgba(8, 145, 178, 0.4);
  --gas-button-secondary-text: #0e7490;
  --gas-button-secondary-shadow: 0 4px 12px rgba(88, 28, 135, 0.12);
  --gas-input-bg: rgba(255, 255, 255, 0.85);
  --gas-input-border: rgba(192, 38, 211, 0.35);
  --gas-input-text: #2b1b3d;
  --gas-status-shadow: 0 0 6px rgba(8, 145, 178, 0.25);
  --gas-divider: rgba(88, 28, 135, 0.12);
  --gas-form-description: rgba(91, 59, 122, 0.9);
  --gas-preset-bg: rgba(255, 255, 255, 0.7);
  --gas-preset-border: rgba(134, 25, 143, 0.3);
  --gas-preset-hover-bg: rgba(255, 255, 255, 0.95);
  --gas-preset-hover-border: rgba(192, 38, 211, 0.35);
  --gas-preset-active-bg: rgba(217, 70, 239, 0.18);
  --gas-preset-active-shadow: 0 0 12px rgba(217, 70, 239, 0.25);
  --gas-preset-active-text: #a21caf;
  --gas-quota-fill: #7c3aed;
  --gas-quota-fill-shadow: 0 0 12px rgba(124, 58, 237, 0.25);
  --gas-quota-bar-bg: rgba(88, 28, 135, 0.08);
  --gas-pump-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(245, 240, 255, 0.95) 100%);
  --gas-pump-border: rgba(134, 25, 143, 0.2);
  --gas-pump-shadow: 0 10px 25px rgba(88, 28, 135, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  --gas-pump-screen-bg: #f5f7fb;
  --gas-pump-screen-border: rgba(5, 150, 105, 0.25);
  --gas-pump-screen-shadow: inset 0 0 18px rgba(5, 150, 105, 0.12), 0 0 10px rgba(88, 28, 135, 0.1);
  --gas-pump-screen-sheen: linear-gradient(90deg, transparent, rgba(5, 150, 105, 0.35), transparent);
  --gas-pump-label: rgba(5, 150, 105, 0.7);
  --gas-pump-amount: #059669;
  --gas-pump-amount-shadow: 0 0 16px rgba(5, 150, 105, 0.2);
  --gas-quick-btn-bg: rgba(255, 255, 255, 0.7);
  --gas-quick-btn-border: rgba(88, 28, 135, 0.15);
  --gas-quick-btn-hover-bg: rgba(255, 255, 255, 0.95);
  --gas-quick-btn-hover-border: rgba(5, 150, 105, 0.3);
  --gas-quick-btn-hover-shadow: 0 4px 12px rgba(88, 28, 135, 0.1);
  --gas-quick-btn-hover-text: #059669;
  --gas-tank-bg: rgba(255, 255, 255, 0.75);
  --gas-tank-border: rgba(88, 28, 135, 0.15);
  --gas-tank-shadow: inset 0 0 24px rgba(88, 28, 135, 0.08), 0 10px 20px rgba(88, 28, 135, 0.1), 0 0 0 1px rgba(88, 28, 135, 0.12);
  --gas-tank-grid: rgba(88, 28, 135, 0.08);
  --gas-tank-graduation: rgba(88, 28, 135, 0.3);
  --gas-tank-highlight: linear-gradient(180deg, rgba(255, 255, 255, 0.65) 0%, transparent 100%);
  --gas-fuel-start: rgba(16, 185, 129, 0.9);
  --gas-fuel-end: rgba(5, 150, 105, 0.9);
  --gas-fuel-shadow: 0 0 28px rgba(5, 150, 105, 0.25);
  --gas-fuel-surface: rgba(255, 255, 255, 0.9);
  --gas-fuel-surface-shadow: 0 0 12px rgba(255, 255, 255, 0.6);
  --gas-bubble: rgba(255, 255, 255, 0.35);
  --gas-status-pill-bg: rgba(255, 255, 255, 0.7);
  --gas-status-pill-border: rgba(88, 28, 135, 0.2);
  --gas-status-eligible-border: rgba(234, 179, 8, 0.6);
  --gas-status-eligible-text: #a16207;
  --gas-status-eligible-shadow: 0 0 16px rgba(234, 179, 8, 0.2), inset 0 0 8px rgba(234, 179, 8, 0.12);
  --gas-status-full-border: rgba(5, 150, 105, 0.5);
  --gas-status-full-text: #047857;
  --gas-status-full-shadow: 0 0 16px rgba(5, 150, 105, 0.2), inset 0 0 8px rgba(5, 150, 105, 0.12);
  --gas-badge-eligible-bg: rgba(16, 185, 129, 0.15);
  --gas-badge-eligible-border: rgba(16, 185, 129, 0.35);
  --gas-badge-eligible-text: #047857;
  --gas-badge-ineligible-bg: rgba(239, 68, 68, 0.15);
  --gas-badge-ineligible-border: rgba(239, 68, 68, 0.35);
  --gas-badge-ineligible-text: #b91c1c;
  --shadow-color: rgba(42, 10, 61, 0.12);
}

:global(page) {
  background: var(--gas-bg, var(--bg-primary));
  font-family: var(--gas-font, #{$font-family});
}

.app-container {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: var(--gas-bg);
  background-image: 
    linear-gradient(var(--gas-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--gas-grid) 1px, transparent 1px);
  background-size: 40px 40px;
  min-height: 100vh;
  box-shadow: inset 0 0 100px var(--gas-inset-shadow);
}

/* Gas Station Component Overrides */
:deep(.neo-card) {
  background: var(--gas-card-bg) !important;
  border: 1px solid var(--gas-card-border) !important;
  border-bottom: 2px solid var(--gas-card-border-secondary) !important;
  border-radius: 4px !important;
  box-shadow: var(--gas-card-shadow) !important;
  color: var(--gas-text) !important;
  backdrop-filter: blur(10px);
  
  &.variant-danger {
    border-color: var(--gas-card-danger-border) !important;
    background: var(--gas-card-danger-bg) !important;
    color: var(--gas-card-danger-text) !important;
    box-shadow: var(--gas-card-danger-shadow) !important;
  }
}

:deep(.neo-button) {
  border-radius: 99px !important; /* Pill shape */
  font-family: var(--gas-font, #{$font-family}) !important;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 800 !important;
  
  &.variant-primary {
    background: var(--gas-button-primary-bg) !important;
    color: var(--gas-button-primary-text) !important;
    border: none !important;
    box-shadow: var(--gas-button-primary-shadow) !important;
    
    &:active {
      transform: scale(0.95);
      box-shadow: var(--gas-button-primary-shadow) !important;
    }
  }
  
  &.variant-secondary {
    background: var(--gas-button-secondary-bg) !important;
    border: 1px solid var(--gas-button-secondary-border) !important;
    color: var(--gas-button-secondary-text) !important;
    box-shadow: var(--gas-button-secondary-shadow) !important;
  }
}

:deep(.neo-input) {
  background: var(--gas-input-bg) !important;
  border: 1px solid var(--gas-input-border) !important;
  border-radius: 4px !important;
  color: var(--gas-input-text) !important;
  font-family: 'Courier New', monospace !important;
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
  color: var(--gas-accent-secondary);
  text-shadow: var(--gas-status-shadow);
}

.status-title {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 12px;
  color: var(--gas-card-danger-text);
  letter-spacing: 0.08em;
}

.status-detail {
  font-size: 12px;
  text-align: center;
  color: var(--gas-text-secondary);
  opacity: 0.85;
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
  color: var(--gas-accent);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
  text-shadow: 0 0 8px var(--gas-accent-glow);
}

.form-description {
  font-size: 12px;
  color: var(--gas-form-description);
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
  color: var(--gas-accent-secondary);
  letter-spacing: 0.05em;
  text-shadow: var(--gas-status-shadow);
}

.preset-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 12px;
}

.preset-btn {
  padding: 16px 8px;
  background: var(--gas-preset-bg);
  border: 1px solid var(--gas-preset-border);
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(5px);

  &:hover {
    background: var(--gas-preset-hover-bg);
    border-color: var(--gas-preset-hover-border);
    transform: translateY(-2px);
  }

  &.active {
    background: var(--gas-preset-active-bg);
    border-color: var(--gas-accent);
    box-shadow: var(--gas-preset-active-shadow);
    .preset-value { color: var(--gas-preset-active-text); }
  }
}

.preset-value {
  font-weight: 800;
  font-size: 18px;
  color: var(--gas-text);
  font-family: $font-mono;
}

.preset-unit {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  opacity: 0.7;
  color: var(--gas-accent-secondary);
}

.glass-status {
  text-align: center;
  backdrop-filter: blur(10px);
}
</style>
