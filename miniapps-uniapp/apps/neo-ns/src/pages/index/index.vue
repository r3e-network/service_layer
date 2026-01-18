<template>
  <AppLayout  :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <view v-if="activeTab !== 'docs'" class="app-container">
      <view v-if="chainType === 'evm'" class="mb-4">
        <NeoCard variant="danger">
          <view class="flex flex-col items-center gap-2 py-1">
            <text class="text-center font-bold text-red-400">{{ t("wrongChain") }}</text>
            <text class="text-xs text-center opacity-80 text-white">{{ t("wrongChainMessage") }}</text>
            <NeoButton size="sm" variant="secondary" class="mt-2" @click="() => switchChain('neo-n3-mainnet')">{{
              t("switchToNeo")
            }}</NeoButton>
          </view>
        </NeoCard>
      </view>

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
        <view v-if="managingDomain" class="manage-view">
          <NeoCard class="mb-4">
            <view class="manage-header mb-4">
              <text class="manage-title font-bold text-xl">{{ t("manageTitle") }}: {{ managingDomain.name }}</text>
              <NeoButton size="sm" variant="secondary" @click="cancelManage">{{ t("cancelManage") }}</NeoButton>
            </view>
            
            <view class="manage-details mb-4">
              <text class="detail-label">{{ t("currentOwner") }}:</text>
              <text class="detail-value mono">{{ shortenAddress(managingDomain.owner) }}</text>
              <text class="detail-label mt-2">{{ t("targetAddress") }}:</text>
              <text class="detail-value mono">{{ managingDomain.target ? shortenAddress(managingDomain.target) : t("notSet") }}</text>
              <text class="detail-label mt-2">{{ t("currentExpiry") }}:</text>
              <text class="detail-expiry">{{ formatDate(managingDomain.expiry) }}</text>
            </view>

            <view class="manage-actions-group">
               <view class="action-card mb-4">
                 <text class="action-title mb-2 block font-bold">{{ t("setTarget") }}</text>
                 <NeoInput v-model="targetAddressInput" :placeholder="t('targetAddress')" class="mb-2" />
                 <NeoButton :loading="loading" :disabled="loading" block @click="handleSetTarget">{{ t("setTarget") }}</NeoButton>
               </view>

               <view class="action-card">
                 <text class="action-title mb-2 block font-bold text-red-500">{{ t("transferDomain") }}</text>
                 <NeoInput v-model="transferAddressInput" :placeholder="t('receiverAddress')" class="mb-2" />
                 <NeoButton :loading="loading" :disabled="loading" block variant="danger" @click="handleTransfer">{{ t("transferDomain") }}</NeoButton>
               </view>
            </view>
          </NeoCard>
        </view>

        <NeoCard v-else icon="folder">
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
import { ref, computed, onMounted, watch } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { parseInvokeResult } from "@/shared/utils/neo";
import { AppLayout, NeoDoc, AppIcon, NeoButton, NeoCard, NeoInput } from "@/shared/components";


const { t } = useI18n();

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);
const APP_ID = "miniapp-neo-ns";
const NNS_CONTRACT = "0x50ac1c37690cc2cfc594472833cf57505d5f46de";
const { address, connect, chainType, switchChain, invokeRead, invokeContract } = useWallet() as any;

interface SearchResult {
  available: boolean;
  price?: number;
  owner?: string;
}

interface Domain {
  name: string;
  owner: string;
  expiry: number;
  target?: string;
}

const activeTab = ref("register");
const navTabs = computed(() => [
  { id: "register", icon: "plus", label: t("tabRegister") },
  { id: "domains", icon: "folder", label: t("tabDomains") },
  { id: "docs", icon: "book", label: t("docs") },
]);

const searchQuery = ref("");
const searchResult = ref<SearchResult | null>(null);
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const userAddress = ref("");
const myDomains = ref<Domain[]>([]);
const searchDebounce = ref<ReturnType<typeof setTimeout> | null>(null);

const managingDomain = ref<Domain | null>(null);
const targetAddressInput = ref("");
const transferAddressInput = ref("");

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

