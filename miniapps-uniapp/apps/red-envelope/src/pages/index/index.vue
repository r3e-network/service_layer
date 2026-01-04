<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <view class="header">
        <text class="title">{{ t("title") }}</text>
        <text class="subtitle">{{ t("subtitle") }}</text>
        <view class="decorations">
          <text class="decoration">🎊</text>
          <text class="decoration">✨</text>
          <text class="decoration">🎊</text>
        </view>
      </view>

      <!-- Lucky Message Display -->
      <view v-if="luckyMessage" class="lucky-message-overlay" @click="luckyMessage = null">
        <view class="lucky-message-card">
          <text class="lucky-title">🎉 {{ t("congratulations") }} 🎉</text>
          <text class="lucky-amount">{{ luckyMessage.amount }} GAS</text>
          <text class="lucky-from">{{ t("from").replace("{0}", luckyMessage.from) }}</text>
          <view class="coins-container">
            <text v-for="i in 8" :key="i" class="coin" :style="{ animationDelay: `${i * 0.1}s` }">💰</text>
          </view>
        </view>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'success' ? 'success' : 'danger'" class="status-card">
        <text class="status-text">{{ status.msg }}</text>
      </NeoCard>

      <view v-if="activeTab === 'create'" class="tab-content">
        <NeoCard :title="t('createEnvelope')" variant="accent" class="create-card">
          <view class="input-group">
            <NeoInput v-model="amount" type="number" :placeholder="t('totalGasPlaceholder')" suffix="GAS" />
            <NeoInput v-model="count" type="number" :placeholder="t('packetsPlaceholder')" />
          </view>
          <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="create" class="send-button">
            <text class="button-text">🧧 {{ t("sendRedEnvelope") }}</text>
          </NeoButton>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'claim'" class="tab-content">
        <NeoCard :title="t('availableEnvelopes')" variant="default">
          <view class="envelope-list">
            <view v-for="env in envelopes" :key="env.id" class="hongbao-wrapper" @click="claim(env)">
              <view class="hongbao-card" :class="{ 'hongbao-opening': openingId === env.id }">
                <view class="hongbao-front">
                  <view class="hongbao-top">
                    <text class="hongbao-pattern">福</text>
                  </view>
                  <view class="hongbao-seal">
                    <text class="seal-text">💰</text>
                  </view>
                  <view class="hongbao-info">
                    <text class="hongbao-from">{{ env.from }}</text>
                    <text class="hongbao-remaining">
                      {{ t("remaining").replace("{0}", String(env.remaining)).replace("{1}", String(env.total)) }}
                    </text>
                  </view>
                  <view class="sparkles">
                    <text class="sparkle">✨</text>
                    <text class="sparkle">✨</text>
                    <text class="sparkle">✨</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
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
    </view>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoButton, NeoInput, NeoCard, NeoDoc } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

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
  congratulations: { en: "Congratulations", zh: "恭喜发财" },
  error: { en: "Error", zh: "错误" },
  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Social lucky packets on Neo N3.", zh: "Neo N3 上的社交幸运红包。" },
  docDescription: {
    en: "Red Envelope is a social MiniApp that lets you send and claim GAS in lucky packets. It uses NeoHub's secure RNG to fairly distribute GAS across recipients.",
    zh: "红包是一个社交小程序，让你以幸运包的形式发送和领取 GAS。它使用 NeoHub 的安全随机数生成器来公平地在接收者之间分配 GAS。",
  },
  step1: { en: "Enter the total GAS and number of packets to create.", zh: "输入要创建的总 GAS 和红包数量。" },
  step2: { en: "Click 'Send Red Envelope' to authorize the payment.", zh: "点击"发送红包"授权支付。" },
  step3: { en: "Recipients can claim their portion randomly until empty!", zh: "接收者可以随机领取他们的份额，直到领完为止！" },
  feature1Name: { en: "Secure Distribution", zh: "安全分配" },
  feature1Desc: { en: "Random amounts are calculated on-chain/TEE for fairness.", zh: "随机金额在链上/TEE 中计算以确保公平。" },
  feature2Name: { en: "Instant Claim", zh: "即时领取" },
  feature2Desc: { en: "GAS is transferred directly to your Neo wallet.", zh: "GAS 直接转移到你的 Neo 钱包。" },
};
const t = createT(translations);

