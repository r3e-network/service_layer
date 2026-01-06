<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Security Level Dashboard -->
      <NeoCard class="security-dashboard">
        <view class="shield-icon">🛡️</view>
        <view class="security-info">
          <text class="security-label">{{ t("securityLevel") }}</text>
          <text :class="['security-value', securityLevelClass]">{{ securityLevel }}</text>
        </view>
        <view class="security-meter">
          <view class="meter-bar" :style="{ width: securityPercentage + '%' }"></view>
        </view>
      </NeoCard>

      <!-- Guardians Status -->
      <!-- Guardians Status -->
      <NeoCard :title="'👥 ' + t('guardians')" class="guardians-card">
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
      </NeoCard>

      <!-- Policy Rules -->
      <!-- Policy Rules -->
      <NeoCard :title="'📋 ' + t('activePolicies')" class="policies-card">
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
      </NeoCard>

      <!-- Create New Policy -->
      <!-- Create New Policy -->
      <NeoCard :title="'➕ ' + t('createPolicy')" class="create-card">
        <NeoInput v-model="policyName" :placeholder="t('policyName')" class="input" />
        <NeoInput v-model="policyRule" :placeholder="t('policyRule')" class="input" />
        <view class="level-selector">
          <text class="selector-label">{{ t("securityLevel") }}:</text>
          <view class="level-options">
            <view
              v-for="level in LEVELS"
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
      </NeoCard>
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <NeoCard :title="'📊 ' + t('statistics')" class="stats-card">
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
      </NeoCard>

      <!-- Action History -->
      <NeoCard :title="'📜 ' + t('actionHistory')" class="history-card">
        <view v-for="action in actionHistory" :key="action.id" class="history-item">
          <view class="history-icon" :class="action.type">{{ getActionIcon(action.type) }}</view>
          <view class="history-content">
            <text class="history-action">{{ action.action }}</text>
            <text class="history-time">{{ action.time }}</text>
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
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoDoc, NeoButton, NeoInput, NeoCard } from "@/shared/components";

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
  docSubtitle: {
    en: "Multi-signature wallet protection and recovery",
    zh: "多签钱包保护和恢复",
  },
  docDescription: {
    en: "Guardian Policy sets up trusted guardians for your wallet. Configure spending limits, multi-sig approvals, and emergency recovery options.",
    zh: "Guardian Policy 为您的钱包设置可信守护者。配置消费限额、多签审批和紧急恢复选项。",
  },
  step1: {
    en: "Connect your Neo wallet to protect",
    zh: "连接要保护的 Neo 钱包",
  },
  step2: {
    en: "Add trusted guardian addresses",
    zh: "添加可信守护者地址",
  },
  step3: {
    en: "Set approval thresholds and spending limits",
    zh: "设置审批阈值和消费限额",
  },
  step4: {
    en: "Activate protection - guardians can help recover access",
    zh: "激活保护 - 守护者可帮助恢复访问",
  },
  feature1Name: { en: "Multi-Sig Security", zh: "多签安全" },
  feature1Desc: {
    en: "Require multiple guardian approvals for large transactions.",
    zh: "大额交易需要多个守护者批准。",
  },
  feature2Name: { en: "Recovery Options", zh: "恢复选项" },
  feature2Desc: {
    en: "Guardians can help recover wallet access if keys are lost.",
    zh: "如果密钥丢失，守护者可帮助恢复钱包访问。",
  },
};

const t = createT(translations);

const navTabs = [
  { id: "main", icon: "wallet", label: t("main") },
  { id: "stats", icon: "chart", label: t("stats") },
  { id: "docs", icon: "book", label: t("docs") },
];

const activeTab = ref("main");

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-guardianpolicy";

const LEVELS = ["low", "medium", "high", "critical"] as const;
type Level = (typeof LEVELS)[number];

interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  level: Level;
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
const newPolicyLevel = ref<Level>("medium");
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
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.security-dashboard {
  background: black;
  padding: $space-8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $space-4;
  border: 4px solid black;
  box-shadow: 12px 12px 0 var(--brutal-yellow);
}
.shield-icon {
  font-size: 64px;
}
.security-label {
  color: white;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  letter-spacing: 4px;
  border: 1px solid white;
  padding: 2px 10px;
}
.security-value {
  font-size: 40px;
  font-weight: $font-weight-black;
  color: var(--brutal-yellow);
  text-transform: uppercase;
  text-shadow: 4px 4px 0 black;
}
.security-meter {
  width: 100%;
  height: 24px;
  background: #333;
  border: 3px solid white;
  position: relative;
  padding: 2px;
}
.meter-bar {
  height: 100%;
  background: var(--neo-green);
  border-right: 3px solid white;
  transition: width $transition-normal;
}

.guardian-row {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  background: white;
  border: 3px solid black;
  margin-bottom: $space-4;
  transition: all $transition-fast;
  box-shadow: 6px 6px 0 black;
  &:hover {
    transform: translate(2px, 2px);
    box-shadow: 4px 4px 0 black;
  }
}
.guardian-avatar {
  width: 50px;
  height: 50px;
  background: #eee;
  border: 3px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}
.guardian-name {
  font-weight: $font-weight-black;
  font-size: 16px;
  display: block;
  border-bottom: 2px solid black;
}
.guardian-role {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  opacity: 1;
  color: #666;
}
.guardian-status {
  margin-left: auto;
  padding: 4px 12px;
  border: 2px solid black;
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  box-shadow: 3px 3px 0 black;
  &.active {
    background: var(--neo-green);
    color: black;
  }
  &.inactive {
    background: #bbb;
    color: black;
  }
}

.policy-row {
  padding: $space-4;
  background: white;
  border: 3px solid black;
  margin-bottom: $space-4;
  box-shadow: 5px 5px 0 black;
}
.policy-header {
  display: flex;
  align-items: center;
  gap: $space-4;
  margin-bottom: $space-4;
}
.policy-icon {
  width: 40px;
  height: 40px;
  border: 3px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  &.level-low { background: var(--brutal-yellow); }
  &.level-medium { background: var(--neo-cyan); }
  &.level-high { background: var(--neo-green); }
  &.level-critical { background: var(--brutal-red); }
}
.policy-name {
  font-weight: $font-weight-black;
  font-size: 16px;
  text-transform: uppercase;
}
.policy-desc {
  font-size: 10px;
  font-weight: $font-weight-black;
  opacity: 0.6;
}
.policy-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eee;
  padding: $space-2 $space-4;
  border: 2px solid black;
}
.policy-level {
  font-size: 10px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  background: white;
  padding: 2px 10px;
  border: 1px solid black;
}

.level-options {
  display: flex;
  gap: $space-3;
  margin-bottom: $space-6;
}
.level-option {
  flex: 1;
  padding: $space-3;
  border: 3px solid black;
  text-align: center;
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
  cursor: pointer;
  background: white;
  transition: all $transition-fast;
  &.selected {
    background: var(--brutal-yellow);
    box-shadow: 4px 4px 0 black;
    transform: translate(2px, 2px);
  }
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: $space-3 0;
  border-bottom: 2px solid black;
}
.stat-label {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.stat-value {
  font-family: $font-mono;
  font-weight: $font-weight-black;
  font-size: 18px;
  background: black;
  color: white;
  padding: 0 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: $space-4;
  padding: $space-4;
  border-bottom: 2px solid black;
  background: white;
  margin-bottom: $space-2;
  box-shadow: 3px 3px 0 black;
}
.history-icon {
  width: 36px;
  height: 36px;
  border: 2px solid black;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #eee;
}
.history-action {
  font-size: 12px;
  font-weight: $font-weight-black;
  text-transform: uppercase;
}
.history-time {
  font-size: 10px;
  opacity: 0.6;
  font-weight: $font-weight-black;
  display: block;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