// Convert domain name to token ID (UTF-8 bytes as base64)
function domainToTokenId(name: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(name.toLowerCase() + ".neo");
  return btoa(String.fromCharCode(...bytes));
}

// Real NNS contract call: check availability
async function checkAvailability() {
  if (!searchQuery.value || searchQuery.value.length < 1) {
    searchResult.value = null;
    return;
  }

  // Debounce the search
  if (searchDebounce.value) {
    clearTimeout(searchDebounce.value);
  }

  searchDebounce.value = setTimeout(async () => {
    try {
      loading.value = true;
      const name = searchQuery.value.toLowerCase();

      // Call isAvailable on NNS contract
      const availableResult = await invokeRead({
        contractHash: NNS_CONTRACT,
        operation: "isAvailable",
        args: [{ type: "String", value: name + ".neo" }],
      });
      const isAvailable = Boolean(parseInvokeResult(availableResult));

      // Get price based on name length
      const priceResult = await invokeRead({
        contractHash: NNS_CONTRACT,
        operation: "getPrice",
        args: [{ type: "Integer", value: name.length }],
      });
      const priceRaw = Number(parseInvokeResult(priceResult) || 0);
      const price = priceRaw / 1e8; // Convert from GAS decimals

      if (isAvailable) {
        searchResult.value = { available: true, price };
      } else {
        // Get owner if not available
        try {
          const ownerResult = await invokeRead({
            contractHash: NNS_CONTRACT,
            operation: "ownerOf",
            args: [{ type: "ByteArray", value: domainToTokenId(name) }],
          });
          const owner = String(parseInvokeResult(ownerResult) || "");
          searchResult.value = { available: false, owner };
        } catch {
          searchResult.value = { available: false, owner: t("unknownOwner") };
        }
      }
    } catch (e: any) {
      searchResult.value = null;
      showStatus(e.message || t("availabilityFailed"), "error");
    } finally {
      loading.value = false;
    }
  }, 500);
}

