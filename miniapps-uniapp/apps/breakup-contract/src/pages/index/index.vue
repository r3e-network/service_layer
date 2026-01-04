<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'create' || activeTab === 'contracts'" class="app-container">
      <view class="header">
        <view class="heart-icon">
          <text class="heart">💕</text>
          <text class="broken-heart">💔</text>
        </view>
        <text class="title">{{ t("title") }}</text>
        <text class="subtitle">{{ t("subtitle") }}</text>
      </view>

      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Create Contract Tab -->
      <view v-if="activeTab === 'create'" class="tab-content">
        <view class="contract-document">
          <view class="document-header">
            <text class="document-title">{{ t("contractTitle") }}</text>
            <view class="document-seal">
              <text class="seal-text">💕</text>
            </view>
          </view>

          <view class="document-body">
            <text class="document-clause">{{ t("clause1") }}</text>

            <view class="form-group">
              <text class="form-label">{{ t("partnerLabel") }}</text>
              <uni-easyinput v-model="partnerAddress" :placeholder="t('partnerPlaceholder')" class="contract-input" />
            </view>

            <view class="form-group">
              <text class="form-label">{{ t("stakeLabel") }}</text>
              <uni-easyinput
                v-model="stakeAmount"
                type="number"
                :placeholder="t('stakePlaceholder')"
                class="contract-input"
              />
            </view>

            <view class="form-group">
              <text class="form-label">{{ t("durationLabel") }}</text>
              <uni-easyinput
                v-model="duration"
                type="number"
                :placeholder="t('durationPlaceholder')"
                class="contract-input"
              />
            </view>

            <view class="signature-section">
              <text class="signature-label">{{ t("signatureLabel") }}</text>
              <view class="signature-line">
                <text class="signature-placeholder">{{ address || t("connectWallet") }}</text>
              </view>
            </view>

            <view class="action-btn" @click="createContract">
              <text>{{ isLoading ? t("creating") : t("createBtn") }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Active Contracts Tab -->
      <view v-if="activeTab === 'contracts'" class="tab-content">
        <view class="contracts-list">
          <text class="section-title">{{ t("activeContracts") }}</text>

          <view v-for="contract in contracts" :key="contract.id" class="contract-card">
            <view class="contract-status-badge" :class="contract.status">
              <text class="status-icon">{{ contract.status === "active" ? "💕" : "💔" }}</text>
              <text class="status-text">{{ t(contract.status) }}</text>
            </view>

            <view class="contract-info">
              <view class="info-row">
                <text class="info-label">{{ t("partner") }}:</text>
                <text class="info-value">{{ contract.partner }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">{{ t("stake") }}:</text>
                <text class="info-value stake-amount">{{ contract.stake }} GAS</text>
              </view>
              <view class="info-row">
                <text class="info-label">{{ t("duration") }}:</text>
                <text class="info-value">{{ contract.daysLeft }} {{ t("daysLeft") }}</text>
              </view>
            </view>

            <view class="contract-progress-section">
              <text class="progress-label">{{ t("progress") }}: {{ contract.progress }}%</text>
              <view class="progress-track">
                <view class="progress-fill" :style="{ width: contract.progress + '%' }">
                  <view class="progress-heart">💕</view>
                </view>
              </view>
            </view>

            <view class="contract-actions">
              <view v-if="contract.progress >= 100" class="claim-btn" @click="claimReward(contract)">
                <text>{{ t("claim") }}</text>
              </view>
              <view v-else class="break-btn" @click="breakContract(contract)">
                <text>{{ t("breakContract") }}</text>
              </view>
            </view>
          </view>
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
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Breakup Contract", zh: "分手合约" },
  subtitle: { en: "Relationship stakes on-chain", zh: "链上关系赌注" },
  contractTitle: { en: "RELATIONSHIP CONTRACT", zh: "关系合约" },
  clause1: {
    en: "This contract binds two parties in a commitment backed by cryptocurrency stakes.",
    zh: "本合约将双方绑定在由加密货币质押支持的承诺中。",
  },

  partnerLabel: { en: "Partner Address", zh: "伴侣地址" },
  stakeLabel: { en: "Stake Amount", zh: "质押金额" },
  durationLabel: { en: "Contract Duration", zh: "合约期限" },
  signatureLabel: { en: "Your Signature", zh: "您的签名" },

  partnerPlaceholder: { en: "Enter partner's NEO address", zh: "输入伴侣的 NEO 地址" },
  stakePlaceholder: { en: "Amount in GAS", zh: "GAS 金额" },
  durationPlaceholder: { en: "Days", zh: "天数" },
  connectWallet: { en: "Connect wallet to sign", zh: "连接钱包以签名" },

  creating: { en: "Creating...", zh: "创建中..." },
  createBtn: { en: "Sign & Create Contract", zh: "签署并创建合约" },

  activeContracts: { en: "Active Contracts", zh: "活跃合约" },
  partner: { en: "Partner", zh: "伴侣" },
  stake: { en: "Stake", zh: "质押" },
  duration: { en: "Duration", zh: "期限" },
  daysLeft: { en: "days left", zh: "天剩余" },
  progress: { en: "Progress", zh: "进度" },

  active: { en: "Active", zh: "活跃" },
  broken: { en: "Broken", zh: "已破裂" },

  claim: { en: "Claim Reward", zh: "领取奖励" },
  breakContract: { en: "Break Contract", zh: "违约" },

  contractCreated: { en: "Contract created successfully!", zh: "合约创建成功！" },
  notCompleted: { en: "Contract not completed yet!", zh: "合约尚未完成！" },
  claimed: { en: "Claimed", zh: "已领取" },
  contractBroken: { en: "Contract broken! Stake forfeited.", zh: "合约已破裂！质押被没收。" },
  error: { en: "Error", zh: "错误" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Learn about relationship contracts.", zh: "了解关系合约。" },
  docDescription: {
    en: "Create binding relationship contracts with cryptocurrency stakes. Complete the duration to claim rewards, or break early and forfeit your stake.",
    zh: "创建具有加密货币质押的约束性关系合约。完成期限以领取奖励，或提前违约并没收质押。",
  },
  step1: { en: "Connect your wallet.", zh: "连接您的钱包。" },
  step2: { en: "Enter partner address and stake amount.", zh: "输入伴侣地址和质押金额。" },
  step3: { en: "Sign the contract and wait for completion!", zh: "签署合约并等待完成！" },
  feature1Name: { en: "Crypto Stakes", zh: "加密质押" },
  feature1Desc: { en: "Real GAS locked in contract.", zh: "真实的 GAS 锁定在合约中。" },
  feature2Name: { en: "On-Chain Proof", zh: "链上证明" },
  feature2Desc: { en: "Immutable relationship records.", zh: "不可变的关系记录。" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-breakupcontract";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const activeTab = ref<string>("create");
const navTabs: NavTab[] = [
  { id: "create", label: "Create", icon: "💔" },
  { id: "contracts", label: "Contracts", icon: "📋" },
  { id: "docs", icon: "book", label: t("docs") },
];

const partnerAddress = ref("");
const stakeAmount = ref("");
const duration = ref("");
const status = ref<{ msg: string; type: string } | null>(null);
const contracts = ref([
  { id: "1", partner: "NX8...abc", stake: "10", progress: 65, daysLeft: 105, status: "active" },
  { id: "2", partner: "NY2...def", stake: "5", progress: 100, daysLeft: 0, status: "active" },
  { id: "3", partner: "NZ9...ghi", stake: "15", progress: 20, daysLeft: 240, status: "broken" },
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

const breakContract = async (contract: any) => {
  status.value = { msg: t("contractBroken"), type: "error" };
  contract.status = "broken";
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

// ============================================
// LAYOUT
// ============================================

.app-container {
  display: flex;
  flex-direction: column;
  padding: $space-4;
  min-height: 100vh;
}

// ============================================
// HEADER WITH HEART ANIMATION
// ============================================

.header {
  text-align: center;
  margin-bottom: $space-6;
  position: relative;
}

.heart-icon {
  position: relative;
  display: inline-block;
  margin-bottom: $space-3;
  height: 60px;
  width: 60px;
}

.heart {
  font-size: 48px;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  animation: heartbeat 1.5s ease-in-out infinite;
}

.broken-heart {
  font-size: 48px;
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  animation: fadeInOut 3s ease-in-out infinite;
}

@keyframes heartbeat {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(1.1);
  }
}

@keyframes fadeInOut {
  0%,
  40%,
  100% {
    opacity: 0;
  }
  50%,
  90% {
    opacity: 1;
  }
}

.title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  color: var(--brutal-pink);
  text-transform: uppercase;
  letter-spacing: 1px;
  display: block;
}

.subtitle {
  color: var(--text-secondary);
  font-size: $font-size-sm;
  margin-top: $space-2;
  display: block;
}

// ============================================
// STATUS MESSAGES
// ============================================

.status-msg {
  text-align: center;
  padding: $space-3;
  border-radius: $radius-md;
  margin-bottom: $space-4;
  border: $border-width-md solid;
  font-weight: $font-weight-semibold;

  &.success {
    background: color-mix(in srgb, var(--status-success) 15%, transparent);
    color: var(--status-success);
    border-color: var(--status-success);
  }

  &.error {
    background: color-mix(in srgb, var(--status-error) 15%, transparent);
    color: var(--status-error);
    border-color: var(--status-error);
  }
}

// ============================================
// TAB CONTENT
// ============================================

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

// ============================================
// CONTRACT DOCUMENT STYLING
// ============================================

.contract-document {
  background: var(--bg-card);
  border: $border-width-lg solid var(--border-color);
  border-radius: $radius-lg;
  padding: $space-6;
  box-shadow: $shadow-lg;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 8px;
    background: repeating-linear-gradient(
      90deg,
      var(--brutal-pink) 0px,
      var(--brutal-pink) 10px,
      transparent 10px,
      transparent 20px
    );
  }
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-5;
  padding-bottom: $space-4;
  border-bottom: $border-width-md dashed var(--border-color);
}

.document-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--brutal-pink);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.document-seal {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--brutal-pink);
  display: flex;
  align-items: center;
  justify-content: center;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
}

.seal-text {
  font-size: 24px;
}

.document-body {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.document-clause {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  line-height: $line-height-relaxed;
  font-style: italic;
  padding: $space-3;
  background: rgba(255, 255, 255, 0.03);
  border-left: $border-width-md solid var(--brutal-pink);
  border-radius: $radius-sm;
}

// ============================================
// FORM STYLING
// ============================================

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.form-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.contract-input {
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
  background: var(--bg-secondary);
}

// ============================================
// SIGNATURE SECTION WITH ANIMATION
// ============================================

.signature-section {
  margin-top: $space-4;
  padding-top: $space-4;
  border-top: $border-width-md dashed var(--border-color);
}

.signature-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: var(--text-secondary);
  display: block;
  margin-bottom: $space-2;
}

.signature-line {
  position: relative;
  padding: $space-3;
  border-bottom: $border-width-md solid var(--brutal-pink);
  min-height: 40px;
  display: flex;
  align-items: center;

  &::after {
    content: "✍️";
    position: absolute;
    right: 0;
    bottom: 0;
    font-size: 20px;
    animation: signatureFloat 2s ease-in-out infinite;
  }
}

@keyframes signatureFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.signature-placeholder {
  font-family: $font-mono;
  font-size: $font-size-sm;
  color: var(--brutal-pink);
  font-weight: $font-weight-medium;
}

// ============================================
// ACTION BUTTON
// ============================================

.action-btn {
  background: var(--brutal-pink);
  color: var(--neo-white);
  padding: $space-4;
  border-radius: $radius-lg;
  text-align: center;
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
  margin-top: $space-4;
  border: $border-width-md solid var(--neo-black);
  box-shadow: $shadow-md;
  cursor: pointer;
  transition: all $transition-normal;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: 2px 2px 0 var(--neo-black);
  }
}

// ============================================
// CONTRACTS LIST
// ============================================

.contracts-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.section-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--brutal-pink);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $space-2;
}

