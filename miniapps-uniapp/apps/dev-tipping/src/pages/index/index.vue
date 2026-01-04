<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'developers' || activeTab === 'send'" class="app-container">
      <view class="header">
        <text class="title">{{ t("title") }}</text>
        <text class="subtitle">{{ t("subtitle") }}</text>
      </view>
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <view v-if="activeTab === 'developers'" class="tab-content">
        <NeoCard :title="t('topDevelopers')" variant="accent">
          <view v-for="dev in developers" :key="dev.id" class="dev-card" @click="selectDev(dev)">
            <view class="dev-card-header">
              <view class="dev-avatar">
                <text class="avatar-emoji">👨‍💻</text>
                <view class="avatar-badge">{{ dev.rank }}</view>
              </view>
              <view class="dev-info">
                <text class="dev-name">{{ dev.name }}</text>
                <text class="dev-projects">
                  <text class="project-icon">📦</text>
                  {{ dev.projects }} {{ t("projects") }}
                </text>
                <text class="dev-contributions">{{ dev.contributions }} {{ t("contributions") }}</text>
              </view>
            </view>
            <view class="dev-card-footer">
              <view class="tip-stats">
                <text class="tip-label">{{ t("totalTips") }}</text>
                <text class="tip-amount">{{ dev.tips }} GAS</text>
              </view>
              <view class="tip-action">
                <text class="tip-icon">💚</text>
              </view>
            </view>
          </view>
        </NeoCard>
      </view>

      <view v-if="activeTab === 'send'" class="tab-content">
        <NeoCard :title="t('sendTip')" variant="accent">
          <view class="form-group">
            <!-- Developer Address -->
            <view class="input-section">
              <text class="input-label">{{ t("developerAddress") }}</text>
              <NeoInput v-model="recipientAddress" :placeholder="t('addressPlaceholder')" />
            </view>

            <!-- Tip Amount with Presets -->
            <view class="input-section">
              <text class="input-label">{{ t("tipAmount") }}</text>
              <view class="preset-amounts">
                <view
                  v-for="preset in presetAmounts"
                  :key="preset"
                  :class="['preset-btn', { active: tipAmount === preset.toString() }]"
                  @click="tipAmount = preset.toString()"
                >
                  <text class="preset-value">{{ preset }}</text>
                  <text class="preset-unit">GAS</text>
                </view>
              </view>
              <NeoInput v-model="tipAmount" type="number" :placeholder="t('customAmount')" suffix="GAS" />
            </view>

            <!-- Optional Message -->
            <view class="input-section">
              <text class="input-label">{{ t("optionalMessage") }}</text>
              <NeoInput v-model="tipMessage" :placeholder="t('messagePlaceholder')" />
            </view>

            <!-- Send Button -->
            <NeoButton variant="primary" size="lg" block :loading="isLoading" @click="sendTip">
              <text v-if="!isLoading">💚 {{ t("sendTipBtn") }}</text>
              <text v-else>{{ t("sending") }}</text>
            </NeoButton>

            <!-- Recent Tips -->
            <view v-if="recentTips.length > 0" class="recent-tips">
              <text class="recent-tips-title">{{ t("recentTips") }}</text>
              <view v-for="tip in recentTips" :key="tip.id" class="recent-tip-item">
                <text class="recent-tip-emoji">✨</text>
                <view class="recent-tip-info">
                  <text class="recent-tip-to">{{ tip.to }}</text>
                  <text class="recent-tip-time">{{ tip.time }}</text>
                </view>
                <text class="recent-tip-amount">{{ tip.amount }} GAS</text>
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
import { ref, computed } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoInput from "@/shared/components/NeoInput.vue";
import NeoCard from "@/shared/components/NeoCard.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Dev Tipping", zh: "开发者打赏" },
  subtitle: { en: "Support developers", zh: "支持开发者" },
  topDevelopers: { en: "Top Developers", zh: "顶级开发者" },
  projects: { en: "projects", zh: "项目" },
  contributions: { en: "contributions", zh: "贡献" },
  totalTips: { en: "Total Tips", zh: "总打赏" },
  sendTip: { en: "Send Tip", zh: "发送打赏" },
  developerAddress: { en: "Developer Address", zh: "开发者地址" },
  addressPlaceholder: { en: "Enter Neo address...", zh: "输入 Neo 地址..." },
  tipAmount: { en: "Tip Amount", zh: "打赏金额" },
  customAmount: { en: "Custom amount...", zh: "自定义金额..." },
  optionalMessage: { en: "Optional Message", zh: "可选消息" },
  messagePlaceholder: { en: "Say thanks...", zh: "说声谢谢..." },
  sending: { en: "Sending...", zh: "发送中..." },
  sendTipBtn: { en: "Send Tip", zh: "发送打赏" },
  selected: { en: "Selected", zh: "已选择" },
  tipSent: { en: "Tip sent successfully!", zh: "打赏发送成功！" },
  error: { en: "Error", zh: "错误" },
  recentTips: { en: "Recent Tips", zh: "最近打赏" },

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
const APP_ID = "miniapp-devtipping";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

const activeTab = ref<string>("developers");
const navTabs: NavTab[] = [
  { id: "developers", label: "Developers", icon: "👨‍💻" },
  { id: "send", label: "Send Tip", icon: "💰" },
  { id: "docs", icon: "book", label: t("docs") },
];

