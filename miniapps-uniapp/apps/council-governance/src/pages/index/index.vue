<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Active Proposals Tab -->
    <view v-if="activeTab === 'active'" class="tab-content">
      <!-- Voting Power Card -->
      <view class="voting-power-card">
        <view class="power-header">
          <text class="power-label">{{ t("yourVotingPower") }}</text>
          <text class="power-value">{{ votingPower }}</text>
        </view>
        <view class="power-subtext">
          <text>{{ t("councilMember") }}: {{ isCandidate ? t("yes") : t("no") }}</text>
        </view>
      </view>

      <view v-if="!isCandidate" class="warning-banner">
        <text>{{ t("notCandidate") }}</text>
      </view>

      <view class="action-bar">
        <NeoButton variant="primary" size="md" block @click="showCreateModal = true">
          + {{ t("createProposal") }}
        </NeoButton>
      </view>

      <view v-if="activeProposals.length === 0" class="empty-state">
        <text>{{ t("noActiveProposals") }}</text>
      </view>

      <view v-for="p in activeProposals" :key="p.id" class="proposal-card" @click="selectProposal(p)">
        <view class="proposal-header">
          <view class="proposal-meta">
            <text :class="['proposal-type', p.type === 1 && 'policy']">
              {{ p.type === 0 ? t("textType") : t("policyType") }}
            </text>
            <text class="proposal-id">#{{ p.id }}</text>
          </view>
          <text class="proposal-countdown">{{ formatCountdown(p.expiryTime) }}</text>
        </view>

        <text class="proposal-title">{{ p.title }}</text>

        <!-- Quorum Progress -->
        <view class="quorum-section">
          <view class="quorum-header">
            <text class="quorum-label">{{ t("quorum") }}</text>
            <text class="quorum-percent">{{ getQuorumPercent(p) }}%</text>
          </view>
          <view class="quorum-bar">
            <view class="quorum-progress" :style="{ width: getQuorumPercent(p) + '%' }"></view>
          </view>
        </view>

        <!-- Vote Distribution -->
        <view class="vote-distribution">
          <view class="vote-bar">
            <view class="yes-bar" :style="{ width: getYesPercent(p) + '%' }"></view>
            <view class="no-bar" :style="{ width: getNoPercent(p) + '%' }"></view>
          </view>
          <view class="vote-stats">
            <view class="vote-stat">
              <text class="vote-label yes">{{ t("for") }}</text>
              <text class="vote-count yes">{{ p.yesVotes }}</text>
            </view>
            <view class="vote-stat">
              <text class="vote-label abstain">{{ t("abstain") }}</text>
              <text class="vote-count abstain">{{ p.abstainVotes || 0 }}</text>
            </view>
            <view class="vote-stat">
              <text class="vote-label no">{{ t("against") }}</text>
              <text class="vote-count no">{{ p.noVotes }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- History Tab -->
    <view v-if="activeTab === 'history'" class="tab-content scrollable">
      <view v-if="historyProposals.length === 0" class="empty-state">
        <text>{{ t("noHistory") }}</text>
      </view>
      <view v-for="p in historyProposals" :key="p.id" class="proposal-card" @click="selectProposal(p)">
        <view class="proposal-header">
          <view class="proposal-meta">
            <text :class="['status-badge', getStatusClass(p.status)]">{{ getStatusText(p.status) }}</text>
            <text class="proposal-id">#{{ p.id }}</text>
          </view>
        </view>
        <text class="proposal-title">{{ p.title }}</text>
        <view class="vote-distribution">
          <view class="vote-stats">
            <view class="vote-stat">
              <text class="vote-label yes">{{ t("for") }}</text>
              <text class="vote-count yes">{{ p.yesVotes }}</text>
            </view>
            <view class="vote-stat">
              <text class="vote-label abstain">{{ t("abstain") }}</text>
              <text class="vote-count abstain">{{ p.abstainVotes || 0 }}</text>
            </view>
            <view class="vote-stat">
              <text class="vote-label no">{{ t("against") }}</text>
              <text class="vote-count no">{{ p.noVotes }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Proposal Details Modal -->
    <view v-if="selectedProposal" class="modal-overlay" @click.self="selectedProposal = null">
      <view class="modal-content proposal-modal">
        <view class="modal-header">
          <text class="modal-title">{{ t("proposalDetails") }}</text>
          <view class="close-btn" @click="selectedProposal = null">
            <text>×</text>
          </view>
        </view>

        <view class="proposal-detail-content">
          <view class="detail-header">
            <text :class="['proposal-type', selectedProposal.type === 1 && 'policy']">
              {{ selectedProposal.type === 0 ? t("textType") : t("policyType") }}
            </text>
            <text class="proposal-id">#{{ selectedProposal.id }}</text>
          </view>

          <text class="detail-title">{{ selectedProposal.title }}</text>
          <text class="detail-description">{{ selectedProposal.description }}</text>

          <!-- Timeline -->
          <view class="timeline-section">
            <text class="section-label">{{ t("timeline") }}</text>
            <view class="timeline-item">
              <view class="timeline-dot active"></view>
              <text class="timeline-text">{{ t("proposalCreated") }}</text>
            </view>
            <view class="timeline-item">
              <view class="timeline-dot" :class="{ active: selectedProposal.status >= 2 }"></view>
              <text class="timeline-text"
                >{{ t("votingEnds") }}: {{ formatCountdown(selectedProposal.expiryTime) }}</text
              >
            </view>
            <view class="timeline-item">
              <view class="timeline-dot" :class="{ active: selectedProposal.status === 6 }"></view>
              <text class="timeline-text">{{ t("execution") }}</text>
            </view>
          </view>

          <!-- Voting Section -->
          <view v-if="selectedProposal.status === 1" class="voting-section">
            <text class="section-label">{{ t("castYourVote") }}</text>
            <view class="vote-buttons">
              <view class="vote-btn for" @click="castVote(selectedProposal.id, 'for')">
                <text class="vote-btn-label">{{ t("for") }}</text>
                <text class="vote-btn-count">{{ selectedProposal.yesVotes }}</text>
              </view>
              <view class="vote-btn abstain" @click="castVote(selectedProposal.id, 'abstain')">
                <text class="vote-btn-label">{{ t("abstain") }}</text>
                <text class="vote-btn-count">{{ selectedProposal.abstainVotes || 0 }}</text>
              </view>
              <view class="vote-btn against" @click="castVote(selectedProposal.id, 'against')">
                <text class="vote-btn-label">{{ t("against") }}</text>
                <text class="vote-btn-count">{{ selectedProposal.noVotes }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Create Modal -->
    <view v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <view class="modal-content">
        <text class="modal-title">{{ t("createProposal") }}</text>
        <view class="form-group">
          <text class="form-label">{{ t("proposalType") }}</text>
          <view class="type-selector">
            <view :class="['type-btn', newProposal.type === 0 && 'active']" @click="newProposal.type = 0">
              <text>{{ t("textType") }}</text>
            </view>
            <view :class="['type-btn', newProposal.type === 1 && 'active']" @click="newProposal.type = 1">
              <text>{{ t("policyType") }}</text>
            </view>
          </view>
        </view>
        <view class="form-group">
          <text class="form-label">{{ t("proposalTitle") }}</text>
          <uni-easyinput
            v-model="newProposal.title"
            :placeholder="t('titlePlaceholder')"
            :inputBorder="false"
            class="form-input-wrapper"
          />
        </view>
        <view class="form-group">
          <text class="form-label">{{ t("description") }}</text>
          <uni-easyinput
            type="textarea"
            v-model="newProposal.description"
            :placeholder="t('descPlaceholder')"
            :inputBorder="false"
            class="form-input-wrapper"
          />
        </view>
        <view class="form-group">
          <text class="form-label">{{ t("duration") }}</text>
          <view class="duration-selector">
            <view
              v-for="d in durations"
              :key="d.value"
              :class="['duration-btn', newProposal.duration === d.value && 'active']"
              @click="newProposal.duration = d.value"
            >
              <text>{{ d.label }}</text>
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <NeoButton variant="secondary" size="md" @click="showCreateModal = false">
            {{ t("cancel") }}
          </NeoButton>
          <NeoButton variant="primary" size="md" @click="createProposal">
            {{ t("submit") }}
          </NeoButton>
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
import { createT } from "@/shared/utils/i18n";
import { formatCountdown } from "@/shared/utils/format";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoDoc from "@/shared/components/NeoDoc.vue";

const translations = {
  title: { en: "Council Governance", zh: "议会治理" },
  active: { en: "Active", zh: "进行中" },
  history: { en: "History", zh: "历史" },
  createProposal: { en: "Create Proposal", zh: "创建提案" },
  noActiveProposals: { en: "No active proposals", zh: "暂无进行中的提案" },
  noHistory: { en: "No history", zh: "暂无历史记录" },
  textType: { en: "Text", zh: "文本" },
  policyType: { en: "Policy Change", zh: "策略变更" },
  yes: { en: "Yes", zh: "赞成" },
  no: { en: "No", zh: "反对" },
  for: { en: "For", zh: "赞成" },
  against: { en: "Against", zh: "反对" },
  abstain: { en: "Abstain", zh: "弃权" },
  notCandidate: { en: "You are not a council member", zh: "您不是议会成员" },
  yourVotingPower: { en: "Your Voting Power", zh: "您的投票权重" },
  councilMember: { en: "Council Member", zh: "议会成员" },
  quorum: { en: "Quorum", zh: "法定人数" },
  proposalDetails: { en: "Proposal Details", zh: "提案详情" },
  timeline: { en: "Timeline", zh: "时间线" },
  proposalCreated: { en: "Proposal Created", zh: "提案创建" },
  votingEnds: { en: "Voting Ends", zh: "投票结束" },
  execution: { en: "Execution", zh: "执行" },
  castYourVote: { en: "Cast Your Vote", zh: "投出您的一票" },
  proposalType: { en: "Type", zh: "类型" },
  proposalTitle: { en: "Title", zh: "标题" },
  description: { en: "Description", zh: "描述" },
  duration: { en: "Duration", zh: "有效期" },
  titlePlaceholder: { en: "Enter proposal title", zh: "输入提案标题" },
  descPlaceholder: { en: "Enter proposal description", zh: "输入提案描述" },
  cancel: { en: "Cancel", zh: "取消" },
  submit: { en: "Submit", zh: "提交" },
  passed: { en: "Passed", zh: "已通过" },
  rejected: { en: "Rejected", zh: "已拒绝" },
  revoked: { en: "Revoked", zh: "已撤销" },
  expired: { en: "Expired", zh: "已过期" },
  executed: { en: "Executed", zh: "已执行" },

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

const navTabs = [
  { id: "active", icon: "vote", label: t("active") },
  { id: "history", icon: "history", label: t("history") },
  { id: "docs", icon: "book", label: t("docs") },
];
const activeTab = ref("active");

const isCandidate = ref(true);
const showCreateModal = ref(false);
const selectedProposal = ref<Proposal | null>(null);
const votingPower = ref(100);
const quorumThreshold = 10; // Minimum votes needed

interface Proposal {
  id: number;
  type: number;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes?: number;
  expiryTime: number;
  status: number;
}

const activeProposals = ref<Proposal[]>([
  {
    id: 1,
    type: 0,
    title: "Increase validator rewards",
    description: "Proposal to increase validator rewards by 10% to incentivize network security.",
    yesVotes: 5,
    noVotes: 2,
    abstainVotes: 1,
    expiryTime: Date.now() + 86400000,
    status: 1,
  },
]);

const historyProposals = ref<Proposal[]>([
  {
    id: 0,
    type: 1,
    title: "Update fee structure",
    description: "Change fee distribution to better align with network costs.",
    yesVotes: 8,
    noVotes: 1,
    abstainVotes: 0,
    expiryTime: Date.now() - 86400000,
    status: 2,
  },
]);

const durations = [
  { label: "3 Days", value: 259200000 },
  { label: "7 Days", value: 604800000 },
  { label: "14 Days", value: 1209600000 },
];

const newProposal = ref({
  type: 0,
  title: "",
  description: "",
  duration: 604800000,
});

const getYesPercent = (p: Proposal) => {
  const total = p.yesVotes + p.noVotes + (p.abstainVotes || 0);
  return total > 0 ? (p.yesVotes / total) * 100 : 0;
};

const getNoPercent = (p: Proposal) => {
  const total = p.yesVotes + p.noVotes + (p.abstainVotes || 0);
  return total > 0 ? (p.noVotes / total) * 100 : 0;
};

const getQuorumPercent = (p: Proposal) => {
  const totalVotes = p.yesVotes + p.noVotes + (p.abstainVotes || 0);
  return Math.min((totalVotes / quorumThreshold) * 100, 100);
};

const getStatusClass = (status: number) => {
  const classes: Record<number, string> = { 2: "passed", 3: "rejected", 4: "revoked", 5: "expired", 6: "executed" };
  return classes[status] || "";
};

const getStatusText = (status: number) => {
  const texts: Record<number, string> = {
    2: t("passed"),
    3: t("rejected"),
    4: t("revoked"),
    5: t("expired"),
    6: t("executed"),
  };
  return texts[status] || "";
};

const selectProposal = (p: Proposal) => {
  selectedProposal.value = p;
};

const castVote = (proposalId: number, voteType: "for" | "against" | "abstain") => {
  console.log(`Casting ${voteType} vote for proposal ${proposalId}`);
  // TODO: Implement actual voting logic
  selectedProposal.value = null;
};

const createProposal = () => {
  console.log("Creating proposal:", newProposal.value);
  showCreateModal.value = false;
};

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: 12px;
  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

// Voting Power Card
.voting-power-card {
  background: var(--neo-purple);
  border: $border-width-lg solid $neo-black;
  box-shadow: $shadow-lg;
  padding: $space-5;
  margin-bottom: $space-4;
}

.power-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.power-label {
  font-size: $font-size-sm;
  color: $neo-white;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.power-value {
  font-size: $font-size-3xl;
  color: $neo-white;
  font-weight: $font-weight-black;
}

.power-subtext {
  font-size: $font-size-xs;
  color: rgba(255, 255, 255, 0.8);
  font-weight: $font-weight-medium;
}

.warning-banner {
  background: var(--brutal-yellow);
  color: $neo-black;
  padding: $space-4;
  border: $border-width-md solid $neo-black;
  box-shadow: $shadow-sm;
  text-align: center;
  margin-bottom: $space-3;
  font-weight: $font-weight-bold;
}

.action-bar {
  margin-bottom: $space-3;
}

.empty-state {
  text-align: center;
  color: var(--text-secondary);
  padding: $space-10 $space-5;
  font-weight: $font-weight-medium;
}

.proposal-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin-bottom: $space-3;
  transition: transform $transition-fast;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: $shadow-sm;
  }
}

.proposal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $space-3;
}

.proposal-meta {
  display: flex;
  gap: $space-2;
  align-items: center;
}

.proposal-type {
  font-size: $font-size-xs;
  color: $neo-black;
  background: var(--neo-green);
  padding: $space-1 $space-2;
  border: 2px solid $neo-black;
  font-weight: $font-weight-bold;
  text-transform: uppercase;

  &.policy {
    background: var(--neo-purple);
    color: $neo-white;
  }
}

.proposal-id {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
  font-family: monospace;
}

.proposal-countdown {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-semibold;
}

.proposal-title {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  display: block;
  margin-bottom: $space-3;
  line-height: $line-height-tight;
}

// Quorum Section
.quorum-section {
  margin-bottom: $space-3;
}

.quorum-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-2;
}

.quorum-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
}

