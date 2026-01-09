<template>
  <AppLayout :title="t('title')" show-top-nav :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab !== 'docs'" class="app-container">
      <NeoCard v-if="statusMessage" :variant="statusType === 'error' ? 'danger' : 'success'" class="mb-4 text-center">
        <text class="font-bold">{{ statusMessage }}</text>
      </NeoCard>

      <!-- Register Tab -->
      <view v-if="activeTab === 'register'" class="tab-content">
        <view class="mb-4">
          <NeoInput
            v-model="searchQuery"
            :placeholder="t('searchPlaceholder')"
            suffix=".neo"
            @input="checkAvailability"
          />
        </view>

        <NeoCard
          v-if="searchQuery && searchResult"
          :variant="searchResult.available ? 'success' : 'danger'"
          class="result-card"
        >
          <view class="result-header">
            <view class="domain-title-row">
              <text class="result-domain">{{ searchQuery }}.neo</text>
              <text v-if="searchQuery.length <= 3" class="premium-badge">{{ t("premium") }}</text>
            </view>
            <text
              class="result-status font-bold uppercase"
              :class="searchResult.available ? 'text-green-700' : 'text-red-700'"
            >
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
            <NeoButton :disabled="loading" :loading="loading" @click="handleRegister" block size="lg" variant="primary">
              {{ t("registerNow") }}
            </NeoButton>
          </view>
          <view v-else class="result-body taken-body">
            <view class="owner-info">
              <text class="owner-label">{{ t("owner") }}</text>
              <text class="owner-value">{{ shortenAddress(searchResult.owner!) }}</text>
            </view>
          </view>
        </NeoCard>
      </view>

      <!-- Domains Tab -->
      <view v-if="activeTab === 'domains'" class="tab-content">
        <NeoCard :title="t('tabDomains')" icon="folder">
          <view v-if="myDomains.length === 0" class="empty-state">
            <text>{{ t("noDomains") }}</text>
          </view>
          <view v-for="domain in myDomains" :key="domain.name" class="domain-item mb-4 pb-4 border-b border-gray-200">
            <view class="domain-card-header mb-2 flex justify-between">
              <view class="domain-info">
                <text class="domain-name font-bold text-lg">{{ domain.name }}</text>
                <text class="domain-expiry text-sm text-gray-500"
                  >{{ t("expires") }}: {{ formatDate(domain.expiry) }}</text
                >
              </view>
              <view class="domain-status-indicator active"></view>
            </view>
            <view class="domain-actions flex gap-2">
              <NeoButton size="sm" variant="secondary" @click="showManage(domain)">{{ t("manage") }}</NeoButton>
              <NeoButton size="sm" variant="primary" @click="handleRenew(domain)">{{ t("renew") }}</NeoButton>
            </view>
          </view>
        </NeoCard>
      </view>
    </view>

    <!-- Docs Tab - Outside app-container to ensure top alignment -->
    <view v-else class="tab-content scrollable">
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
import { AppLayout, NeoDoc, AppIcon, NeoButton, NeoCard, NeoInput } from "@/shared/components";

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
  docSubtitle: {
    en: "Human-readable .neo domain names for Neo addresses",
    zh: "Neo 地址的人类可读 .neo 域名",
  },
  docDescription: {
    en: "Neo Name Service lets you register memorable .neo domains that map to your wallet address. Send and receive assets using simple names like alice.neo instead of complex addresses.",
    zh: "Neo 域名服务让您注册易记的 .neo 域名，映射到您的钱包地址。使用简单的名称如 alice.neo 发送和接收资产，而不是复杂的地址。",
  },
  step1: {
    en: "Connect your Neo wallet and search for available domain names",
    zh: "连接您的 Neo 钱包并搜索可用域名",
  },
  step2: {
    en: "Check availability and pricing (shorter names are premium)",
    zh: "检查可用性和价格（较短的名称为高级域名）",
  },
  step3: {
    en: "Register your domain by paying the registration fee in GAS",
    zh: "支付 GAS 注册费来注册您的域名",
  },
  step4: {
    en: "Manage your domains - renew before expiry to keep ownership",
    zh: "管理您的域名 - 在到期前续费以保持所有权",
  },
  feature1Name: { en: "Simple Addresses", zh: "简单地址" },
  feature1Desc: {
    en: "Replace complex wallet addresses with memorable .neo names.",
    zh: "用易记的 .neo 名称替换复杂的钱包地址。",
  },
  feature2Name: { en: "Full Ownership", zh: "完全所有权" },
  feature2Desc: {
    en: "Your domain is an NFT - transfer, sell, or manage it freely.",
    zh: "您的域名是 NFT - 可自由转让、出售或管理。",
  },
};

