<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <view v-if="status" :class="['status-msg', status.type]">
        <text>{{ status.msg }}</text>
      </view>

      <!-- Security Level Dashboard -->
      <view class="security-dashboard">
        <view class="shield-icon">🛡️</view>
        <view class="security-info">
          <text class="security-label">{{ t("securityLevel") }}</text>
          <text :class="['security-value', securityLevelClass]">{{ securityLevel }}</text>
        </view>
        <view class="security-meter">
          <view class="meter-bar" :style="{ width: securityPercentage + '%' }"></view>
        </view>
      </view>

      <!-- Guardians Status -->
      <view class="card guardians-card">
        <text class="card-title">👥 {{ t("guardians") }}</text>
        <view v-for="guardian in guardians" :key="guardian.id" class="guardian-row">
          <view class="guardian-avatar">{{ guardian.avatar }}</view>
          <view class="guardian-info">
            <text class="guardian-name">{{ guardian.name }}</text>
            <text class="guardian-role">{{ guardian.role }}</text>
          </view>
          <view :class="['guardian-status', guardian.active ? 'active' : 'inactive']">
            <text class="status-dot">●</text>
            <text class="status-text">{{ guardian.active ? t("active") : t("inactive") }}</text>
          </view>
        </view>
      </view>

      <!-- Policy Rules -->
      <view class="card policies-card">
        <text class="card-title">📋 {{ t("activePolicies") }}</text>
        <view v-for="policy in policies" :key="policy.id" class="policy-row">
          <view class="policy-header">
            <view class="policy-icon" :class="'level-' + policy.level">🔒</view>
            <view class="policy-info">
              <text class="policy-name">{{ policy.name }}</text>
              <text class="policy-desc">{{ policy.description }}</text>
            </view>
          </view>
          <view class="policy-controls">
            <text :class="['policy-level', 'level-' + policy.level]">{{ getLevelText(policy.level) }}</text>
            <NeoButton :variant="policy.enabled ? 'primary' : 'secondary'" size="sm" @click="togglePolicy(policy.id)">
              {{ policy.enabled ? "ON" : "OFF" }}
            </NeoButton>
          </view>
        </view>
      </view>

      <!-- Create New Policy -->
      <view class="card create-card">
        <text class="card-title">➕ {{ t("createPolicy") }}</text>
        <NeoInput v-model="policyName" :placeholder="t('policyName')" class="input" />
        <NeoInput v-model="policyRule" :placeholder="t('policyRule')" class="input" />
        <view class="level-selector">
          <text class="selector-label">{{ t("securityLevel") }}:</text>
          <view class="level-options">
            <view
              v-for="level in ['low', 'medium', 'high', 'critical']"
              :key="level"
              :class="['level-option', { selected: newPolicyLevel === level }]"
              @click="newPolicyLevel = level"
            >
              <text>{{ getLevelText(level) }}</text>
            </view>
          </view>
        </view>
        <NeoButton variant="primary" size="lg" block @click="createPolicy">
          {{ t("createPolicy") }}
        </NeoButton>
      </view>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <view class="stats-card">
        <text class="stats-title">📊 {{ t("statistics") }}</text>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalPolicies") }}</text>
          <text class="stat-value">{{ stats.totalPolicies }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("activePoliciesCount") }}</text>
          <text class="stat-value">{{ stats.activePolicies }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("inactivePolicies") }}</text>
          <text class="stat-value">{{ stats.inactivePolicies }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("totalGuardians") }}</text>
          <text class="stat-value">{{ guardians.length }}</text>
        </view>
        <view class="stat-row">
          <text class="stat-label">{{ t("activeGuardians") }}</text>
          <text class="stat-value">{{ guardians.filter((g) => g.active).length }}</text>
        </view>
      </view>

      <!-- Action History -->
      <view class="history-card">
        <text class="history-title">📜 {{ t("actionHistory") }}</text>
        <view v-for="action in actionHistory" :key="action.id" class="history-item">
          <view class="history-icon" :class="action.type">{{ getActionIcon(action.type) }}</view>
          <view class="history-content">
            <text class="history-action">{{ action.action }}</text>
            <text class="history-time">{{ action.time }}</text>
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
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import NeoButton from "@/shared/components/NeoButton.vue";
import NeoInput from "@/shared/components/NeoInput.vue";

