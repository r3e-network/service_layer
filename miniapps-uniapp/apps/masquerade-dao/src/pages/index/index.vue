<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <view v-if="activeTab === 'proposals'" class="tab-content">
        <NeoCard>
          <NeoStats :stats="statsData" />
        </NeoCard>

        <NeoCard :title="t('yourMasks')">
          <view class="masks-grid">
            <view
              v-for="(mask, i) in masks"
              :key="i"
              :class="['mask-item', selectedMask === i && 'active']"
              @click="selectedMask = i"
            >
              <view class="mask-icon-wrapper">
                <text class="mask-icon">{{ mask.icon }}</text>
                <view class="mask-glow"></view>
              </view>
              <text class="mask-name">{{ mask.name }}</text>
              <view class="mask-power-wrapper">
                <text class="mask-power">{{ mask.power }} VP</text>
                <text class="mask-encrypted">🔒</text>
              </view>
            </view>
          </view>
          <template #footer>
            <NeoButton variant="secondary" block @click="createMask" :loading="isLoading">
              {{ t("createNewMask") }}
            </NeoButton>
          </template>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'vote'" class="tab-content">
        <NeoCard :title="t('proposals')">
          <view class="proposals-list">
            <view v-for="(p, i) in proposalsList" :key="i" class="proposal-item">
              <view class="proposal-header">
                <view class="proposal-id">#{p.id}</view>
                <view class="proposal-status">
                  <text class="status-icon">🎭</text>
                  <text class="status-text">{{ t("anonymous") }}</text>
                </view>
              </view>

              <text class="proposal-title">{{ p.title }}</text>

              <view class="proposal-meta">
                <view class="meta-item">
                  <text class="meta-label">{{ t("totalVotes") }}</text>
                  <text class="meta-value encrypted">███</text>
                </view>
                <view class="meta-item">
                  <text class="meta-label">{{ t("revealIn") }}</text>
                  <text class="meta-value countdown">{{ p.revealTime }}</text>
                </view>
              </view>

              <view class="vote-visualization">
                <view class="vote-bar">
                  <view
                    class="vote-bar-fill for"
                    :style="{ width: getVotePercentage(p.forVotes, p.againstVotes) + '%' }"
                  ></view>
                </view>
                <view class="vote-counts">
                  <text class="vote-count for">{{ p.forVotes }}</text>
                  <text class="vote-count against">{{ p.againstVotes }}</text>
                </view>
              </view>

              <view class="vote-options">
                <NeoButton
                  variant="primary"
                  size="sm"
                  @click="vote(p.id, true)"
                  :loading="isLoading"
                  class="vote-btn for-btn"
                >
                  <text class="vote-icon">✓</text>
                  {{ t("for") }}
                </NeoButton>
                <NeoButton
                  variant="danger"
                  size="sm"
                  @click="vote(p.id, false)"
                  :loading="isLoading"
                  class="vote-btn against-btn"
                >
                  <text class="vote-icon">✗</text>
                  {{ t("against") }}
                </NeoButton>
              </view>

              <view class="anonymity-notice">
                <text class="notice-icon">🔐</text>
                <text class="notice-text">{{ t("voteEncrypted") }}</text>
              </view>
            </view>
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
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import NeoStats from "@/shared/components/NeoStats.vue";
import type { StatItem } from "@/shared/components/NeoStats.vue";

