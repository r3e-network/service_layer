<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab === 'capsules' || activeTab === 'create'" class="app-container">
      <view v-if="status" :class="['status-msg', status.type]">
        <text class="status-text">{{ status.msg }}</text>
      </view>

      <!-- Capsules Tab -->
      <view v-if="activeTab === 'capsules'" class="tab-content">
        <view class="card">
          <text class="card-title">{{ t("yourCapsules") }}</text>

          <view v-if="capsules.length === 0" class="empty-state">
            <!-- Empty Box SVG -->
            <view class="empty-icon"><AppIcon name="archive" :size="64" class="text-secondary" /></view>
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
                    <!-- Lock/Unlock Icons -->
                    <AppIcon v-if="cap.locked" name="lock" :size="20" />
                    <AppIcon v-else name="unlock" :size="20" />
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
                <text class="unlocked-label">{{ t("unlocked") }}</text>
                <NeoButton variant="success" size="md" @click="open(cap)">
                  {{ t("open") }}
                </NeoButton>
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
            <view class="input-wrapper-clean">
              <NeoInput v-model="newCapsule.name" :placeholder="t('capsuleNamePlaceholder')" />
            </view>
          </view>

          <view class="form-section">
            <text class="form-label">{{ t("secretMessage") }}</text>
            <view class="input-wrapper-clean">
              <NeoInput
                v-model="newCapsule.content"
                :placeholder="t('secretMessagePlaceholder')"
                type="textarea"
                class="textarea-field"
              />
            </view>
          </view>

          <view class="form-section">
            <text class="form-label">{{ t("unlockIn") }}</text>
            <view class="date-picker">
              <view class="input-wrapper-clean small">
                <NeoInput
                  v-model="newCapsule.days"
                  type="number"
                  :placeholder="t('daysPlaceholder')"
                  class="days-input"
                />
              </view>
              <text class="days-text">{{ t("days") }}</text>
            </view>
            <text class="helper-text">{{ t("unlockDateHelper") }}</text>
          </view>

          <NeoButton
            variant="primary"
            size="lg"
            block
            :loading="isLoading"
            :disabled="isLoading || !canCreate"
            @click="create"
            class="mt-6"
          >
            {{ isLoading ? t("creating") : t("createCapsuleButton") }}
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, AppIcon, NeoDoc, NeoButton, NeoInput } from "@/shared/components";
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
  docSubtitle: {
    en: "Lock messages and assets until a future date",
    zh: "锁定消息和资产直到未来日期",
  },
  docDescription: {
    en: "Time Capsule lets you create digital time capsules that lock messages or assets until a specified future date. Perfect for future gifts, scheduled reveals, or personal time-locked notes.",
    zh: "时间胶囊让您创建数字时间胶囊，锁定消息或资产直到指定的未来日期。非常适合未来礼物、定时揭晓或个人时间锁定笔记。",
  },
  step1: {
    en: "Connect your Neo wallet and create a new time capsule",
    zh: "连接您的 Neo 钱包并创建新的时间胶囊",
  },
  step2: {
    en: "Enter your secret message and set the lock duration in days",
    zh: "输入您的秘密消息并设置锁定天数",
  },
  step3: {
    en: "Pay the creation fee to seal your capsule on-chain",
    zh: "支付创建费用将您的胶囊封存在链上",
  },
  step4: {
    en: "Open your capsule when the unlock date arrives",
    zh: "当解锁日期到达时打开您的胶囊",
  },
  feature1Name: { en: "Time-Locked", zh: "时间锁定" },
  feature1Desc: {
    en: "Content is cryptographically sealed until the unlock date - no early access.",
    zh: "内容在解锁日期前加密封存 - 无法提前访问。",
  },
  feature2Name: { en: "Permanent Storage", zh: "永久存储" },
  feature2Desc: {
    en: "Your capsules are stored on Neo blockchain forever.",
    zh: "您的胶囊永久存储在 Neo 区块链上。",
  },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const APP_ID = "miniapp-time-capsule";
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
  fetchData();
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

// Fetch capsules and register automation for unlock
const fetchData = async () => {
  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) return;

    const data = (await sdk.invoke("timeCapsule.getCapsules", { appId: APP_ID })) as Capsule[] | null;
    if (data) {
      capsules.value = data;
    }
  } catch (e) {
    console.warn("[TimeCapsule] Failed to fetch data:", e);
  }
};