const translations = {
  title: { en: "Guardian Policy", zh: "守护策略" },
  activePolicies: { en: "Active Policies", zh: "活跃策略" },
  createPolicy: { en: "Create Policy", zh: "创建策略" },
  policyName: { en: "Policy name", zh: "策略名称" },
  policyRule: { en: "Rule (e.g., max_tx_amount: 1000)", zh: "规则 (例如: max_tx_amount: 1000)" },
  fillAllFields: { en: "Please fill all fields", zh: "请填写所有字段" },
  policyCreated: { en: "Policy created successfully", zh: "策略创建成功" },
  policyEnabled: { en: "enabled", zh: "已启用" },
  policyDisabled: { en: "disabled", zh: "已禁用" },
  main: { en: "Main", zh: "主页" },
  stats: { en: "Stats", zh: "统计" },
  statistics: { en: "Statistics", zh: "统计数据" },
  totalPolicies: { en: "Total Policies", zh: "总策略数" },
  activePoliciesCount: { en: "Active Policies", zh: "活跃策略" },
  inactivePolicies: { en: "Inactive Policies", zh: "未激活策略" },
  securityLevel: { en: "Security Level", zh: "安全等级" },
  guardians: { en: "Guardians", zh: "守护者" },
  active: { en: "Active", zh: "活跃" },
  inactive: { en: "Inactive", zh: "离线" },
  totalGuardians: { en: "Total Guardians", zh: "总守护者" },
  activeGuardians: { en: "Active Guardians", zh: "活跃守护者" },
  actionHistory: { en: "Action History", zh: "操作历史" },
  levelLow: { en: "Low", zh: "低" },
  levelMedium: { en: "Medium", zh: "中" },
  levelHigh: { en: "High", zh: "高" },
  levelCritical: { en: "Critical", zh: "严重" },

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
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("main");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-guardian-policy";

interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  level: "low" | "medium" | "high" | "critical";
}

interface Guardian {
  id: string;
  name: string;
  role: string;
  avatar: string;
  active: boolean;
}

interface ActionHistoryItem {
  id: string;
  action: string;
  time: string;
  type: "create" | "enable" | "disable" | "update";
}

const policies = ref<Policy[]>([
  { id: "1", name: "Rate Limit", description: "Max 10 tx/min", enabled: true, level: "medium" },
  { id: "2", name: "Amount Cap", description: "Max 1000 GAS/tx", enabled: true, level: "high" },
  { id: "3", name: "Whitelist Only", description: "Approved addresses", enabled: false, level: "critical" },
  { id: "4", name: "Time Lock", description: "24h withdrawal delay", enabled: false, level: "low" },
]);

const guardians = ref<Guardian[]>([
  { id: "1", name: "Alice", role: "Admin", avatar: "👩‍💼", active: true },
  { id: "2", name: "Bob", role: "Security", avatar: "👨‍💻", active: true },
  { id: "3", name: "Charlie", role: "Auditor", avatar: "🕵️", active: false },
]);

const actionHistory = ref<ActionHistoryItem[]>([
  { id: "1", action: "Created Rate Limit policy", time: "2 hours ago", type: "create" },
  { id: "2", action: "Enabled Amount Cap policy", time: "5 hours ago", type: "enable" },
  { id: "3", action: "Updated Whitelist Only policy", time: "1 day ago", type: "update" },
  { id: "4", action: "Disabled Time Lock policy", time: "2 days ago", type: "disable" },
]);