.quorum-percent {
  font-size: $font-size-sm;
  color: var(--text-primary);
  font-weight: $font-weight-black;
}

.quorum-bar {
  height: 6px;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  overflow: hidden;
}

.quorum-progress {
  flex: 1;
  min-height: 0;
  background: var(--neo-purple);
  transition: width $transition-normal;
}

// Vote Distribution
.vote-distribution {
  margin-top: $space-3;
}

.vote-bar {
  height: 12px;
  background: var(--bg-secondary);
  border: 2px solid $neo-black;
  margin-bottom: $space-3;
  overflow: hidden;
  display: flex;
}

.yes-bar {
  flex: 1;
  min-height: 0;
  background: var(--neo-green);
  border-right: 2px solid $neo-black;
  transition: width $transition-normal;
}

.no-bar {
  flex: 1;
  min-height: 0;
  background: var(--brutal-red);
  transition: width $transition-normal;
}

.vote-stats {
  display: flex;
  justify-content: space-between;
  gap: $space-2;
}

.vote-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.vote-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  margin-bottom: $space-1;

  &.yes {
    color: var(--neo-green);
  }

  &.no {
    color: var(--brutal-red);
  }

  &.abstain {
    color: var(--text-secondary);
  }
}

.vote-count {
  font-size: $font-size-lg;
  font-weight: $font-weight-black;

  &.yes {
    color: var(--neo-green);
  }

  &.no {
    color: var(--brutal-red);
  }

  &.abstain {
    color: var(--text-secondary);
  }
}

