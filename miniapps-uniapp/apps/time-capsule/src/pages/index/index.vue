<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'capsules' || activeTab === 'create'" class="app-container">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Capsules Tab -->
      <view v-if="activeTab === 'capsules'" class="tab-content">
        <view class="card">
          <text class="card-title">{{ t("yourCapsules") }}</text>

          <view v-if="capsules.length === 0" class="empty-state">
            <text class="empty-icon">📦</text>
            <text class="empty-text">{{ t("noCapsules") }}</text>
          </view>

          <view
            v-for="cap in capsules"
            :key="cap.id"
            :class="['capsule-container', cap.locked ? 'locked' : 'unlocked']"
          >
            <!-- Capsule Visual -->
            <view class="capsule-visual">
              <view class="capsule-body">
                <view class="capsule-top"></view>
                <view class="capsule-middle">
                  <view class="lock-indicator">
                    <text class="lock-icon">{{ cap.locked ? "🔒" : "🔓" }}</text>
                  </view>
                </view>
                <view class="capsule-bottom"></view>
              </view>
            </view>

            <!-- Capsule Info -->
            <view class="capsule-details">
              <text class="capsule-name">{{ cap.name }}</text>

              <!-- Countdown Timer for Locked Capsules -->
              <view v-if="cap.locked" class="countdown-section">
                <text class="countdown-label">{{ t("timeRemaining") }}</text>
                <view class="countdown-display">
                  <view class="countdown-unit">
                    <text class="countdown-value">{{ getCountdown(cap.unlockDate).days }}</text>
                    <text class="countdown-unit-label">{{ t("daysShort") }}</text>
                  </view>
                  <text class="countdown-separator">:</text>
                  <view class="countdown-unit">
                    <text class="countdown-value">{{ getCountdown(cap.unlockDate).hours }}</text>
                    <text class="countdown-unit-label">{{ t("hoursShort") }}</text>
                  </view>
                  <text class="countdown-separator">:</text>
                  <view class="countdown-unit">
                    <text class="countdown-value">{{ getCountdown(cap.unlockDate).minutes }}</text>
                    <text class="countdown-unit-label">{{ t("minShort") }}</text>
                  </view>
                </view>
                <text class="unlock-date">{{ t("unlocks") }} {{ cap.unlockDate }}</text>
              </view>

              <!-- Unlocked Status -->
              <view v-else class="unlocked-section">
                <text class="unlocked-label">{{ t("unlocked") }}</text>
                <view class="open-btn" @click="open(cap)">
                  <text class="open-btn-text">{{ t("open") }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- Create Tab -->
      <view v-if="activeTab === 'create'" class="tab-content">
        <view class="card">
          <text class="card-title">{{ t("createCapsule") }}</text>

          <view class="form-section">
            <text class="form-label">{{ t("capsuleName") }}</text>
            <uni-easyinput v-model="newCapsule.name" :placeholder="t('capsuleNamePlaceholder')" class="input-field" />
          </view>

          <view class="form-section">
            <text class="form-label">{{ t("secretMessage") }}</text>
            <uni-easyinput
              v-model="newCapsule.content"
              :placeholder="t('secretMessagePlaceholder')"
              type="textarea"
              class="input-field textarea-field"
            />
          </view>

          <view class="form-section">
            <text class="form-label">{{ t("unlockIn") }}</text>
            <view class="date-picker">
              <uni-easyinput
                v-model="newCapsule.days"
                type="number"
                :placeholder="t('daysPlaceholder')"
                class="days-input"
              />
              <text class="days-text">{{ t("days") }}</text>
            </view>
            <text class="helper-text">{{ t("unlockDateHelper") }}</text>
          </view>

          <view class="create-btn" @click="create" :style="{ opacity: isLoading || !canCreate ? 0.6 : 1 }">
            <text class="create-btn-text">{{ isLoading ? t("creating") : t("createCapsuleButton") }}</text>
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Time Capsule", zh: "时间胶囊" },
  subtitle: { en: "Lock content until future date", zh: "锁定内容直到未来日期" },
  yourCapsules: { en: "Your Capsules", zh: "你的胶囊" },
  noCapsules: { en: "No capsules yet. Create your first one!", zh: "还没有胶囊。创建你的第一个吧！" },
  timeRemaining: { en: "Time Remaining", zh: "剩余时间" },
  unlocks: { en: "Unlocks:", zh: "解锁时间：" },
  unlocked: { en: "Ready to Open", zh: "可以打开" },
  open: { en: "Open Capsule", zh: "打开胶囊" },
  createCapsule: { en: "Create New Capsule", zh: "创建新胶囊" },
  capsuleName: { en: "Capsule Name", zh: "胶囊名称" },
  capsuleNamePlaceholder: { en: "Enter capsule name", zh: "输入胶囊名称" },
  secretMessage: { en: "Secret Message", zh: "秘密消息" },
  secretMessagePlaceholder: { en: "Enter your secret message", zh: "输入你的秘密消息" },
  unlockIn: { en: "Lock Duration", zh: "锁定时长" },
  daysPlaceholder: { en: "30", zh: "30" },
  days: { en: "days", zh: "天" },
  daysShort: { en: "D", zh: "天" },
  hoursShort: { en: "H", zh: "时" },
  minShort: { en: "M", zh: "分" },
  unlockDateHelper: { en: "Your capsule will unlock after this many days", zh: "你的胶囊将在这么多天后解锁" },
  createCapsuleButton: { en: "Create Capsule (3 GAS)", zh: "创建胶囊 (3 GAS)" },
  creating: { en: "Creating...", zh: "创建中..." },
  creatingCapsule: { en: "Creating capsule...", zh: "创建胶囊中..." },
  capsuleCreated: { en: "Capsule created successfully!", zh: "胶囊创建成功！" },
  error: { en: "Error", zh: "错误" },
  message: { en: "Message:", zh: "消息：" },
  tabCapsules: { en: "Capsules", zh: "胶囊" },
  tabCreate: { en: "Create", zh: "创建" },
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

const APP_ID = "miniapp-timecapsule";
const { address, connect } = useWallet();
const { payGAS, isLoading } = usePayments(APP_ID);

interface Capsule {
  id: string;
  name: string;
  content: string;
  unlockDate: string;
  locked: boolean;
}

const activeTab = ref("capsules");
const navTabs: NavTab[] = [
  { id: "capsules", icon: "lock", label: t("tabCapsules") },
  { id: "create", icon: "plus", label: t("tabCreate") },
  { id: "docs", icon: "book", label: t("docs") },
];

const capsules = ref<Capsule[]>([
  { id: "1", name: "2025 Memories", content: "Hidden", unlockDate: "2026-01-01", locked: true },
  { id: "2", name: "Birthday Gift", content: "Happy Birthday!", unlockDate: "2025-06-15", locked: false },
]);

const newCapsule = ref({ name: "", content: "", days: "30" });
const status = ref<{ msg: string; type: string } | null>(null);
const currentTime = ref(Date.now());

// Countdown timer
let countdownInterval: number | null = null;

onMounted(() => {
  countdownInterval = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000) as unknown as number;
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

const getCountdown = (unlockDate: string) => {
  const now = currentTime.value;
  const target = new Date(unlockDate).getTime();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
  };
};

const canCreate = computed(() => {
  return (
    newCapsule.value.name.trim() !== "" && newCapsule.value.content.trim() !== "" && parseInt(newCapsule.value.days) > 0
  );
});

const create = async () => {
  if (isLoading.value || !canCreate.value) return;

  try {
    status.value = { msg: t("creatingCapsule"), type: "loading" };
    await payGAS("3", `create:${Date.now()}`);

    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + parseInt(newCapsule.value.days));

    capsules.value.push({
      id: Date.now().toString(),
      name: newCapsule.value.name,
      content: newCapsule.value.content,
      unlockDate: unlockDate.toISOString().split("T")[0],
      locked: true,
    });

    status.value = { msg: t("capsuleCreated"), type: "success" };
    newCapsule.value = { name: "", content: "", days: "30" };
    activeTab.value = "capsules";
  } catch (e: any) {
    status.value = { msg: e.message || t("error"), type: "error" };
  }
};

