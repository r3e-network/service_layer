<template>
  <view class="container">
    <!-- Header -->
    <view class="header">
      <text class="title">{{ t("title") }}</text>
      <text class="subtitle">{{ t("subtitle") }}</text>
    </view>

    <!-- Search Box -->
    <view class="search-box">
      <input
        v-model="searchQuery"
        :placeholder="t('searchPlaceholder')"
        class="search-input"
        @input="checkAvailability"
      />
      <text class="domain-suffix">.neo</text>
    </view>

    <!-- Search Result -->
    <view v-if="searchQuery && searchResult" class="result-card">
      <view class="result-header">
        <text class="result-domain">{{ searchQuery }}.neo</text>
        <text class="result-status" :class="searchResult.available ? 'available' : 'taken'">
          {{ searchResult.available ? t("available") : t("taken") }}
        </text>
      </view>
      <view v-if="searchResult.available" class="result-body">
        <view class="price-row">
          <text class="price-label">{{ t("registrationPrice") }}</text>
          <text class="price-value">{{ searchResult.price }} GAS {{ t("perYear") }}</text>
        </view>
        <button class="register-btn" :disabled="loading" @click="handleRegister">
          {{ loading ? t("processing") : t("registerNow") }}
        </button>
      </view>
      <view v-else class="result-body">
        <text class="owner-label">{{ t("owner") }}</text>
        <text class="owner-value">{{ shortenAddress(searchResult.owner) }}</text>
      </view>
    </view>

    <!-- Tab Switcher -->
    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 'my' }" @click="activeTab = 'my'">
        <text>{{ t("tabMyDomains") }}</text>
      </view>
      <view class="tab" :class="{ active: activeTab === 'explore' }" @click="activeTab = 'explore'">
        <text>{{ t("tabExplore") }}</text>
      </view>
    </view>

    <!-- My Domains -->
    <view v-if="activeTab === 'my'" class="panel">
      <view v-if="myDomains.length === 0" class="empty-state">
        <text>{{ t("noDomains") }}</text>
      </view>
      <view v-for="domain in myDomains" :key="domain.name" class="domain-card">
        <view class="domain-info">
          <text class="domain-name">{{ domain.name }}</text>
          <text class="domain-expiry">{{ t("expires") }}: {{ formatDate(domain.expiry) }}</text>
        </view>
        <view class="domain-actions">
          <button class="action-btn-sm" @click="showManage(domain)">{{ t("manage") }}</button>
          <button class="action-btn-sm renew" @click="handleRenew(domain)">{{ t("renew") }}</button>
        </view>
      </view>
    </view>

    <!-- Explore -->
    <view v-if="activeTab === 'explore'" class="panel">
      <text class="section-title">{{ t("recentlyRegistered") }}</text>
      <view v-for="domain in recentDomains" :key="domain.name" class="domain-card">
        <view class="domain-info">
          <text class="domain-name">{{ domain.name }}</text>
          <text class="domain-owner">{{ shortenAddress(domain.owner) }}</text>
        </view>
      </view>
    </view>

    <!-- Status -->
    <view v-if="statusMessage" class="status" :class="statusType">
      <text>{{ statusMessage }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useWallet, usePayments } from "@neo/uniapp-sdk";
import { createT } from "@/shared/utils/i18n";

const translations = {
  title: { en: "Neo Name Service", zh: "Neo 域名服务" },
  subtitle: { en: "Your Identity on Neo", zh: "您在 Neo 上的身份" },
  searchPlaceholder: { en: "Search for a .neo domain", zh: "搜索 .neo 域名" },
  available: { en: "Available", zh: "可用" },
  taken: { en: "Taken", zh: "已被占用" },
  registrationPrice: { en: "Registration Price", zh: "注册价格" },
  perYear: { en: "/ year", zh: "/ 年" },
  registerNow: { en: "Register Now", zh: "立即注册" },
  processing: { en: "Processing...", zh: "处理中..." },
  owner: { en: "Owner", zh: "所有者" },
  tabMyDomains: { en: "My Domains", zh: "我的域名" },
  tabExplore: { en: "Explore", zh: "探索" },
  noDomains: { en: "You don't own any domains yet", zh: "您还没有域名" },
  expires: { en: "Expires", zh: "到期时间" },
  manage: { en: "Manage", zh: "管理" },
  renew: { en: "Renew", zh: "续费" },
  recentlyRegistered: { en: "Recently Registered", zh: "最近注册" },
  registered: { en: "registered!", zh: "已注册！" },
  renewed: { en: "renewed!", zh: "已续费！" },
  registrationFailed: { en: "Registration failed", zh: "注册失败" },
  renewalFailed: { en: "Renewal failed", zh: "续费失败" },
  managing: { en: "Managing", zh: "管理中" },
};