.status-badge {
  font-size: $font-size-xs;
  padding: $space-1 $space-2;
  border: 2px solid $neo-black;
  font-weight: $font-weight-bold;
  text-transform: uppercase;

  &.passed {
    background: var(--status-success);
    color: $neo-black;
  }
  &.rejected {
    background: var(--status-error);
    color: $neo-white;
  }
  &.revoked {
    background: var(--brutal-yellow);
    color: $neo-black;
  }
  &.expired {
    background: var(--text-secondary);
    color: $neo-white;
  }
  &.executed {
    background: var(--neo-purple);
    color: $neo-white;
  }
}

.modal-overlay {
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
}

.modal-content {
  background: var(--bg-secondary);
  border: $border-width-lg solid var(--border-color);
  box-shadow: $shadow-xl;
  padding: $space-6;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
    -webkit-overflow-scrolling: touch;

  &.proposal-modal {
    max-width: 500px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $space-4;
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  font-size: 24px;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  cursor: pointer;
  transition: all $transition-fast;

  &:active {
    transform: translate(2px, 2px);
  }
}

.modal-title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  display: block;
  margin-bottom: $space-5;
  text-transform: uppercase;
}

.form-group {
  margin-bottom: $space-4;
}

.form-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  display: block;
  margin-bottom: $space-2;
  font-weight: $font-weight-semibold;
  text-transform: uppercase;
}