const policyName = ref("");
const policyRule = ref("");
const newPolicyLevel = ref<"low" | "medium" | "high" | "critical">("medium");
const status = ref<{ msg: string; type: string } | null>(null);

const stats = computed(() => ({
  totalPolicies: policies.value.length,
  activePolicies: policies.value.filter((p) => p.enabled).length,
  inactivePolicies: policies.value.filter((p) => !p.enabled).length,
}));

// Security level calculation
const securityLevel = computed(() => {
  const activePolicies = policies.value.filter((p) => p.enabled);
  const criticalCount = activePolicies.filter((p) => p.level === "critical").length;
  const highCount = activePolicies.filter((p) => p.level === "high").length;

  if (criticalCount >= 2 && highCount >= 1) return "MAXIMUM";
  if (criticalCount >= 1 || highCount >= 2) return "HIGH";
  if (activePolicies.length >= 2) return "MEDIUM";
  return "LOW";
});

const securityPercentage = computed(() => {
  const level = securityLevel.value;
  if (level === "MAXIMUM") return 100;
  if (level === "HIGH") return 75;
  if (level === "MEDIUM") return 50;
  return 25;
});

const securityLevelClass = computed(() => {
  const level = securityLevel.value;
  if (level === "MAXIMUM") return "level-critical";
  if (level === "HIGH") return "level-high";
  if (level === "MEDIUM") return "level-medium";
  return "level-low";
});

const togglePolicy = (id: string) => {
  const policy = policies.value.find((p) => p.id === id);
  if (policy) {
    policy.enabled = !policy.enabled;
    status.value = {
      msg: `Policy ${policy.enabled ? t("policyEnabled") : t("policyDisabled")}`,
      type: "success",
    };
    // Add to action history
    actionHistory.value.unshift({
      id: String(Date.now()),
      action: `${policy.enabled ? "Enabled" : "Disabled"} ${policy.name} policy`,
      time: "Just now",
      type: policy.enabled ? "enable" : "disable",
    });
  }
};

const createPolicy = () => {
  if (!policyName.value || !policyRule.value) {
    status.value = { msg: t("fillAllFields"), type: "error" };
    return;
  }
  policies.value.push({
    id: String(Date.now()),
    name: policyName.value,
    description: policyRule.value,
    enabled: true,
    level: newPolicyLevel.value,
  });
  status.value = { msg: t("policyCreated"), type: "success" };
  // Add to action history
  actionHistory.value.unshift({
    id: String(Date.now()),
    action: `Created ${policyName.value} policy`,
    time: "Just now",
    type: "create",
  });
  policyName.value = "";
  policyRule.value = "";
  newPolicyLevel.value = "medium";
};

// Helper functions
const getLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    low: t("levelLow"),
    medium: t("levelMedium"),
    high: t("levelHigh"),
    critical: t("levelCritical"),
  };
  return levelMap[level] || level;
};

const getActionIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    create: "➕",
    enable: "✅",
    disable: "❌",
    update: "🔄",
  };
  return iconMap[type] || "📝";
};
</script>

<style lang="scss" scoped>
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-3;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.scrollable {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
}

// Security Dashboard
.security-dashboard {
  background: linear-gradient(135deg, var(--neo-purple) 0%, var(--neo-cyan) 100%);
  border: $border-width-lg solid var(--neo-black);
  border-radius: $radius-md;
  padding: $space-6;
  margin-bottom: $space-4;
  box-shadow: $shadow-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-3;
}