const t = createT(translations);

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

// State
const activeTab = ref<"my" | "explore">("my");
const searchQuery = ref("");
const searchResult = ref<SearchResult | null>(null);
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const userAddress = ref("");

const myDomains = ref<Domain[]>([{ name: "alice.neo", owner: "", expiry: Date.now() + 365 * 24 * 60 * 60 * 1000 }]);

const recentDomains = ref<Domain[]>([
  { name: "neo.neo", owner: "NXneo123", expiry: 0 },
  { name: "defi.neo", owner: "NXdefi456", expiry: 0 },
  { name: "nft.neo", owner: "NXnft789", expiry: 0 },
]);

// Methods
function shortenAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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
  // Simulate availability check
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
    await payGAS(searchResult.value.price.toString(), `nns:register:${searchQuery.value}`);
    const domain: Domain = {
      name: `${searchQuery.value}.neo`,
      owner: userAddress.value,
      expiry: Date.now() + 365 * 24 * 60 * 60 * 1000,
    };
    myDomains.value.unshift(domain);
    showStatus(`${searchQuery.value}.neo ${t("registered")}`, "success");
    searchQuery.value = "";
    searchResult.value = null;
  } catch (e: any) {
    showStatus(e.message || t("registrationFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleRenew(domain: Domain) {
  loading.value = true;
  try {
    await payGAS("10", `nns:renew:${domain.name}`);
    domain.expiry += 365 * 24 * 60 * 60 * 1000;
    showStatus(`${domain.name} ${t("renewed")}`, "success");
  } catch (e: any) {
    showStatus(e.message || t("renewalFailed"), "error");
  } finally {
    loading.value = false;
  }
}

function showManage(domain: Domain) {
  showStatus(`${t("managing")} ${domain.name}`, "success");
}

onMounted(async () => {
  await connect();
  userAddress.value = address.value || "";
  myDomains.value.forEach((d) => (d.owner = userAddress.value));
});
</script>

<style lang="scss" scoped>
.container {
  padding: 20px;
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
}

.header {
  text-align: center;
  margin-bottom: 24px;
}

.title {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #a855f7;
}

.subtitle {
  display: block;
  font-size: 14px;
  color: #888;
  margin-top: 4px;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  padding: 12px 16px;
  font-size: 16px;
  color: #fff;
}

.domain-suffix {
  padding: 12px 16px;
  color: #a855f7;
  font-weight: 600;
}

.result-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-domain {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}

.result-status {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
}

.result-status.available {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.result-status.taken {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.price-label {
  color: #888;
}

.price-value {
  color: #a855f7;
  font-weight: 600;
}

.owner-label {
  display: block;
  color: #888;
  font-size: 12px;
}

.owner-value {
  display: block;
  color: #fff;
  margin-top: 4px;
}

.register-btn {
  width: 100%;
  padding: 14px;
  background: #a855f7;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-weight: 600;
}

.tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.tab {
  flex: 1;
  padding: 12px;
  text-align: center;
  border-radius: 8px;
  color: #888;
}

.tab.active {
  background: #a855f7;
  color: #fff;
  font-weight: 600;
}

.panel {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.section-title {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 12px;
}

.domain-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
}

.domain-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.domain-expiry,
.domain-owner {
  display: block;
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.domain-actions {
  display: flex;
  gap: 8px;
}

.action-btn-sm {
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.action-btn-sm.renew {
  background: #a855f7;
}

.status {
  position: fixed;
  bottom: 20px;
  left: 20px;
  right: 20px;
  padding: 12px;
  border-radius: 8px;
  text-align: center;
}

.status.success {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
}

.status.error {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}
</style>