.form-input,
.form-textarea {
  width: 100%;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  padding: $space-3;
  color: var(--text-primary);
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
}

.form-textarea {
  min-height: 80px;
}

.type-selector,
.duration-selector {
  display: flex;
  gap: $space-2;
}

.type-btn,
.duration-btn {
  flex: 1;
  padding: $space-3;
  text-align: center;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  transition: all $transition-fast;

  &.active {
    background: var(--neo-green);
    border-color: $neo-black;
    color: $neo-black;
    box-shadow: $shadow-sm;
  }
}

.modal-actions {
  display: flex;
  gap: $space-3;
  margin-top: $space-5;
}

.form-input-wrapper {
  ::v-deep .uni-easyinput__content {
    background-color: var(--bg-card) !important;
    border: $border-width-md solid var(--border-color) !important;
    color: var(--text-primary) !important;
  }
  ::v-deep .uni-easyinput__content-input {
    color: var(--text-primary) !important;
    font-weight: $font-weight-medium !important;
  }
  ::v-deep textarea {
    color: var(--text-primary) !important;
    font-weight: $font-weight-medium !important;
  }
}

// Proposal Details Modal
.proposal-detail-content {
  margin-top: $space-4;
}

.detail-header {
  display: flex;
  gap: $space-2;
  align-items: center;
  margin-bottom: $space-3;
}