.shield-icon {
  font-size: 48px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.security-info {
  text-align: center;
}

.security-label {
  display: block;
  color: var(--neo-white);
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: $space-2;
}

.security-value {
  display: block;
  font-size: $font-size-3xl;
  font-weight: $font-weight-black;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  &.level-low {
    color: var(--brutal-yellow);
  }
  &.level-medium {
    color: var(--neo-cyan);
  }
  &.level-high {
    color: var(--neo-green);
  }
  &.level-critical {
    color: var(--neo-white);
  }
}

.security-meter {
  width: 100%;
  height: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 9999px;
  overflow: hidden;
  border: 2px solid var(--neo-black);
}

.meter-bar {
  flex: 1;
  min-height: 0;
  background: linear-gradient(90deg, var(--neo-green) 0%, var(--neo-cyan) 100%);
  transition: width $transition-normal;
  box-shadow: 0 0 10px rgba(var(--neo-green-rgb), 0.5);
}

.status-msg {
  text-align: center;
  padding: $space-4;
  border-radius: $radius-sm;
  margin-bottom: $space-4;
  flex-shrink: 0;
  border: $border-width-md solid var(--neo-black);
  font-weight: $font-weight-bold;

  &.success {
    background: rgba(var(--status-success), 0.15);
    color: var(--status-success);
    box-shadow: $shadow-md;
  }
  &.error {
    background: rgba(var(--status-error), 0.15);
    color: var(--status-error);
    box-shadow: 5px 5px 0 var(--status-error);
  }
}

.card {
  background: var(--bg-card);
  border: $border-width-lg solid var(--neo-black);
  border-radius: $radius-sm;
  padding: $space-6;
  margin-bottom: $space-4;
  box-shadow: $shadow-lg;
  transition: box-shadow $transition-fast;

  &:hover {
    box-shadow: $shadow-xl;
  }
}

.card-title {
  color: var(--neo-green);
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  display: block;
  margin-bottom: $space-4;
  text-transform: uppercase;
  letter-spacing: 1px;
}

// Guardians Card
.guardians-card {
  background: linear-gradient(135deg, rgba(var(--neo-purple-rgb), 0.1) 0%, rgba(var(--neo-cyan-rgb), 0.1) 100%);
}

.guardian-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4;
  background: var(--bg-card);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
  margin-bottom: $space-3;
  transition: all $transition-fast;

  &:hover {
    border-color: var(--neo-purple);
    box-shadow: 3px 3px 0 rgba(var(--neo-purple-rgb), 0.3);
    transform: translateX(4px);
  }
}

.guardian-avatar {
  font-size: 32px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 9999px;
  border: 2px solid var(--neo-black);
}

.guardian-info {
  flex: 1;
}

.guardian-name {
  display: block;
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.guardian-role {
  display: block;
  font-size: $font-size-sm;
  color: var(--text-secondary);
}

.guardian-status {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;

  &.active {
    background: rgba(var(--neo-green-rgb), 0.15);
    color: var(--neo-green);
    border: 1px solid var(--neo-green);
  }

  &.inactive {
    background: rgba(var(--text-secondary-rgb), 0.15);
    color: var(--text-secondary);
    border: 1px solid var(--text-secondary);
  }
}

.status-dot {
  font-size: 8px;
}

.status-text {
  text-transform: uppercase;
  letter-spacing: 1px;
}

// Policy Rules Card
.policies-card {
  background: linear-gradient(135deg, rgba(var(--neo-green-rgb), 0.05) 0%, rgba(var(--neo-cyan-rgb), 0.05) 100%);
}

.policy-row {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  padding: $space-4;
  background: var(--bg-card);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
  margin-bottom: $space-3;
  transition: all $transition-fast;

  &:hover {
    border-color: var(--neo-green);
    box-shadow: 4px 4px 0 rgba(var(--neo-green-rgb), 0.2);
  }
}

.policy-header {
  display: flex;
  align-items: center;
  gap: $space-3;
}

.policy-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  border: 2px solid var(--neo-black);

  &.level-low {
    background: rgba(var(--brutal-yellow-rgb), 0.2);
  }
  &.level-medium {
    background: rgba(var(--neo-cyan-rgb), 0.2);
  }
  &.level-high {
    background: rgba(var(--neo-green-rgb), 0.2);
  }
  &.level-critical {
    background: rgba(var(--brutal-red-rgb), 0.2);
  }
}