// Register capsule for auto-unlock via Edge Function automation
const registerAutoUnlock = async (capsuleId: string, unlockDate: string) => {
  try {
    await fetch("/api/automation/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: APP_ID,
        taskName: `unlock-${capsuleId}`,
        taskType: "scheduled",
        payload: {
          action: "custom",
          handler: "timeCapsule:unlock",
          data: { capsuleId, unlockDate },
        },
      }),
    });
  } catch (e) {
    console.warn("[TimeCapsule] Failed to register auto-unlock:", e);
  }
};

const create = async () => {
  if (isLoading.value || !canCreate.value) return;

  try {
    status.value = { msg: t("creatingCapsule"), type: "loading" };
    await payGAS("3", `create:${Date.now()}`);

    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + parseInt(newCapsule.value.days));
    const unlockDateStr = unlockDate.toISOString().split("T")[0];
    const capsuleId = Date.now().toString();

    capsules.value.push({
      id: capsuleId,
      name: newCapsule.value.name,
      content: newCapsule.value.content,
      unlockDate: unlockDateStr,
      locked: true,
    });

    // Register for auto-unlock via automation service
    await registerAutoUnlock(capsuleId, unlockDateStr);

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
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-content { flex: 1; }

.status-msg {
  text-align: center;
  padding: $space-4;
  border: 4px solid black;
  box-shadow: 8px 8px 0 black;
  margin-bottom: $space-6;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  animation: slideDown 0.3s ease-out;

  &.success { background: var(--brutal-yellow); color: black; }
  &.error { background: var(--brutal-red); color: white; }
  &.loading { background: var(--brutal-orange); color: white; }
}

.card {
  background: white;
  border: 4px solid black;
  box-shadow: 10px 10px 0 black;
  padding: $space-6;
  margin-bottom: $space-6;
}

.card-title {
  color: black;
  font-size: 24px;
  font-weight: $font-weight-black;
  margin-bottom: $space-6;
  text-transform: uppercase;
  border-bottom: 4px solid var(--brutal-yellow);
  display: inline-block;
}

/* Capsule Container */
.capsule-container {
  display: flex;
  gap: $space-4;
  padding: $space-4;
  background: #f8f8f8;
  border: 3px solid black;
  box-shadow: 6px 6px 0 black;
  margin-bottom: $space-5;
  transition: all $transition-fast;
  &:active { transform: translate(2px, 2px); box-shadow: 4px 4px 0 black; }

  &.locked { border-color: black; background: white; }
  &.unlocked { border-color: black; background: var(--brutal-green-light, #e8f5e9); border-width: 4px; box-shadow: 8px 8px 0 black; }
}

.capsule-visual {
  flex-shrink: 0;
  width: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.capsule-body {
  width: 40px; height: 80px;
  border: 3px solid black;
  background: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.1);
}

.lock-indicator { color: black; }

.capsule-details { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.capsule-name { font-size: 18px; font-weight: $font-weight-black; text-transform: uppercase; margin-bottom: 4px; }

.countdown-display { display: flex; align-items: center; gap: $space-2; margin: 4px 0; }
.countdown-unit {
  background: black; color: white; padding: 4px 8px; border: 2px solid black; min-width: 40px; text-align: center;
}
.countdown-value { font-size: 18px; font-weight: $font-weight-black; font-family: $font-mono; }
.countdown-unit-label { font-size: 8px; display: block; opacity: 0.8; }
.countdown-separator { font-weight: $font-weight-black; }

.unlock-date { font-size: 10px; font-weight: $font-weight-black; opacity: 0.6; font-family: $font-mono; }

.unlocked-label { font-size: 14px; font-weight: $font-weight-black; color: var(--neo-green); text-transform: uppercase; margin-bottom: 8px; }

/* Form Section */
.form-section { margin-bottom: $space-6; }
.form-label { font-size: 12px; font-weight: $font-weight-black; text-transform: uppercase; margin-bottom: $space-2; display: block; }
.textarea-field { min-height: 120px; border: 3px solid black!important; }

.date-picker { display: flex; align-items: center; gap: $space-4; margin-bottom: $space-2; }
.days-input { width: 100px; }
.days-text { font-weight: $font-weight-black; text-transform: uppercase; font-size: 14px; }

.helper-text { font-size: 10px; opacity: 0.6; font-weight: $font-weight-black; text-transform: uppercase; }

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