.detail-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  display: block;
  margin-bottom: $space-3;
  line-height: $line-height-tight;
}

.detail-description {
  font-size: $font-size-base;
  color: var(--text-secondary);
  line-height: $line-height-relaxed;
  display: block;
  margin-bottom: $space-5;
}

// Timeline Section
.timeline-section {
  margin-bottom: $space-5;
  padding: $space-4;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
}

.section-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  display: block;
  margin-bottom: $space-3;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-3;

  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border: $border-width-sm solid var(--border-color);
  background: var(--bg-secondary);
  flex-shrink: 0;

  &.active {
    background: var(--neo-purple);
    border-color: $neo-black;
    box-shadow: 0 0 10px rgba(102, 0, 238, 0.4);
  }
}

.timeline-text {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

// Voting Section
.voting-section {
  padding: $space-4;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
}

.vote-buttons {
  display: flex;
  gap: $space-3;
}

.vote-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  background: var(--bg-secondary);
  box-shadow: $shadow-sm;
  transition: all $transition-fast;
  cursor: pointer;

  &:active {
    transform: translate(2px, 2px);
  }

  &.for {
    border-color: var(--neo-green);
    &:active {
      background: var(--neo-green);
      .vote-btn-label {
        color: $neo-black;
      }
    }
  }

  &.against {
    border-color: var(--brutal-red);
    &:active {
      background: var(--brutal-red);
      .vote-btn-label {
        color: $neo-white;
      }
    }
  }

  &.abstain {
    border-color: var(--text-secondary);
    &:active {
      background: var(--text-secondary);
      .vote-btn-label {
        color: $neo-white;
      }
    }
  }
}

.vote-btn-label {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: $space-2;
}

.vote-btn-count {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
}
</style>