// ============================================
// CONTRACT CARD
// ============================================

.contract-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-lg;
  padding: $space-5;
  box-shadow: $shadow-md;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    flex: 1;
  min-height: 0;
    background: var(--brutal-pink);
  }
}

// ============================================
// STATUS BADGE
// ============================================

.contract-status-badge {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  border: $border-width-md solid;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  margin-bottom: $space-4;

  &.active {
    background: color-mix(in srgb, var(--neo-green) 15%, transparent);
    border-color: var(--neo-green);
    color: var(--neo-green);
  }

  &.broken {
    background: color-mix(in srgb, var(--brutal-red) 15%, transparent);
    border-color: var(--brutal-red);
    color: var(--brutal-red);
  }
}

.status-icon {
  font-size: 18px;
}

.status-text {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// ============================================
// CONTRACT INFO
// ============================================

.contract-info {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-bottom: $space-4;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

.info-value {
  font-size: $font-size-sm;
  color: var(--text-primary);
  font-weight: $font-weight-semibold;
  font-family: $font-mono;
}

.stake-amount {
  color: var(--brutal-pink);
  font-weight: $font-weight-bold;
}

// ============================================
// PROGRESS SECTION WITH HEART ANIMATION
// ============================================

.contract-progress-section {
  margin-bottom: $space-4;
}

.progress-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
  display: block;
  margin-bottom: $space-2;
}

.progress-track {
  height: 12px;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  border-radius: $radius-md;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, var(--brutal-pink), var(--brutal-red));
  transition: width $transition-slow;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.progress-heart {
  font-size: 16px;
  margin-right: -8px;
  animation: heartPulse 1s ease-in-out infinite;
}

@keyframes heartPulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

// ============================================
// CONTRACT ACTIONS
// ============================================

.contract-actions {
  display: flex;
  gap: $space-3;
  margin-top: $space-4;
}

.claim-btn,
.break-btn {
  flex: 1;
  padding: $space-3;
  border-radius: $radius-md;
  text-align: center;
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  border: $border-width-md solid;
  cursor: pointer;
  transition: all $transition-normal;
}

.claim-btn {
  background: var(--neo-green);
  color: var(--neo-black);
  border-color: var(--neo-black);
  box-shadow: 3px 3px 0 var(--neo-black);

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--neo-black);
  }
}

.break-btn {
  background: var(--brutal-red);
  color: var(--neo-white);
  border-color: var(--neo-black);
  box-shadow: 3px 3px 0 var(--neo-black);

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--neo-black);
  }
}
</style>
