<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <!-- Main Tab -->
    <view v-if="activeTab === 'main'" class="tab-content">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{ t("switchToNeo") }}</NeoButton>
          </view>
        </NeoCard>
      </view>

      <NeoCard v-if="status" :variant="status.type === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ status.msg }}</text>
      </NeoCard>

      <!-- Security Level Dashboard -->
      <SecurityDashboard
        :security-level="securityLevel"
        :security-level-class="securityLevelClass"
        :security-percentage="securityPercentage"
        :t="t as any"
      />

      <!-- Guardians Status -->
      <GuardiansList :guardians="guardians" :t="t as any" />

      <!-- Policy Rules -->
      <PoliciesList :policies="policies" :t="t as any" @toggle="togglePolicy" />

      <!-- Create New Policy -->
      <CreatePolicyForm
        v-model:policyName="policyName"
        v-model:policyRule="policyRule"
        v-model:newPolicyLevel="newPolicyLevel"
        :t="t as any"
        @create="createPolicy"
      />
    </view>

    <!-- Stats Tab -->
    <view v-if="activeTab === 'stats'" class="tab-content scrollable">
      <StatsCard
        :stats="stats"
        :total-guardians="guardians.length"
        :active-guardians="guardians.filter((g) => g.active).length"
        :t="t as any"
      />

      <!-- Action History -->
      <ActionHistory :action-history="actionHistory" :t="t as any" />
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
import { useWallet } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import { AppLayout, NeoCard, NeoDoc, NeoButton } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";

import SecurityDashboard from "./components/SecurityDashboard.vue";
import GuardiansList, { type Guardian } from "./components/GuardiansList.vue";
import PoliciesList, { type Policy, type Level } from "./components/PoliciesList.vue";
import CreatePolicyForm from "./components/CreatePolicyForm.vue";
import StatsCard from "./components/StatsCard.vue";
import ActionHistory, { type ActionHistoryItem } from "./components/ActionHistory.vue";

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
  wrongChain: { en: "Wrong Network", zh: "网络错误" },
  wrongChainMessage: { en: "This app requires Neo N3 network.", zh: "此应用需 Neo N3 网络。" },
  switchToNeo: { en: "Switch to Neo N3", zh: "切换到 Neo N3" },

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
const { chainType, switchChain } = useWallet() as any;

const navTabs: NavTab[] = [
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
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.tab-content {
  padding: $space-4;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-4;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.scrollable { overflow-y: auto; -webkit-overflow-scrolling: touch; }
</style>