const recipientAddress = ref("");
const tipAmount = ref("");
const tipMessage = ref("");
const status = ref<{ msg: string; type: string } | null>(null);

// Preset tip amounts
const presetAmounts = [5, 10, 25, 50];

// Enhanced developer data
const developers = ref([
  { id: "1", name: "Alice.neo", projects: 12, contributions: 342, tips: "150", rank: "#1" },
  { id: "2", name: "Bob.neo", projects: 8, contributions: 198, tips: "89", rank: "#2" },
  { id: "3", name: "Charlie.neo", projects: 5, contributions: 127, tips: "45", rank: "#3" },
]);

// Recent tips history
const recentTips = ref([
  { id: "1", to: "Alice.neo", amount: "10", time: "2 mins ago" },
  { id: "2", to: "Bob.neo", amount: "5", time: "1 hour ago" },
]);

const selectDev = (dev: any) => {
  recipientAddress.value = `N${dev.name.slice(0, 3)}...xyz`;
  status.value = { msg: `${t("selected")} ${dev.name}`, type: "success" };
  activeTab.value = "send";
};

const sendTip = async () => {
  if (!recipientAddress.value || !tipAmount.value || isLoading.value) return;
  try {
    await payGAS(tipAmount.value, `tip:${recipientAddress.value.slice(0, 10)}`);

    // Add to recent tips
    const devName =
      developers.value.find((d) => recipientAddress.value.includes(d.name.slice(0, 3)))?.name || "Developer";
    recentTips.value.unshift({
      id: Date.now().toString(),
      to: devName,
      amount: tipAmount.value,
      time: "Just now",
    });
    if (recentTips.value.length > 5) recentTips.value.pop();

    status.value = { msg: t("tipSent"), type: "success" };
    recipientAddress.value = "";
    tipAmount.value = "";
    tipMessage.value = "";
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
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
}

.header {
  text-align: center;
  margin-bottom: $space-4;
}

.title {
  font-size: $font-size-2xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: $font-size-base;
  margin-top: $space-2;
  font-weight: $font-weight-medium;
}
.status-msg {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;

  &.success {
    background: var(--status-success);
    color: var(--neo-black);
    border-color: var(--neo-black);
    box-shadow: 5px 5px 0 var(--neo-black);
  }

  &.error {
    background: var(--status-error);
    color: var(--neo-white);
    border-color: var(--neo-black);
    box-shadow: 5px 5px 0 var(--neo-black);
  }
}
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

// Developer Card Styles
.dev-card {
  display: flex;
  flex-direction: column;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: 4px 4px 0 var(--neo-green);
  margin-bottom: $space-4;
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--neo-green);
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--neo-green);
  }
}

.dev-card-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: $space-3;
}

.dev-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: var(--neo-purple);
  border: $border-width-md solid var(--border-color);
  margin-right: $space-3;
  flex-shrink: 0;
}

.avatar-emoji {
  font-size: $font-size-3xl;
}

.avatar-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--brutal-yellow);
  color: var(--neo-black);
  font-size: $font-size-xs;
  font-weight: $font-weight-black;
  padding: 2px 6px;
  border: $border-width-sm solid var(--neo-black);
}

.dev-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.dev-name {
  font-weight: $font-weight-black;
  font-size: $font-size-xl;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.dev-projects,
.dev-contributions {
  display: flex;
  align-items: center;
  gap: $space-1;
  color: var(--text-secondary);
  font-size: $font-size-sm;
  font-weight: $font-weight-medium;
}

.project-icon {
  font-size: $font-size-base;
}

.dev-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: $space-3;
  border-top: $border-width-sm solid var(--border-color);
}

.tip-stats {
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.tip-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tip-amount {
  color: var(--neo-green);
  font-weight: $font-weight-black;
  font-size: $font-size-2xl;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
}

.tip-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--neo-green);
  border: $border-width-md solid var(--border-color);
}

.tip-icon {
  font-size: $font-size-2xl;
}

// Form Styles
.input-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.input-label {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.preset-amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $space-2;
  margin-bottom: $space-2;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  cursor: pointer;
  transition: all $transition-fast;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 var(--border-color);
  }

  &:active {
    transform: translateY(0);
    box-shadow: none;
  }

  &.active {
    background: var(--neo-green);
    border-color: var(--neo-black);
    box-shadow: 3px 3px 0 var(--neo-black);

    .preset-value,
    .preset-unit {
      color: var(--neo-black);
    }
  }
}

.preset-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--text-primary);
}

.preset-unit {
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  color: var(--text-secondary);
  text-transform: uppercase;
  margin-top: $space-1;
}

// Recent Tips Styles
.recent-tips {
  margin-top: $space-6;
  padding-top: $space-4;
  border-top: $border-width-md solid var(--border-color);
}

.recent-tips-title {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-black;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: $space-3;
}

.recent-tip-item {
  display: flex;
  align-items: center;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  margin-bottom: $space-2;
  transition: all $transition-fast;

  &:hover {
    border-color: var(--brutal-yellow);
    box-shadow: 2px 2px 0 var(--brutal-yellow);
  }
}

.recent-tip-emoji {
  font-size: $font-size-xl;
  margin-right: $space-3;
}

.recent-tip-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.recent-tip-to {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
}

.recent-tip-time {
  font-size: $font-size-xs;
  color: var(--text-secondary);
}

.recent-tip-amount {
  font-size: $font-size-base;
  font-weight: $font-weight-black;
  color: var(--neo-green);
}
</style>
