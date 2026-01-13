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

    <view class="app-container">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <view v-if="activeTab === 'proposals'" class="tab-content">
        <NeoCard variant="erobo-neo">
          <NeoStats :stats="statsData" />
        </NeoCard>

        <NeoCard :title="t('yourMasks')" variant="erobo">
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
        <NeoCard :title="t('proposals')" variant="erobo">
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
  docSubtitle: {
    en: "Anonymous governance voting with cryptographic identity masks",
    zh: "使用加密身份面具的匿名治理投票",
  },
  docDescription: {
    en: "Masquerade DAO enables truly anonymous on-chain voting. Create cryptographic masks to participate in governance without revealing your identity, while maintaining vote integrity through zero-knowledge proofs.",
    zh: "Masquerade DAO 实现真正的链上匿名投票。创建加密面具参与治理而不暴露身份，同时通过零知识证明保持投票完整性。",
  },
  step1: {
    en: "Connect your Neo wallet and create a cryptographic mask identity",
    zh: "连接您的 Neo 钱包并创建加密面具身份",
  },
  step2: {
    en: "Browse active proposals and review their details",
    zh: "浏览活跃提案并查看详情",
  },
  step3: {
    en: "Cast your vote anonymously using your mask - votes are encrypted",
    zh: "使用面具匿名投票 - 投票已加密",
  },
  step4: {
    en: "Results are revealed after voting ends, maintaining voter privacy",
    zh: "投票结束后揭晓结果，同时保护投票者隐私",
  },
  feature1Name: { en: "Anonymous Voting", zh: "匿名投票" },
  feature1Desc: {
    en: "Cryptographic masks hide your identity while preserving vote validity.",
    zh: "加密面具隐藏您的身份，同时保持投票有效性。",
  },
  feature2Name: { en: "Delayed Reveal", zh: "延迟揭晓" },
  feature2Desc: {
    en: "Vote results are encrypted until the reveal time to prevent vote manipulation.",
    zh: "投票结果在揭晓时间前保持加密，防止投票操纵。",
  },
  wrongChain: { en: "Wrong Chain", zh: "链错误" },
  wrongChainMessage: {
    en: "This app requires Neo N3. Please switch networks.",
    zh: "此应用需要 Neo N3 网络，请切换网络。",
  },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-masqueradedao";
const { address, connect, chainType, switchChain } = useWallet() as any;

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
  { label: t("active"), value: proposals.value },
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
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border-radius: 99px;
  font-weight: 700;
  text-transform: uppercase;
  font-size: 10px;
  margin-bottom: $space-4;
  backdrop-filter: blur(10px);
  
  &.success {
    background: rgba(0, 229, 153, 0.1);
    border: 1px solid rgba(0, 229, 153, 0.3);
    color: #00e599;
  }
  &.error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
  &.loading {
    background: rgba(255, 222, 10, 0.1);
    border: 1px solid rgba(255, 222, 10, 0.3);
    color: #ffde59;
  }
}

.masks-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $space-4;
  margin-bottom: $space-4;
}

.mask-item {
  padding: $space-4;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  text-align: center;
  cursor: pointer;
  position: relative;
  transition: all $transition-fast;
  color: white;
  
  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-2px);
  }
  
  &.active {
    background: rgba(159, 157, 243, 0.1);
    border-color: rgba(159, 157, 243, 0.3);
    box-shadow: 0 0 20px rgba(159, 157, 243, 0.2);
    transform: translateY(-2px);
  }
}

.mask-icon-wrapper {
  position: relative;
  margin-bottom: $space-2;
}
.mask-icon {
  font-size: 40px;
  display: block;
  z-index: 2;
  position: relative;
}
.mask-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  background: var(--neo-purple);
  filter: blur(15px);
  opacity: 0;
  transition: opacity 0.3s;
}
.mask-item.active .mask-glow {
  opacity: 0.4;
}

.mask-name {
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  display: block;
  margin-bottom: 4px;
  color: white;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 4px;
}
.mask-power-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.mask-power {
  font-family: $font-mono;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}
.mask-encrypted {
  font-size: 10px;
  opacity: 0.6;
}

.proposals-list {
  display: flex;
  flex-direction: column;
  gap: $space-5;
}

.proposal-item {
  padding: $space-5;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  color: white;
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-3;
}
.proposal-id {
  font-family: $font-mono;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
}
.proposal-status {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(159, 157, 243, 0.1);
  border: 1px solid rgba(159, 157, 243, 0.2);
  padding: 2px 8px;
  border-radius: 99px;
  color: #9f9df3;
}
.status-text {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.proposal-title {
  font-weight: $font-weight-black;
  font-size: 18px;
  line-height: 1.2;
  margin-bottom: $space-4;
  display: block;
}

.proposal-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: $space-4;
  padding: $space-3;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: white;
}

.meta-label {
  font-size: 8px;
  font-weight: $font-weight-black;
  opacity: 0.6;
  text-transform: uppercase;
}
.meta-value {
  font-weight: $font-weight-black;
  font-family: $font-mono;
  font-size: 12px;
}
.meta-value.encrypted {
  background: black;
  color: black;
}

.vote-visualization {
  margin-bottom: $space-4;
}
.vote-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 99px;
  margin-bottom: 8px;
  overflow: hidden;
  border: none;
}
.vote-bar-fill {
  height: 100%;
  background: #00e599;
  border-radius: 99px;
  box-shadow: 0 0 10px rgba(0, 229, 153, 0.4);
  border: none;
}

.vote-counts {
  display: flex;
  justify-content: space-between;
}
.vote-count {
  font-size: 10px;
  font-weight: $font-weight-black;
  font-family: $font-mono;
}

.vote-options {
  display: flex;
  gap: $space-3;
}
.vote-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.anonymity-notice {
  margin-top: $space-4;
  padding: $space-3;
  background: rgba(159, 157, 243, 0.1);
  border: 1px solid rgba(159, 157, 243, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #9f9df3;
}
.notice-text {
  font-size: 9px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