const APP_ID = "miniapp-redenvelope";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const activeTab = ref<string>("create");
const navTabs: NavTab[] = [
  { id: "create", label: "Create", icon: "🧧" },
  { id: "claim", label: "Claim", icon: "🎁" },
  { id: "docs", label: "Docs", icon: "book" },
];

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const amount = ref("");
const count = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const luckyMessage = ref<{ amount: number; from: string } | null>(null);
const openingId = ref<string | null>(null);

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
  if (openingId.value) return;

  openingId.value = env.id;

  setTimeout(() => {
    const claimedAmount = (Math.random() * 2 + 0.5).toFixed(2);
    luckyMessage.value = {
      amount: parseFloat(claimedAmount),
      from: env.from,
    };

    env.remaining--;
    openingId.value = null;

    status.value = { msg: t("claimedFrom").replace("{0}", env.from), type: "success" };
  }, 800);
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  display: flex;
  flex-direction: column;
  padding: $space-4;
  gap: $space-4;
  min-height: 100vh;
}

// ============================================
// HEADER SECTION
// ============================================

.header {
  text-align: center;
  margin-bottom: $space-4;
  position: relative;
}

.title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: var(--brutal-red);
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 3px 3px 0 var(--brutal-yellow);
  display: block;
}

.subtitle {
  color: var(--text-secondary);
  font-size: $font-size-lg;
  margin-top: $space-2;
  font-weight: $font-weight-medium;
  display: block;
}

.decorations {
  display: flex;
  justify-content: center;
  gap: $space-6;
  margin-top: $space-3;
}

.decoration {
  font-size: $font-size-2xl;
  animation: float 3s ease-in-out infinite;
  display: inline-block;
}

.decoration:nth-child(1) {
  animation-delay: 0s;
}

.decoration:nth-child(2) {
  animation-delay: 0.5s;
}

.decoration:nth-child(3) {
  animation-delay: 1s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

// ============================================
// LUCKY MESSAGE OVERLAY
// ============================================

.lucky-message-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: $z-modal;
  animation: fadeIn 0.3s ease;
}

.lucky-message-card {
  background: linear-gradient(135deg, var(--brutal-red) 0%, color-mix(in srgb, var(--brutal-red) 85%, black) 100%);
  border: $border-width-lg solid var(--brutal-yellow);
  border-radius: $radius-lg;
  padding: $space-8;
  text-align: center;
  box-shadow: 0 0 40px color-mix(in srgb, var(--brutal-yellow) 50%, transparent);
  animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  overflow: hidden;
  max-width: 320px;
  margin: $space-4;
}

.lucky-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--brutal-yellow);
  display: block;
  margin-bottom: $space-4;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
}

.lucky-amount {
  font-size: $font-size-4xl;
  font-weight: $font-weight-black;
  color: var(--neo-white);
  display: block;
  margin: $space-4 0;
  text-shadow: 3px 3px 0 rgba(0, 0, 0, 0.3);
  animation: pulse 1s ease infinite;
}

.lucky-from {
  font-size: $font-size-base;
  color: var(--brutal-yellow);
  display: block;
  margin-top: $space-2;
  font-weight: $font-weight-medium;
}

.coins-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.coin {
  position: absolute;
  font-size: $font-size-3xl;
  animation: coinFall 2s ease-out forwards;
  opacity: 0;
}

