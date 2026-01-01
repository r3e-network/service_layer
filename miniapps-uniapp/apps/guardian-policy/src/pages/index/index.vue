<template>
  <view class="app-container">
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <view v-if="status" :class="['status-msg', status.type]">
      <text>{{ status.msg }}</text>
    </view>

    <view class="card">
      <text class="card-title">{{ t("activePolicies") }}</text>
      <view v-for="policy in policies" :key="policy.id" class="policy-row">
        <view class="policy-info">
          <text class="policy-name">{{ policy.name }}</text>
          <text class="policy-desc">{{ policy.description }}</text>
        </view>
        <view class="toggle" :class="{ active: policy.enabled }" @click="togglePolicy(policy.id)">
          <text>{{ policy.enabled ? "ON" : "OFF" }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <text class="card-title">{{ t("createPolicy") }}</text>
      <uni-easyinput v-model="policyName" :placeholder="t('policyName')" class="input" />
      <uni-easyinput v-model="policyRule" :placeholder="t('policyRule')" class="input" />
      <view class="action-btn" @click="createPolicy">
        <text>{{ t("createPolicy") }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Guardian Policy", zh: "守护策略" },
  subtitle: { en: "Security policy management", zh: "安全策略管理" },
  activePolicies: { en: "Active Policies", zh: "活跃策略" },
  createPolicy: { en: "Create Policy", zh: "创建策略" },
  policyName: { en: "Policy name", zh: "策略名称" },
  policyRule: { en: "Rule (e.g., max_tx_amount: 1000)", zh: "规则 (例如: max_tx_amount: 1000)" },
  fillAllFields: { en: "Please fill all fields", zh: "请填写所有字段" },
  policyCreated: { en: "Policy created successfully", zh: "策略创建成功" },
  policyEnabled: { en: "enabled", zh: "已启用" },
  policyDisabled: { en: "disabled", zh: "已禁用" },
};

const t = createT(translations);

const APP_ID = "miniapp-guardian-policy";

interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const policies = ref<Policy[]>([
  { id: "1", name: "Rate Limit", description: "Max 10 tx/min", enabled: true },
  { id: "2", name: "Amount Cap", description: "Max 1000 GAS/tx", enabled: true },
  { id: "3", name: "Whitelist Only", description: "Approved addresses", enabled: false },
  { id: "4", name: "Time Lock", description: "24h withdrawal delay", enabled: false },
]);

const policyName = ref("");
const policyRule = ref("");
const status = ref<{ msg: string; type: string } | null>(null);

const togglePolicy = (id: string) => {
  const policy = policies.value.find((p) => p.id === id);
  if (policy) {
    policy.enabled = !policy.enabled;
    status.value = {
      msg: `Policy ${policy.enabled ? t("policyEnabled") : t("policyDisabled")}`,
      type: "success",
    };
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
  });
  status.value = { msg: t("policyCreated"), type: "success" };
  policyName.value = "";
  policyRule.value = "";
};
</script>

<style lang="scss">
@import "@/shared/styles/theme.scss";
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $color-bg-primary 0%, $color-bg-secondary 100%);
  color: $color-text-primary;
  padding: 20px;
}
.header {
  text-align: center;
  margin-bottom: 24px;
}
.title {
  font-size: 1.8em;
  font-weight: bold;
  color: $color-utility;
}
.subtitle {
  color: $color-text-secondary;
  font-size: 0.9em;
  margin-top: 8px;
}
.status-msg {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  &.success {
    background: rgba($color-success, 0.15);
    color: $color-success;
  }
  &.error {
    background: rgba($color-error, 0.15);
    color: $color-error;
  }
}
.card {
  background: $color-bg-card;
  border: 1px solid $color-border;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}
.card-title {
  color: $color-utility;
  font-size: 1.1em;
  font-weight: bold;
  display: block;
  margin-bottom: 12px;
}
.policy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba($color-utility, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}
.policy-info {
  flex: 1;
}
.policy-name {
  font-weight: bold;
  display: block;
  margin-bottom: 4px;
}
.policy-desc {
  color: $color-text-secondary;
  font-size: 0.85em;
}
.toggle {
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba($color-error, 0.3);
  color: $color-error;
  font-size: 0.85em;
  font-weight: bold;
  &.active {
    background: rgba($color-success, 0.3);
    color: $color-success;
  }
}
.input {
  margin-bottom: 12px;
}
.action-btn {
  background: linear-gradient(135deg, $color-utility 0%, darken($color-utility, 10%) 100%);
  color: #fff;
  padding: 14px;
  border-radius: 12px;
  text-align: center;
  font-weight: bold;
}
</style>