const translations = {
  title: { en: "Masquerade DAO", zh: "假面DAO" },
  proposals: { en: "Proposals", zh: "提案" },
  vote: { en: "Vote", zh: "投票" },
  masks: { en: "Masks", zh: "面具" },
  rep: { en: "Rep", zh: "声誉" },
  active: { en: "Active", zh: "活跃" },
  yourMasks: { en: "Your Masks", zh: "您的面具" },
  createNewMask: { en: "+ Create New Mask", zh: "+ 创建新面具" },
  for: { en: "For", zh: "支持" },
  against: { en: "Against", zh: "反对" },
  creatingMask: { en: "Creating mask...", zh: "创建面具中..." },
  maskCreated: { en: "Mask created!", zh: "面具已创建！" },
  selectMask: { en: "Select a mask first", zh: "请先选择一个面具" },
  voting: { en: "Voting...", zh: "投票中..." },
  voteCast: { en: "Vote cast!", zh: "投票已提交！" },
  error: { en: "Error", zh: "错误" },
  anonymous: { en: "Anonymous", zh: "匿名" },
  totalVotes: { en: "Total Votes", zh: "总票数" },
  revealIn: { en: "Reveal In", zh: "揭晓倒计时" },
  voteEncrypted: { en: "Your vote is encrypted and anonymous", zh: "您的投票已加密且匿名" },

  docs: { en: "Docs", zh: "文档" },
  docSubtitle: { en: "Learn more about this MiniApp.", zh: "了解更多关于此小程序的信息。" },
  docDescription: {
    en: "Professional documentation for this application is coming soon.",
    zh: "此应用程序的专业文档即将推出。",
  },
  step1: { en: "Open the application.", zh: "打开应用程序。" },
  step2: { en: "Follow the on-screen instructions.", zh: "按照屏幕上的指示操作。" },
  step3: { en: "Enjoy the secure experience!", zh: "享受安全体验！" },
  feature1Name: { en: "TEE Secured", zh: "TEE 安全保护" },
  feature1Desc: { en: "Hardware-level isolation.", zh: "硬件级隔离。" },
  feature2Name: { en: "On-Chain Fairness", zh: "链上公正" },
  feature2Desc: { en: "Provably fair execution.", zh: "可证明公平的执行。" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-masquerade-dao";
const { address, connect } = useWallet();

interface Mask {
  icon: string;
  name: string;
  power: number;
}

interface Proposal {
  id: number;
  title: string;
  forVotes: number;
  againstVotes: number;
  revealTime: string;
}

const { payGAS, isLoading } = usePayments(APP_ID);

const activeTab = ref("proposals");
const navTabs = [
  { id: "proposals", label: t("proposals"), icon: "📋" },
  { id: "vote", label: t("vote"), icon: "🗳️" },
  { id: "docs", icon: "book", label: t("docs") },
];

const maskCount = ref(0);
const reputation = ref(0);
const proposals = ref(0);
const selectedMask = ref(0);
const status = ref<{ msg: string; type: string } | null>(null);
const dataLoading = ref(true);

const masks = ref<Mask[]>([]);

const proposalsList = ref<Proposal[]>([]);

const statsData = computed<StatItem[]>(() => [
  { label: t("masks"), value: maskCount.value, variant: "default" },
  { label: t("rep"), value: reputation.value, variant: "accent" },
  { label: t("active"), value: proposals.value, variant: "default" },
]);

const getVotePercentage = (forVotes: number, againstVotes: number): number => {
  const total = forVotes + againstVotes;
  return total > 0 ? (forVotes / total) * 100 : 50;
};

const createMask = async () => {
  if (isLoading.value) return;
  try {
    status.value = { msg: t("creatingMask"), type: "loading" };
    await payGAS("1", "create-mask");
    maskCount.value++;
    status.value = { msg: t("maskCreated"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const vote = async (id: number, support: boolean) => {
  if (selectedMask.value === null) {
    status.value = { msg: t("selectMask"), type: "error" };
    return;
  }
  try {
    status.value = { msg: t("voting"), type: "loading" };
    await payGAS("0.1", `vote:${id}:${support}`);
    status.value = { msg: t("voteCast"), type: "success" };
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

// Fetch data from contract
const fetchData = async () => {
  try {
    dataLoading.value = true;
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) return;

    const data = (await sdk.invoke("masqueradeDao.getData", { appId: APP_ID })) as {
      masks: Mask[];
      proposals: Proposal[];
      reputation: number;
    } | null;

    if (data) {
      masks.value = data.masks || [];
      proposalsList.value = data.proposals || [];
      maskCount.value = data.masks?.length || 0;
      reputation.value = data.reputation || 0;
      proposals.value = data.proposals?.length || 0;
    }
  } catch (e) {
    console.warn("[MasqueradeDAO] Failed to fetch:", e);
  } finally {
    dataLoading.value = false;
  }
};

onMounted(() => fetchData());
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  display: flex;
  flex-direction: column;
  padding: $space-4;
  min-flex: 1;
  min-height: 0;
  background: var(--bg-primary);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  margin-bottom: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  font-size: $font-size-sm;

  &.success {
    background: var(--status-success);
    color: $neo-black;
    border-color: $neo-black;
  }
  &.error {
    background: var(--status-error);
    color: $neo-white;
    border-color: $neo-black;
  }
  &.loading {
    background: var(--status-warning);
    color: $neo-black;
    border-color: $neo-black;
  }
}

// ============================================
// MASKS SECTION - Mysterious Identity Cards
// ============================================

.masks-grid {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-4;
}

.mask-item {
  flex: 1;
  text-align: center;
  padding: $space-4 $space-2;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  cursor: pointer;
  transition: all $transition-fast;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--neo-purple) 0%, transparent 50%);
    opacity: 0;
    transition: opacity $transition-normal;
  }

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--neo-purple);

    &::before {
      opacity: 0.1;
    }

    .mask-glow {
      opacity: 0.6;
    }
  }

  &:active {
    transform: translate(1px, 1px);
    box-shadow: none;
  }

  &.active {
    border-color: var(--neo-purple);
    box-shadow: 5px 5px 0 var(--neo-purple);
    background: var(--bg-elevated);

    &::before {
      opacity: 0.15;
    }

    .mask-glow {
      opacity: 0.8;
    }
  }
}

.mask-icon-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: $space-2;
}