.policy-info {
  flex: 1;
}

.policy-name {
  font-weight: $font-weight-bold;
  display: block;
  margin-bottom: $space-1;
  font-size: $font-size-base;
  color: var(--text-primary);
}

.policy-desc {
  color: var(--text-secondary);
  font-size: $font-size-sm;
}

.policy-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-3;
}

.policy-level {
  padding: $space-1 $space-3;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: 2px solid var(--neo-black);

  &.level-low {
    background: var(--brutal-yellow);
    color: var(--neo-black);
  }
  &.level-medium {
    background: var(--neo-cyan);
    color: var(--neo-black);
  }
  &.level-high {
    background: var(--neo-green);
    color: var(--neo-black);
  }
  &.level-critical {
    background: var(--brutal-red);
    color: var(--neo-white);
  }
}

.input {
  margin-bottom: $space-4;
}

// Create Policy Card
.create-card {
  background: linear-gradient(135deg, rgba(var(--neo-green-rgb), 0.08) 0%, rgba(var(--neo-purple-rgb), 0.08) 100%);
}

.level-selector {
  margin-bottom: $space-4;
}

.selector-label {
  display: block;
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  color: var(--text-primary);
  margin-bottom: $space-2;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.level-options {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.level-option {
  flex: 1;
  min-width: 60px;
  padding: $space-2 $space-3;
  border: 2px solid var(--border-color);
  border-radius: $radius-sm;
  text-align: center;
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  cursor: pointer;
  transition: all $transition-fast;
  background: var(--bg-secondary);

  &:hover {
    border-color: var(--neo-purple);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: var(--neo-purple);
    background: var(--neo-purple);
    color: var(--neo-white);
    box-shadow: 3px 3px 0 rgba(var(--neo-purple-rgb), 0.3);
  }
}

.stats-card {
  background: var(--bg-card);
  border: $border-width-lg solid $neo-black;
  border-radius: $radius-sm;
  padding: $space-6;
  margin-bottom: $space-4;
  box-shadow: $shadow-lg;
}

.stats-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--neo-green);
  margin-bottom: $space-4;
  display: block;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: $border-width-sm solid var(--border-color);
  transition: all $transition-fast;

  &:hover {
    padding-left: $space-2;
    border-left: $border-width-md solid var(--neo-green);
  }

  &:last-child {
    border-bottom: none;
  }
}

.stat-label {
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

.stat-value {
  font-weight: $font-weight-black;
  color: var(--text-primary);
  font-size: $font-size-lg;
}

// Action History
.history-card {
  background: var(--bg-card);
  border: $border-width-lg solid var(--neo-black);
  border-radius: $radius-sm;
  padding: $space-6;
  margin-bottom: $space-4;
  box-shadow: $shadow-lg;
}

.history-title {
  font-size: $font-size-xl;
  font-weight: $font-weight-black;
  color: var(--neo-purple);
  margin-bottom: $space-4;
  display: block;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-3;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
  margin-bottom: $space-3;
  transition: all $transition-fast;

  &:hover {
    border-color: var(--neo-purple);
    box-shadow: 3px 3px 0 rgba(var(--neo-purple-rgb), 0.2);
    transform: translateX(4px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.history-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  border: 2px solid var(--neo-black);

  &.create {
    background: rgba(var(--neo-green-rgb), 0.2);
  }
  &.enable {
    background: rgba(var(--neo-cyan-rgb), 0.2);
  }
  &.disable {
    background: rgba(var(--brutal-red-rgb), 0.2);
  }
  &.update {
    background: rgba(var(--neo-purple-rgb), 0.2);
  }
}

.history-content {
  flex: 1;
}

.history-action {
  display: block;
  font-weight: $font-weight-bold;
  font-size: $font-size-sm;
  color: var(--text-primary);
  margin-bottom: $space-1;
}

.history-time {
  display: block;
  font-size: $font-size-xs;
  color: var(--text-secondary);
}
</style>
