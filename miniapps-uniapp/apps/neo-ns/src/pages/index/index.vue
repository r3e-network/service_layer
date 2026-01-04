<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view class="app-container">
      <view v-if="statusMessage" :class="['status', statusType]">
        <text>{{ statusMessage }}</text>
      </view>

      <!-- Register Tab -->
      <view v-if="activeTab === 'register'" class="tab-content">
        <view class="search-box">
          <input
            v-model="searchQuery"
            :placeholder="t('searchPlaceholder')"
            class="search-input"
            @input="checkAvailability"
          />
          <text class="domain-suffix">.neo</text>
        </view>

        <view v-if="searchQuery && searchResult" class="result-card">
          <view class="result-header">
            <view class="domain-title-row">
              <text class="result-domain">{{ searchQuery }}.neo</text>
              <text v-if="searchQuery.length <= 3" class="premium-badge">{{ t("premium") }}</text>
            </view>
            <text class="result-status" :class="searchResult.available ? 'available' : 'taken'">
              {{ searchResult.available ? t("available") : t("taken") }}
            </text>
          </view>
          <view v-if="searchResult.available" class="result-body">
            <view class="price-display">
              <text class="price-label">{{ t("registrationPrice") }}</text>
              <text class="price-value" :class="{ 'premium-price': searchQuery.length <= 3 }">
                {{ searchResult.price }} GAS
              </text>
              <text class="price-period">{{ t("perYear") }}</text>
            </view>
            <button class="register-btn" :disabled="loading" @click="handleRegister">
              {{ loading ? t("processing") : t("registerNow") }}
            </button>
          </view>
          <view v-else class="result-body taken-body">
            <view class="owner-info">
              <text class="owner-label">{{ t("owner") }}</text>
              <text class="owner-value">{{ shortenAddress(searchResult.owner) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Domains Tab -->
      <view v-if="activeTab === 'domains'" class="tab-content">
        <view class="panel">
          <view v-if="myDomains.length === 0" class="empty-state">
            <text>{{ t("noDomains") }}</text>
          </view>
          <view v-for="domain in myDomains" :key="domain.name" class="domain-card">
            <view class="domain-card-header">
              <view class="domain-info">
                <text class="domain-name">{{ domain.name }}</text>
                <text class="domain-expiry">{{ t("expires") }}: {{ formatDate(domain.expiry) }}</text>
              </view>
              <view class="domain-status-indicator active"></view>
            </view>
            <view class="domain-actions">
              <button class="action-btn-sm manage" @click="showManage(domain)">{{ t("manage") }}</button>
              <button class="action-btn-sm renew" @click="handleRenew(domain)">{{ t("renew") }}</button>
            </view>
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
import { ref, computed, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";
import AppLayout from "@/shared/components/AppLayout.vue";
import type { NavTab } from "@/shared/components/NavBar.vue";

const translations = {
  title: { en: "Neo Name Service", zh: "Neo 域名服务" },
  searchPlaceholder: { en: "Search for a .neo domain", zh: "搜索 .neo 域名" },
  available: { en: "Available", zh: "可用" },
  taken: { en: "Taken", zh: "已被占用" },
  registrationPrice: { en: "Registration Price", zh: "注册价格" },
  perYear: { en: "/ year", zh: "/ 年" },
  registerNow: { en: "Register Now", zh: "立即注册" },
  processing: { en: "Processing...", zh: "处理中..." },
  owner: { en: "Owner", zh: "所有者" },
  noDomains: { en: "You don't own any domains yet", zh: "您还没有域名" },
  expires: { en: "Expires", zh: "到期时间" },
  manage: { en: "Manage", zh: "管理" },
  renew: { en: "Renew", zh: "续费" },
  registered: { en: "registered!", zh: "已注册！" },
  renewed: { en: "renewed!", zh: "已续费！" },
  registrationFailed: { en: "Registration failed", zh: "注册失败" },
  renewalFailed: { en: "Renewal failed", zh: "续费失败" },
  managing: { en: "Managing", zh: "管理中" },
  tabRegister: { en: "Register", zh: "注册" },
  tabDomains: { en: "Domains", zh: "域名" },
  premium: { en: "Premium", zh: "高级" },
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
const APP_ID = "miniapp-neo-ns";
const { address, connect } = useWallet();
const { payGAS } = usePayments(APP_ID);

interface SearchResult {
  available: boolean;
  price: number;
  owner?: string;
}

interface Domain {
  name: string;
  owner: string;
  expiry: number;
}

const activeTab = ref("register");
const navTabs: NavTab[] = [
  { id: "register", icon: "plus", label: t("tabRegister") },
  { id: "domains", icon: "folder", label: t("tabDomains") },
  { id: "docs", icon: "book", label: t("docs") },
];

const searchQuery = ref("");
const searchResult = ref<SearchResult | null>(null);
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const userAddress = ref("");
const myDomains = ref<Domain[]>([{ name: "alice.neo", owner: "", expiry: Date.now() + 365 * 24 * 60 * 60 * 1000 }]);

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString();
}

function showStatus(msg: string, type: "success" | "error") {
  statusMessage.value = msg;
  statusType.value = type;
  setTimeout(() => (statusMessage.value = ""), 3000);
}

function checkAvailability() {
  if (!searchQuery.value) {
    searchResult.value = null;
    return;
  }
  const taken = ["neo", "defi", "nft", "alice"].includes(searchQuery.value.toLowerCase());
  searchResult.value = taken
    ? { available: false, owner: "NXowner123" }
    : { available: true, price: calculatePrice(searchQuery.value) };
}

function calculatePrice(name: string): number {
  if (name.length <= 3) return 100;
  if (name.length <= 5) return 50;
  return 10;
}

async function handleRegister() {
  if (!searchResult.value?.available || loading.value) return;
  loading.value = true;
  try {
    await payGAS(searchResult.value.price.toString(), "nns:register:" + searchQuery.value);
    const domain: Domain = {
      name: searchQuery.value + ".neo",
      owner: userAddress.value,
      expiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
    };
    myDomains.value.unshift(domain);
    showStatus(searchQuery.value + ".neo " + t("registered"), "success");
    searchQuery.value = "";
    searchResult.value = null;
    activeTab.value = "domains";
  } catch (e: any) {
    showStatus(e.message || t("registrationFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleRenew(domain: Domain) {
  loading.value = true;
  try {
    await payGAS("10", "nns:renew:" + domain.name);
    domain.expiry += 365 * 24 * 60 * 60 * 1000;
    showStatus(domain.name + " " + t("renewed"), "success");
  } catch (e: any) {
    showStatus(e.message || t("renewalFailed"), "error");
  } finally {
    loading.value = false;
  }
}

function showManage(domain: Domain) {
  showStatus(t("managing") + " " + domain.name, "success");
}

onMounted(async () => {
  await connect();
  userAddress.value = address.value || "";
  myDomains.value.forEach((d) => (d.owner = userAddress.value));
});
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

.status {
  text-align: center;
  padding: $space-4;
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  margin-bottom: $space-4;
  font-weight: $font-weight-bold;
  text-transform: uppercase;

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
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-1;
  margin-bottom: $space-4;
  transition: box-shadow $transition-normal;

  &:focus-within {
    box-shadow: $shadow-lg;
  }
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: $space-3 $space-4;
  font-size: $font-size-lg;
  color: var(--text-primary);
  font-weight: $font-weight-medium;

  &::placeholder {
    color: var(--text-tertiary);
  }
}

.domain-suffix {
  padding: $space-3 $space-4;
  color: var(--neo-green);
  font-weight: $font-weight-bold;
  font-size: $font-size-lg;
  font-family: $font-mono;
}

.result-card {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-5;
  margin-bottom: $space-4;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $space-4;
  padding-bottom: $space-4;
  border-bottom: $border-width-sm solid var(--border-color);
}

.domain-title-row {
  display: flex;
  align-items: center;
  gap: $space-2;
  flex-wrap: wrap;
}

.result-domain {
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  font-family: $font-mono;
}

.premium-badge {
  display: inline-block;
  padding: $space-1 $space-2;
  background: var(--neo-purple);
  color: var(--text-on-primary);
  font-size: $font-size-xs;
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  border: $border-width-sm solid var(--border-color);
  box-shadow: $shadow-sm;
}

.result-status {
  font-size: $font-size-xs;
  padding: $space-1 $space-3;
  border: $border-width-sm solid $neo-black;
  font-weight: $font-weight-bold;
  text-transform: uppercase;

  &.available {
    background: var(--status-success);
    color: $neo-black;
  }

  &.taken {
    background: var(--status-error);
    color: $neo-white;
  }
}

.result-body {
  display: flex;
  flex-direction: column;
  gap: $space-4;
}

.price-display {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
}

.price-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  text-transform: uppercase;
  font-weight: $font-weight-bold;
  letter-spacing: 0.05em;
}

.price-value {
  color: var(--neo-green);
  font-weight: $font-weight-bold;
  font-size: $font-size-2xl;
  font-family: $font-mono;

  &.premium-price {
    color: var(--neo-purple);
  }
}

.price-period {
  color: var(--text-tertiary);
  font-size: $font-size-sm;
}

.taken-body {
  gap: 0;
}

.owner-info {
  display: flex;
  flex-direction: column;
  gap: $space-2;
  padding: $space-4;
  background: var(--bg-secondary);
  border: $border-width-sm solid var(--border-color);
  border-radius: $radius-sm;
}

.owner-label {
  color: var(--text-secondary);
  font-size: $font-size-xs;
  text-transform: uppercase;
  font-weight: $font-weight-bold;
  letter-spacing: 0.05em;
}

.owner-value {
  color: var(--text-primary);
  font-family: $font-mono;
  font-size: $font-size-base;
  font-weight: $font-weight-medium;
}

.register-btn {
  width: 100%;
  padding: $space-4 $space-6;
  background: var(--neo-green);
  color: var(--text-on-primary);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  font-weight: $font-weight-bold;
  font-size: $font-size-base;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all $transition-normal;

  &:hover {
    box-shadow: $shadow-lg;
  }

  &:active {
    transform: translate(4px, 4px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
  }
}

.panel {
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-5;
}

.empty-state {
  text-align: center;
  padding: $space-10;
  color: var(--text-secondary);
  font-weight: $font-weight-medium;
}

.domain-card {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  background: var(--bg-card);
  border: $border-width-md solid var(--border-color);
  box-shadow: $shadow-md;
  padding: $space-4;
  margin-bottom: $space-3;
  transition: all $transition-normal;

  &:hover {
    box-shadow: $shadow-lg;
  }
}

.domain-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: $space-3;
  border-bottom: $border-width-sm solid var(--border-color);
}

.domain-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: $space-1;
}

.domain-name {
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
  color: var(--text-primary);
  font-family: $font-mono;
}

.domain-expiry {
  font-size: $font-size-xs;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.domain-status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: $border-width-sm solid var(--border-color);
  flex-shrink: 0;

  &.active {
    background: var(--neo-green);
    box-shadow: 0 0 8px var(--neo-green);
  }
}

.domain-actions {
  display: flex;
  gap: $space-2;
  width: 100%;
}

.action-btn-sm {
  flex: 1;
  padding: $space-2 $space-4;
  border: $border-width-md solid var(--border-color);
  font-size: $font-size-xs;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: $font-weight-bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: all $transition-normal;
  box-shadow: $shadow-sm;

  &:hover {
    box-shadow: $shadow-md;
  }

  &:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  &.manage {
    background: var(--bg-card);
    color: var(--text-secondary);
    border-color: var(--border-color);

    &:hover {
      color: var(--text-primary);
      background: var(--bg-secondary);
    }
  }

  &.renew {
    background: var(--neo-green);
    color: var(--text-on-primary);
    border-color: var(--border-color);

    &:hover {
      box-shadow: $shadow-md;
    }
  }
}
</style>