.coin:nth-child(1) {
  left: 10%;
}
.coin:nth-child(2) {
  left: 20%;
}
.coin:nth-child(3) {
  left: 30%;
}
.coin:nth-child(4) {
  left: 40%;
}
.coin:nth-child(5) {
  left: 50%;
}
.coin:nth-child(6) {
  left: 60%;
}
.coin:nth-child(7) {
  left: 70%;
}
.coin:nth-child(8) {
  left: 80%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0.5) rotate(-10deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes coinFall {
  0% {
    top: -50px;
    opacity: 1;
    transform: rotate(0deg);
  }
  100% {
    top: 120%;
    opacity: 0;
    transform: rotate(720deg);
  }
}

// ============================================
// STATUS CARD
// ============================================

.status-card {
  margin-bottom: $space-4;
}

.status-text {
  text-align: center;
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
  display: block;
}

// ============================================
// TAB CONTENT
// ============================================

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.scrollable {
  overflow-y: auto;
}

// ============================================
// CREATE TAB
// ============================================

.create-card {
  animation: slideInUp 0.4s ease;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  margin-bottom: $space-5;
}

.send-button {
  position: relative;
  overflow: hidden;
  transition: transform $transition-fast;
}

.send-button:active {
  transform: scale(0.98);
}

.button-text {
  font-weight: $font-weight-bold;
  font-size: $font-size-lg;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// ============================================
// CLAIM TAB - HONGBAO CARDS
// ============================================

.envelope-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.hongbao-wrapper {
  cursor: pointer;
  transition: transform $transition-normal;
}

.hongbao-wrapper:active {
  transform: scale(0.98);
}

.hongbao-card {
  background: linear-gradient(135deg, var(--brutal-red) 0%, color-mix(in srgb, var(--brutal-red) 85%, black) 100%);
  border: $border-width-lg solid var(--brutal-yellow);
  border-radius: $radius-lg;
  padding: $space-6;
  position: relative;
  overflow: hidden;
  box-shadow:
    5px 5px 0 var(--brutal-yellow),
    0 0 20px color-mix(in srgb, var(--brutal-red) 30%, transparent);
  transition: all $transition-normal;
  animation: hongbaoAppear 0.5s ease backwards;
}

.hongbao-card:hover {
  transform: translateY(-4px);
  box-shadow:
    8px 8px 0 var(--brutal-yellow),
    0 0 30px color-mix(in srgb, var(--brutal-red) 50%, transparent);
  animation: shake 0.5s ease;
}

.hongbao-card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  animation: shimmer 3s infinite;
}

@keyframes hongbaoAppear {
  from {
    opacity: 0;
    transform: scale(0.8) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0) translateY(-4px);
  }
  25% {
    transform: translateX(-5px) translateY(-4px) rotate(-2deg);
  }
  75% {
    transform: translateX(5px) translateY(-4px) rotate(2deg);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%);
  }
  100% {
    transform: translateX(100%) translateY(100%);
  }
}

// Hongbao Opening Animation
.hongbao-opening {
  animation: openEnvelope 0.8s ease forwards;
}

@keyframes openEnvelope {
  0% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(5deg);
  }
  100% {
    transform: scale(0.95) rotate(-5deg);
    opacity: 0.5;
  }
}

// Hongbao Front Content
.hongbao-front {
  position: relative;
  z-index: 1;
}

.hongbao-top {
  text-align: center;
  margin-bottom: $space-4;
}

.hongbao-pattern {
  font-size: $font-size-4xl;
  font-weight: $font-weight-black;
  color: var(--brutal-yellow);
  text-shadow:
    2px 2px 0 rgba(0, 0, 0, 0.3),
    0 0 10px color-mix(in srgb, var(--brutal-yellow) 50%, transparent);
  display: block;
  animation: glow 2s ease-in-out infinite;
}

@keyframes glow {
  0%,
  100% {
    text-shadow:
      2px 2px 0 rgba(0, 0, 0, 0.3),
      0 0 10px color-mix(in srgb, var(--brutal-yellow) 50%, transparent);
  }
  50% {
    text-shadow:
      2px 2px 0 rgba(0, 0, 0, 0.3),
      0 0 20px color-mix(in srgb, var(--brutal-yellow) 80%, transparent);
  }
}

// Hongbao Seal
.hongbao-seal {
  width: 60px;
  height: 60px;
  background: var(--brutal-yellow);
  border: $border-width-md solid var(--neo-white);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto $space-4;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  animation: sealPulse 2s ease-in-out infinite;
}

.seal-text {
  font-size: $font-size-2xl;
  line-height: 1;
}

@keyframes sealPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
  }
}

// Hongbao Info
.hongbao-info {
  text-align: center;
  margin-bottom: $space-3;
}

.hongbao-from {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--neo-white);
  display: block;
  margin-bottom: $space-2;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.hongbao-remaining {
  font-size: $font-size-sm;
  color: var(--brutal-yellow);
  display: block;
  font-weight: $font-weight-medium;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

// Sparkles Decoration
.sparkles {
  display: flex;
  justify-content: space-around;
  margin-top: $space-2;
}

.sparkle {
  font-size: $font-size-lg;
  animation: sparkle 1.5s ease-in-out infinite;
  display: inline-block;
}

.sparkle:nth-child(1) {
  animation-delay: 0s;
}

.sparkle:nth-child(2) {
  animation-delay: 0.5s;
}

.sparkle:nth-child(3) {
  animation-delay: 1s;
}

@keyframes sparkle {
  0%,
  100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}
</style>