const open = (cap: Capsule) => {
  status.value = { msg: `${t("message")} ${cap.content}`, type: "success" };
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.app-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  padding: $space-4;
}

.tab-content {
  flex: 1;
}

.status-msg {
  text-align: center;
  padding: $space-3;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  animation: slideDown 0.3s ease-out;

  &.success {
    background: var(--status-success);
    color: var(--text-on-success);
    border-color: var(--border-color);
  }

  &.error {
    background: var(--status-error);
    color: var(--text-on-error);
    border-color: var(--border-color);
  }

  &.loading {
    background: var(--brutal-yellow);
    color: var(--neo-black);
    border-color: var(--border-color);
  }
}

.card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-5;
  margin-bottom: $space-4;
}

.card-title {
  color: var(--brutal-yellow);
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-5;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $space-8 $space-4;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: $space-4;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-secondary);
  font-size: $font-size-base;
}

/* Capsule Container */
.capsule-container {
  display: flex;
  gap: $space-4;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-sm;
  margin-bottom: $space-4;
  transition: all $transition-normal;

  &.locked {
    border-color: var(--neo-purple);

    .capsule-body {
      background: linear-gradient(
        135deg,
        var(--neo-purple) 0%,
        color-mix(in srgb, var(--neo-purple) 60%, transparent) 100%
      );
      border-color: var(--neo-purple);
    }
  }

  &.unlocked {
    border-color: var(--neo-green);
    animation: pulse 2s ease-in-out infinite;

    .capsule-body {
      background: linear-gradient(
        135deg,
        var(--neo-green) 0%,
        color-mix(in srgb, var(--neo-green) 60%, transparent) 100%
      );
      border-color: var(--neo-green);
    }
  }
}