async function handleRegister() {
  if (!searchResult.value?.available || searchResult.value.price === undefined || loading.value) return;
  if (!address.value) {
    showStatus(t("connectWalletFirst"), "error");
    return;
  }

  loading.value = true;
  try {
    const name = searchQuery.value.toLowerCase();

    // Call register on NNS contract
    await invokeContract({
      scriptHash: NNS_CONTRACT,
      operation: "register",
      args: [
        { type: "String", value: name + ".neo" },
        { type: "Hash160", value: address.value },
      ],
    });

    showStatus(name + ".neo " + t("registered"), "success");
    searchQuery.value = "";
    searchResult.value = null;

    // Refresh my domains
    await loadMyDomains();
    activeTab.value = "domains";
  } catch (e: any) {
    showStatus(e.message || t("registrationFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleRenew(domain: Domain) {
  if (!address.value) {
    showStatus(t("connectWalletFirst"), "error");
    return;
  }

  loading.value = true;
  try {
    // Call renew on NNS contract
    await invokeContract({
      scriptHash: NNS_CONTRACT,
      operation: "renew",
      args: [{ type: "String", value: domain.name }],
    });

    showStatus(domain.name + " " + t("renewed"), "success");
    // Refresh my domains to get updated expiry
    await loadMyDomains();
  } catch (e: any) {
    showStatus(e.message || t("renewalFailed"), "error");
  } finally {
    loading.value = false;
  }
}

function showManage(domain: Domain) {
  managingDomain.value = domain;
  targetAddressInput.value = "";
  transferAddressInput.value = "";
}

function cancelManage() {
  managingDomain.value = null;
}

async function handleSetTarget() {
  if (!managingDomain.value || !targetAddressInput.value) return;
  if (!address.value) {
    showStatus(t("connectWalletFirst"), "error");
    return;
  }

  loading.value = true;
  try {
    await invokeContract({
      scriptHash: NNS_CONTRACT,
      operation: "setTarget",
      args: [
        { type: "String", value: managingDomain.value.name },
        { type: "Hash160", value: targetAddressInput.value },
      ],
    });

    showStatus(t("targetSet"), "success");
    targetAddressInput.value = "";
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleTransfer() {
  if (!managingDomain.value || !transferAddressInput.value) return;
  // Basic address validation could be added here
  
  loading.value = true;
  try {
     // Transfer is typically transfer(to, tokenId, data) on NEP-11
     // Need token ID
    const tokenId = domainToTokenId(managingDomain.value.name.replace('.neo', ''));
    
    await invokeContract({
      scriptHash: NNS_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: transferAddressInput.value },
        { type: "ByteArray", value: tokenId },
        { type: "Any", value: null }, 
      ],
    });

    showStatus(t("transferred"), "success");
    managingDomain.value = null;
    await loadMyDomains();
  } catch (e: any) {
    showStatus(e.message || t("error"), "error");
  } finally {
    loading.value = false;
  }
}


// Load user's domains from NNS contract
async function loadMyDomains() {
  if (!address.value) {
    myDomains.value = [];
    return;
  }

  try {
    // Get all tokens owned by the user
    const tokensResult = await invokeRead({
      contractHash: NNS_CONTRACT,
      operation: "tokensOf",
      args: [{ type: "Hash160", value: address.value }],
    });

    const tokens = parseInvokeResult(tokensResult);
    if (!tokens || !Array.isArray(tokens)) {
      myDomains.value = [];
      return;
    }

    // Get properties for each domain
    const domains: Domain[] = [];
    for (const tokenId of tokens) {
      try {
        const propsResult = await invokeRead({
          contractHash: NNS_CONTRACT,
          operation: "properties",
          args: [{ type: "ByteArray", value: tokenId }],
        });
        const props = parseInvokeResult(propsResult) as Record<string, any>;
        if (props) {
          // Decode domain name from token ID
          let name = "";
          try {
            const bytes = Uint8Array.from(atob(tokenId), (c) => c.charCodeAt(0));
            name = new TextDecoder().decode(bytes);
          } catch {
            name = String(props.name || tokenId);
          }

          domains.push({
            name: name,
            owner: address.value,
            expiry: Number(props.expiration || 0) * 1000,
            target: props.target ? String(props.target) : undefined,
          });
        }
      } catch {
      }
    }

    myDomains.value = domains.sort((a, b) => b.expiry - a.expiry);
  } catch (e: any) {
    myDomains.value = [];
  }
}

onMounted(async () => {
  await connect();
  userAddress.value = address.value || "";
  if (address.value) {
    await loadMyDomains();
  }
});

watch(address, async (newAddr) => {
  userAddress.value = newAddr || "";
  if (newAddr) {
    await loadMyDomains();
  } else {
    myDomains.value = [];
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;600;700&display=swap');

$dir-bg: #000000;
$dir-green: #00ff00;
$dir-dim-green: #003300;
$dir-font: 'Fira Code', monospace;

:global(page) {
  background: $dir-bg;
  font-family: $dir-font;
}

.app-container {
  padding: 24px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: $dir-bg;
  /* Scanlines */
  background-image: linear-gradient(rgba(18, 16, 16, 0.2) 50%, rgba(0, 0, 0, 0.4) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
  min-height: 100vh;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

/* Directory Component Overrides */
:deep(.neo-card) {
  background: black !important;
  border: 1px solid $dir-green !important;
  border-radius: 0 !important;
  box-shadow: 0 0 10px $dir-green !important;
  color: $dir-green !important;
  font-family: $dir-font !important;

  &.variant-danger {
    border-color: red !important;
    box-shadow: 0 0 10px red !important;
    color: red !important;
    
    .text-center { color: red !important; }
    .text-xs { color: red !important; opacity: 0.8; }
  }
}

:deep(.neo-button) {
  border-radius: 0 !important;
  font-family: $dir-font !important;
  text-transform: uppercase;
  font-weight: bold !important;
  
  &.variant-primary {
    background: $dir-green !important;
    color: black !important;
    border: 1px solid $dir-green !important;
    
    &:active {
      background: $dir-dim-green !important;
      color: $dir-green !important;
    }
  }
  
  &.variant-secondary {
    background: black !important;
    border: 1px solid $dir-green !important;
    color: $dir-green !important;
    
    &:hover {
      background: $dir-dim-green !important;
    }
  }
}

:deep(input), :deep(.neo-input) {
  background: black !important;
  border: 1px solid $dir-green !important;
  color: $dir-green !important;
  font-family: $dir-font !important;
  border-radius: 0 !important;
  
  &:focus {
    box-shadow: 0 0 15px $dir-green !important;
  }
}

.result-card {
  margin-top: 24px;
  background: black;
  border: 2px solid $dir-green;
  
  &.variant-success {
    border-color: $dir-green;
    box-shadow: 0 0 20px $dir-green;
  }
  &.variant-danger {
    border-color: red;
    box-shadow: 0 0 20px red;
  }
}

.result-header {
  padding: 20px;
  border-bottom: 1px dashed $dir-green;
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
  font-family: $dir-font;
  font-size: 20px;
  color: $dir-green;
  text-transform: uppercase;
}

.premium-badge {
  background: $dir-green;
  color: black;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  border: 1px solid $dir-green;
}

.result-status {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 6px 14px;
  border: 1px solid;

  &.text-green-700 {
    background: ttransparent;
    color: $dir-green !important;
    border-color: $dir-green;
    animation: blink 1s infinite;
  }
  &.text-red-700 {
    background: transparent;
    color: red !important;
    border-color: red;
  }
}

@keyframes blink {
  50% { opacity: 0.5; }
}

.result-body {
  padding: 20px;
}

.price-display {
  background: $dir-dim-green;
  border: 1px solid $dir-green;
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
}

.price-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  display: block;
  margin-bottom: 8px;
  color: $dir-green;
}

.price-value {
  font-weight: 700;
  font-size: 32px;
  font-family: $dir-font;
  color: $dir-green;
  
  &.premium-price {
    color: yellow;
    text-shadow: 0 0 10px yellow;
  }
}

.price-period {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  margin-left: 8px;
  color: $dir-green;
}

.owner-info {
  background: black;
  border: 1px solid red;
  padding: 16px;
  color: red;
}

.owner-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  display: block;
  color: red;
  margin-bottom: 4px;
}

.owner-value {
  font-family: $dir-font;
  font-size: 14px;
  font-weight: 600;
  color: red;
}

.domain-item {
  padding: 20px;
  background: black;
  border: 1px solid $dir-green;
  margin-bottom: 16px;
  
  &:hover {
    background: $dir-dim-green;
  }
}

.domain-info {
  margin-bottom: 16px;
  border-left: 3px solid $dir-green;
  padding-left: 16px;
}

.domain-name {
  font-weight: 700;
  font-family: $dir-font;
  font-size: 20px;
  display: block;
  text-transform: uppercase;
  color: $dir-green;
  margin-bottom: 4px;
}

.domain-expiry {
  font-size: 12px;
  font-weight: 500;
  color: $dir-green;
  opacity: 0.8;
}

.domain-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.empty-state {
  text-align: center;
  padding: 48px;
  border: 1px dashed $dir-green;
  color: $dir-green;
  font-family: $dir-font;
}

.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.manage-view {
  animation: fadeIn 0.3s ease;
}

.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $dir-green;
  padding-bottom: 12px;
}

.manage-title {
  color: $dir-green;
  text-transform: uppercase;
}

.detail-label {
  font-size: 12px;
  color: $dir-green;
  opacity: 0.7;
  text-transform: uppercase;
  display: block;
}

.detail-value, .detail-expiry {
  font-size: 16px;
  color: $dir-green;
  font-weight: 600;
  display: block;
  margin-bottom: 4px;
}

.mono {
  font-family: $dir-font;
}

.action-card {
  border: 1px dashed $dir-green;
  padding: 16px;
}

.action-title {
  color: $dir-green;
  text-transform: uppercase;
  font-size: 12px;
}

.text-red-500 {
  color: red !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