const t = createT(translations);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-neo-ns";
const { address, connect } = useWallet();
const { payGAS } = usePayments(APP_ID);

interface SearchResult {
  available: boolean;
  price?: number;
  owner?: string;
}

interface Domain {
  name: string;
  owner: string;
  expiry: number;
}

const activeTab = ref("register");
const navTabs = [
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
  if (!searchResult.value?.available || searchResult.value.price === undefined || loading.value) return;
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
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.result-card {
  margin-top: 24px;
  background: linear-gradient(135deg, rgba(159, 157, 243, 0.05) 0%, rgba(123, 121, 209, 0.03) 100%);
  border: 1px solid rgba(159, 157, 243, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);

  &.variant-success {
    background: radial-gradient(circle at top right, rgba(0, 229, 153, 0.1), transparent 70%),
                rgba(255, 255, 255, 0.03);
    border-color: rgba(0, 229, 153, 0.2);
    box-shadow: 0 0 30px rgba(0, 229, 153, 0.1);
  }
  &.variant-danger {
    background: radial-gradient(circle at top right, rgba(239, 68, 68, 0.1), transparent 70%),
                rgba(255, 255, 255, 0.03);
    border-color: rgba(239, 68, 68, 0.2);
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.1);
  }
}

.result-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.domain-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.result-domain {
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  text-shadow: 0 0 15px rgba(0, 229, 153, 0.3);
  color: white;
}
.premium-badge {
  background: rgba(138, 43, 226, 0.2);
  color: #ccaadd;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid rgba(138, 43, 226, 0.3);
  box-shadow: 0 0 10px rgba(138, 43, 226, 0.2);
  border-radius: 99px;
  letter-spacing: 0.05em;
}
.result-status {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 6px 14px;
  border-radius: 99px;
  letter-spacing: 0.1em;
  border: none;

  &.text-green-700 {
    background: rgba(0, 229, 153, 0.1);
    color: #00E599 !important;
    border: 1px solid rgba(0, 229, 153, 0.2);
    box-shadow: 0 0 15px rgba(0, 229, 153, 0.2);
  }
  &.text-red-700 {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444 !important;
    border: 1px solid rgba(239, 68, 68, 0.2);
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
  }
}

.result-body {
  padding: 20px;
}
.price-display {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
  border-radius: 16px;
}
.price-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  letter-spacing: 0.1em;
}
.price-value {
  font-weight: 700;
  font-size: 48px;
  font-family: 'Inter', sans-serif;
  color: white;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
  
  &.premium-price {
    color: #d8b4fe;
    text-shadow: 0 0 30px rgba(168, 85, 247, 0.4);
  }
}
.price-period {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: 8px;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
}

.owner-info {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.05));
  padding: 16px;
  border-radius: 12px;
  color: white;
}
.owner-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  display: block;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
  margin-bottom: 4px;
  letter-spacing: 0.1em;
}
.owner-value {
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.domain-item {
  padding: 20px;
  background: linear-gradient(135deg, rgba(159, 157, 243, 0.05) 0%, rgba(123, 121, 209, 0.03) 100%);
  border: 1px solid rgba(159, 157, 243, 0.2);
  border-radius: 16px;
  margin-bottom: 16px;
  transition: all 0.2s ease;
  backdrop-filter: blur(20px);
  
  &:hover {
    transform: translateY(-2px);
    background: linear-gradient(135deg, rgba(159, 157, 243, 0.1) 0%, rgba(123, 121, 209, 0.06) 100%);
    border-color: rgba(159, 157, 243, 0.4);
    box-shadow: 0 10px 40px -10px rgba(159, 157, 243, 0.2);
  }
}
.domain-info {
  margin-bottom: 16px;
  border-left: 3px solid #00E599;
  padding-left: 16px;
}
.domain-name {
  font-weight: 700;
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  display: block;
  text-transform: uppercase;
  color: white;
  margin-bottom: 4px;
}
.domain-expiry {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary, rgba(255, 255, 255, 0.5));
}

.domain-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  font-style: italic;
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
  font-size: 14px;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