/* Capsule Visual */
.capsule-visual {
  flex-shrink: 0;
  width: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capsule-body {
  width: 60px;
  height: 100px;
  position: relative;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
}

.capsule-top {
  height: 20px;
  background: var(--bg-card);
  border-bottom: $border-width-sm solid var(--border-color);
  border-radius: 30px 30px 0 0;
}

.capsule-middle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.capsule-bottom {
  height: 20px;
  background: var(--bg-card);
  border-top: $border-width-sm solid var(--border-color);
  border-radius: 0 0 30px 30px;
}

.lock-indicator {
  width: 40px;
  height: 40px;
  background: var(--bg-card);
  border: $border-width-sm solid var(--border-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: $shadow-sm;
}

.lock-icon {
  font-size: $font-size-xl;
}

/* Capsule Details */
.capsule-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.capsule-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Countdown Section */
.countdown-section {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.countdown-label {
  font-size: $font-size-sm;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.countdown-display {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-card);
  border: $border-width-sm solid var(--brutal-yellow);
  padding: $space-2 $space-3;
  min-width: 50px;
  box-shadow: $shadow-sm;
}

.countdown-value {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--brutal-yellow);
  line-height: 1;
}

.countdown-unit-label {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  margin-top: $space-1;
  text-transform: uppercase;
}

.countdown-separator {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--brutal-yellow);
}

.unlock-date {
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

/* Unlocked Section */
.unlocked-section {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.unlocked-label {
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  color: var(--neo-green);
  text-transform: uppercase;
}

.open-btn {
  padding: $space-3 $space-4;
  background: var(--neo-green);
  border: $border-width-md solid var(--neo-black);
  box-shadow: $shadow-md;
  cursor: pointer;
  transition: all $transition-fast;
  align-self: flex-start;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
}

.open-btn-text {
  color: var(--neo-black);
  font-size: $font-size-base;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
}

/* Form Section */
.form-section {
  margin-bottom: $space-5;
}

.form-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  text-transform: uppercase;
  margin-bottom: $space-2;
  letter-spacing: 0.5px;
}

.input-field {
  width: 100%;
}

.textarea-field {
  min-height: 120px;
}

.date-picker {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-2;
}

.days-input {
  width: 100px;
}

.days-text {
  color: var(--text-secondary);
  font-weight: $font-weight-bold;
}

.helper-text {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-secondary);
  font-style: italic;
}

.create-btn {
  background: var(--brutal-yellow);
  color: var(--neo-black);
  padding: $space-4;
  border: $border-width-md solid var(--neo-black);
  box-shadow: $shadow-md;
  text-align: center;
  cursor: pointer;
  transition: all $transition-fast;

  &:active {
    transform: translate(3px, 3px);
    box-shadow: none;
  }
}

.create-btn-text {
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: $shadow-sm;
  }
  50% {
    box-shadow: 0 0 20px var(--neo-green);
  }
}
</style>