.mask-icon {
  font-size: $font-size-4xl;
  display: block;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 8px var(--neo-purple));
}

.mask-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, var(--neo-purple) 0%, transparent 70%);
  opacity: 0;
  transition: opacity $transition-normal;
  pointer-events: none;
}

.mask-name {
  color: var(--text-primary);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-2;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.mask-power-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
}

.mask-power {
  color: var(--neo-purple);
  font-size: $font-size-xs;
  font-weight: $font-weight-black;
  font-family: $font-mono;
}

.mask-encrypted {
  font-size: $font-size-xs;
  opacity: 0.6;
}

// ============================================
// PROPOSALS SECTION - Anonymous Voting Cards
// ============================================

.proposals-list {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.proposal-item {
  padding: $space-4;
  background: var(--bg-elevated);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
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
    background: var(--neo-purple);
    opacity: 0.5;
  }
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}

.proposal-id {
  font-family: $font-mono;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  padding: $space-1 $space-2;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
}

.proposal-status {
  display: flex;
  align-items: center;
  gap: $space-1;
  padding: $space-1 $space-2;
  background: var(--neo-purple);
  border: 2px solid var(--border-color);
}

.status-icon {
  font-size: $font-size-sm;
}

.status-text {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: $neo-white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.proposal-title {
  color: var(--text-primary);
  font-weight: $font-weight-bold;
  font-size: $font-size-lg;
  display: block;
  margin-bottom: $space-4;
  line-height: $line-height-normal;
}

.proposal-meta {
  display: flex;
  gap: $space-4;
  margin-bottom: $space-4;
  padding: $space-3;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
}

.meta-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.meta-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: $font-weight-medium;
}

.meta-value {
  font-family: $font-mono;
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: var(--text-primary);

  &.encrypted {
    color: var(--neo-purple);
    letter-spacing: 2px;
  }

  &.countdown {
    color: var(--brutal-yellow);
  }
}

// ============================================
// VOTE VISUALIZATION - Encrypted Progress
// ============================================

.vote-visualization {
  margin-bottom: $space-4;
}

.vote-bar {
  height: 32px;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  position: relative;
  overflow: hidden;
  margin-bottom: $space-2;
}

.vote-bar-fill {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, var(--neo-purple) 0%, var(--brutal-pink) 100%);
  transition: width $transition-slow;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.1) 10px,
      rgba(255, 255, 255, 0.1) 20px
    );
    animation: slide 2s linear infinite;
  }
}

@keyframes slide {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(28px);
  }
}

.vote-counts {
  display: flex;
  justify-content: space-between;
  padding: 0 $space-2;
}

.vote-count {
  font-family: $font-mono;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;

  &.for {
    color: var(--neo-purple);
  }

  &.against {
    color: var(--brutal-pink);
  }
}

// ============================================
// VOTE BUTTONS - Action Controls
// ============================================

.vote-options {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-3;
}

.vote-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
}

.vote-icon {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;
}

// ============================================
// ANONYMITY NOTICE - Security Indicator
// ============================================

.anonymity-notice {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: var(--bg-card);
  border: 2px dashed var(--border-color);
  border-radius: $radius-sm;
}

.notice-icon {
  font-size: $font-size-base;
  opacity: 0.8;
}

.notice-text {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-style: italic;
  flex: 1;
}
</style>
