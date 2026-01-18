<template>
  <AppLayout :tabs="navTabs" :active-tab="activeTab" @tab-change="activeTab = $event">
    <NeoCard
      v-if="statusMessage"
      :variant="statusType === 'error' ? 'danger' : 'success'"
      class="status-card"
    >
      <text class="status-text">{{ statusMessage }}</text>
    </NeoCard>

    <view v-if="chainType === 'evm'" class="chain-warning">
      <NeoCard variant="danger">
        <view class="chain-warning-content">
          <text class="status-text">{{ t("wrongChain") }}</text>
          <text class="chain-warning-message">{{ t("wrongChainMessage") }}</text>
          <NeoButton size="sm" variant="secondary" @click="() => switchChain('neo-n3-mainnet')">
            {{ t("switchToNeo") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>

    <view v-if="activeTab === 'home'" class="neoburger-shell">
      <view class="hero fade-up">
        <view class="hero-content">
          <image
            class="hero-logo"
            src="/static/neoburger-logo-white.svg"
            mode="widthFix"
            :alt="t('heroLogoAlt')"
          />
          <text class="hero-title">{{ t("heroTitle") }}</text>
          <text class="hero-subtitle">{{ t("heroSubtitle") }}</text>

          <view class="hero-bubbles">
            <view class="hero-bubble">
              <text class="bubble-title">{{ t("totalBneoSupply") }}</text>
              <text class="bubble-value">{{ totalStakedDisplay }}</text>
              <text class="bubble-subvalue">{{ totalStakedUsdText }}</text>
            </view>
            <view class="hero-bubble">
              <text class="bubble-title">{{ t("apr") }}</text>
              <text class="bubble-value">{{ aprDisplay }}</text>
              <text class="bubble-subvalue">{{ t("aprTag") }}</text>
            </view>
          </view>
        </view>

        <view class="hero-media">
          <image
            class="hero-background"
            src="/static/neoburger-m-background.svg"
            mode="widthFix"
            :alt="t('heroBackgroundAlt')"
          />
          <image
            class="hero-gif"
            src="/static/neoburger-intro.gif"
            mode="widthFix"
            :alt="t('heroIntroAlt')"
          />
        </view>
      </view>

      <view class="station fade-up delay-1">
        <view class="station-tabs">
          <button
            class="station-tab"
            :class="{ active: homeMode === 'burger' }"
            @click="homeMode = 'burger'"
          >
            {{ t("burgerStation") }}
          </button>
          <button
            class="station-tab"
            :class="{ active: homeMode === 'jazz' }"
            @click="homeMode = 'jazz'"
          >
            {{ t("jazzUp") }}
          </button>
        </view>

        <view v-if="homeMode === 'burger'" class="station-card">
          <view class="station-header">
            <text class="station-title">{{ t("burgerStation") }}</text>
            <view class="station-learn" @click="activeTab = 'docs'">
              <image
                class="learn-icon"
                src="/static/neoburger-learn-more.svg"
                mode="widthFix"
                :alt="t('learnMore')"
              />
              <text>{{ t("learnMore") }}</text>
            </view>
          </view>

          <view class="swap-panel">
            <view class="swap-block">
              <view class="swap-row">
                <text class="swap-label">{{ t("from") }}</text>
                <text class="swap-hint">
                  {{ t("balance") }}:
                  {{ formatAmount(swapMode === 'stake' ? neoBalance : bNeoBalance) }}
                  {{ swapMode === 'stake' ? t("tokenNeo") : t("tokenBneo") }}
                </text>
              </view>
              <view class="swap-input">
                <view class="swap-asset">
                  <image
                    class="swap-asset-icon"
                    :src="swapMode === 'stake' ? '/static/neoburger-neo-logo.svg' : '/static/neoburger-bneo-logo.svg'"
                    mode="widthFix"
                    :alt="swapMode === 'stake' ? t('neoAlt') : t('bneoAlt')"
                  />
                  <text class="swap-asset-label">{{ swapMode === 'stake' ? t("tokenNeo") : t("tokenBneo") }}</text>
                </view>
                <NeoInput
                  :modelValue="swapAmount"
                  @update:modelValue="updateSwapAmount"
                  type="number"
                  :placeholder="t('inputPlaceholder')"
                  class="swap-input-field"
                />
              </view>
              <text class="swap-usd">{{ swapUsdText }}</text>
            </view>

            <button class="swap-toggle" @click="toggleSwapMode">
              <image
                class="swap-toggle-icon"
                src="/static/neoburger-exchange.svg"
                mode="widthFix"
                :alt="t('swapToggleAlt')"
              />
            </button>

            <view class="swap-block">
              <view class="swap-row">
                <text class="swap-label">{{ t("to") }}</text>
                <text class="swap-hint">{{ t("estimatedOutput") }}</text>
              </view>
              <view class="swap-output">
                <view class="swap-asset">
                  <image
                    class="swap-asset-icon"
                    :src="swapMode === 'stake' ? '/static/neoburger-bneo-logo.svg' : '/static/neoburger-neo-logo.svg'"
                    mode="widthFix"
                    :alt="swapMode === 'stake' ? t('bneoAlt') : t('neoAlt')"
                  />
                  <text class="swap-asset-label">{{ swapMode === 'stake' ? t("tokenBneo") : t("tokenNeo") }}</text>
                </view>
                <text class="swap-output-value">{{ swapOutput }}</text>
              </view>
            </view>
          </view>

          <text class="station-tip">{{ t("burgerTip") }}</text>

          <view class="station-actions">
            <view class="quick-amounts">
              <button class="chip" @click="setSwapAmount(0.25)">{{ t("percent25") }}</button>
              <button class="chip" @click="setSwapAmount(0.5)">{{ t("percent50") }}</button>
              <button class="chip" @click="setSwapAmount(0.75)">{{ t("percent75") }}</button>
              <button class="chip" @click="setSwapAmount(1)">{{ t("max") }}</button>
            </view>
            <NeoButton
              variant="primary"
              size="lg"
              block
              :disabled="walletConnected ? !swapCanSubmit : false"
              :loading="loading"
              @click="handlePrimaryAction"
            >
              {{ loading ? t("processing") : primaryActionLabel }}
            </NeoButton>
          </view>
        </view>

        <view v-else class="station-card jazz-card">
          <view class="station-header">
            <text class="station-title">{{ t("jazzUp") }}</text>
            <text class="station-subtitle">{{ t("jazzSubtitle") }}</text>
          </view>

          <view class="jazz-grid">
            <view class="jazz-item">
              <text class="jazz-label">{{ t("dailyRewards") }}</text>
              <text class="jazz-value">{{ dailyRewards }} {{ t("tokenGas") }}</text>
            </view>
            <view class="jazz-item">
              <text class="jazz-label">{{ t("weeklyRewards") }}</text>
              <text class="jazz-value">{{ weeklyRewards }} {{ t("tokenGas") }}</text>
            </view>
            <view class="jazz-item">
              <text class="jazz-label">{{ t("monthlyRewards") }}</text>
              <text class="jazz-value">{{ monthlyRewards }} {{ t("tokenGas") }}</text>
            </view>
            <view class="jazz-item">
              <text class="jazz-label">{{ t("totalRewards") }}</text>
              <text class="jazz-value">{{ totalRewards }} {{ t("tokenGas") }}</text>
              <text class="jazz-subvalue">{{ totalRewardsUsdText }}</text>
            </view>
          </view>

          <text class="jazz-note">{{ t("jazzNote1") }}</text>
          <text class="jazz-note">{{ t("jazzNote2") }}</text>

          <NeoButton
            variant="success"
            size="lg"
            block
            :loading="loading"
            @click="handleJazzAction"
          >
            {{ loading ? t("processing") : jazzActionLabel }}
          </NeoButton>
        </view>
      </view>

      <view class="section fade-up delay-2">
        <view class="section-media">
          <image
            class="section-image"
            src="/static/neoburger-hero.svg"
            mode="widthFix"
            :alt="t('bneoHeroAlt')"
          />
        </view>
        <view class="section-content">
          <text class="section-title">{{ t("whatIsBneoTitle") }}</text>
          <text class="section-strong">{{ t("whatIsBneoStrong") }}</text>
          <view class="section-pair">
            <text class="section-label">{{ t("bneoContractAddressLabel") }}</text>
            <text class="section-value">{{ t("bneoContractAddressValue") }}</text>
          </view>
          <view class="section-pair">
            <text class="section-label">{{ t("bneoScriptHashLabel") }}</text>
            <text class="section-value">{{ t("bneoScriptHashValue") }}</text>
          </view>
        </view>
      </view>

      <view class="section reverse fade-up delay-3">
        <view class="section-media">
          <image
            class="section-image"
            src="/static/neoburger-split.gif"
            mode="widthFix"
            :alt="t('bneoSplitAlt')"
          />
        </view>
        <view class="section-content">
          <text class="section-title">{{ t("whyNeedBneoTitle") }}</text>
          <text class="section-strong">{{ t("bneoRate") }}</text>
          <text class="section-text">{{ t("whyNeedBneoDesc1") }}</text>
          <text class="section-text">{{ t("whyNeedBneoDesc2") }}</text>
        </view>
      </view>

      <view class="section center fade-up delay-4">
        <text class="section-title">{{ t("rewardsSourceTitle") }}</text>
        <image
          class="section-image"
          src="/static/neoburger-connection.svg"
          mode="widthFix"
          :alt="t('rewardsConnectionAlt')"
        />
        <text class="section-text center">{{ t("rewardsSourceDesc") }}</text>
        <text class="section-strong center">{{ t("rewardsSourceStrong") }}</text>
      </view>

      <view class="section fade-up delay-5">
        <view class="section-content">
          <text class="section-title">{{ t("getGasRewardsTitle") }}</text>
          <text class="section-strong">
            {{ t("getGasRewardsStrong") }}
            <text class="linkish" @click="homeMode = 'jazz'">{{ t("jazzUp") }}</text>
          </text>
        </view>
        <view class="section-media">
          <image
            class="section-image"
            src="/static/neoburger-rewards.gif"
            mode="widthFix"
            :alt="t('rewardsAlt')"
          />
        </view>
      </view>

      <view class="footer fade-up delay-6">
        <image
          class="footer-logo"
          src="/static/neoburger-footer-logo.svg"
          mode="widthFix"
          :alt="t('footerLogoAlt')"
        />
        <view class="footer-links">
          <template v-for="(link, index) in footerLinks" :key="link.label">
            <text class="footer-link" @click="openExternal(link.url)">{{ link.label }}</text>
            <text v-if="index < footerLinks.length - 1" class="footer-divider">|</text>
          </template>
        </view>
      </view>
    </view>

    <view v-if="activeTab === 'airdrop'" class="page-shell airdrop-shell">
      <view class="page-hero fade-up">
        <image
          class="page-hero-logo"
          src="/static/neoburger-nobug-airdrop.svg"
          mode="widthFix"
          :alt="t('nobugAlt')"
        />
        <text class="page-hero-title">{{ t("airdropTitle") }}</text>
      </view>

      <view v-if="!walletAddress" class="card connect-card fade-up delay-1">
        <text class="section-text">{{ t("airdropConnectTip") }}</text>
        <NeoButton variant="primary" size="lg" block @click="handleConnectWallet">
          {{ t("connectWallet") }}
        </NeoButton>
      </view>

      <view class="card fade-up delay-2">
        <text class="section-title">{{ t("nobugWhatIsTitle") }}</text>
        <text class="section-text">{{ t("nobugWhatIsDesc1") }}</text>
        <text class="section-text">{{ t("nobugWhatIsDesc2") }}</text>

        <view class="token-card">
          <view class="token-row">
            <text class="token-label">{{ t("nobugSymbol") }}</text>
            <text class="token-value">{{ t("nobugSymbolValue") }}</text>
          </view>
          <view class="token-row">
            <text class="token-label">{{ t("nobugDecimals") }}</text>
            <text class="token-value">{{ t("nobugDecimalsValue") }}</text>
          </view>
          <view class="token-row">
            <text class="token-label">{{ t("nobugTotalSupply") }}</text>
            <text class="token-value">{{ t("placeholderDash") }}</text>
          </view>
          <view class="token-divider"></view>
          <text class="token-subtitle">{{ t("nobugDistributionTitle") }}</text>
          <view class="distribution-grid">
            <view class="dist-item">
              <text class="dist-percent">{{ t("percent25") }}</text>
              <text class="dist-text">{{ t("nobugDistribution25") }}</text>
            </view>
            <view class="dist-item">
              <text class="dist-percent">{{ t("percent75") }}</text>
              <text class="dist-text">{{ t("nobugDistribution75") }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="card fade-up delay-3">
        <text class="section-title">{{ t("nobugUsageTitle") }}</text>
        <view class="usage-tabs">
          <view v-for="item in nobugUsageTabs" :key="item" class="usage-tab">
            <image
              class="usage-vector"
              src="/static/neoburger-vector-right.svg"
              mode="widthFix"
              :alt="t('vectorAlt')"
            />
            <text class="usage-text">{{ item }}</text>
            <image
              class="usage-vector"
              src="/static/neoburger-vector-left.svg"
              mode="widthFix"
              :alt="t('vectorAlt')"
            />
          </view>
        </view>
        <text class="section-text">{{ t("nobugUsageDesc1") }}</text>
        <text class="section-text">{{ t("nobugUsageDesc2") }}</text>
      </view>

      <view class="card fade-up delay-4">
        <text class="section-title">{{ t("nobugDistributionDetailsTitle") }}</text>
        <view class="distribution-block">
          <text class="dist-percent large">{{ t("percent25") }}</text>
          <text class="section-subtitle">{{ t("nobugContributorsTitle") }}</text>
          <text class="section-label">{{ t("nobugContributorsWho") }}</text>
          <text class="section-text">{{ t("nobugContributorsWhoDesc") }}</text>
          <text class="section-label">{{ t("nobugContributorsPlanTitle") }}</text>
          <text class="section-text">{{ t("nobugContributorsPlanDesc1") }}</text>
          <text class="section-text">{{ t("nobugContributorsPlanDesc2") }}</text>
        </view>
        <view class="distribution-block">
          <text class="dist-percent large">{{ t("percent75") }}</text>
          <text class="section-subtitle">{{ t("nobugOnChainTitle") }}</text>
          <view class="bullet-list">
            <text v-for="item in nobugOnChainRelease" :key="item" class="bullet-item">{{ item }}</text>
          </view>
          <text class="section-label">{{ t("nobugDistributionWaysTitle") }}</text>
          <text class="section-text">{{ t("nobugDistributionWayAirdrop") }}</text>
          <view class="bullet-list">
            <text v-for="item in nobugAirdropWays" :key="item" class="bullet-item">{{ item }}</text>
          </view>
          <text class="section-text">{{ t("nobugDistributionWayTbd") }}</text>
          <view class="bullet-list">
            <text v-for="item in nobugTbdWays" :key="item" class="bullet-item">{{ item }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="activeTab === 'treasury'" class="page-shell treasury-shell">
      <view class="page-hero fade-up">
        <text class="page-hero-title">{{ t("treasuryTitle") }}</text>
      </view>

      <view class="card fade-up delay-1">
        <view class="card-header">
          <image
            class="icon"
            src="/static/neoburger-address.svg"
            mode="widthFix"
            :alt="t('treasuryAddressTitle')"
          />
          <text class="section-title">{{ t("treasuryAddressTitle") }}</text>
        </view>
        <view class="address-list">
          <view v-for="address in treasuryAddresses" :key="address" class="address-row">
            <text class="address-text">{{ address }}</text>
            <button class="icon-button" @click="copyToClipboard(address)">
              <image class="icon" src="/static/neoburger-copy.svg" mode="widthFix" :alt="t('copyAlt')" />
            </button>
          </view>
        </view>
      </view>

      <view class="card fade-up delay-2">
        <view class="card-header">
          <image class="icon" src="/static/neoburger-list.svg" mode="widthFix" :alt="t('treasuryListTitle')" />
          <text class="section-title">{{ t("treasuryListTitle") }}</text>
        </view>
        <text class="section-subtitle">{{ t("treasuryNep17") }}</text>
        <view class="asset-list">
          <view v-for="asset in treasuryAssets" :key="asset.name" class="asset-row">
            <image class="asset-icon" :src="asset.icon" mode="widthFix" :alt="asset.name" />
            <text class="asset-name">{{ asset.name }}</text>
            <text class="asset-amount">{{ asset.amount }}</text>
          </view>
        </view>
      </view>

      <view class="card fade-up delay-3">
        <view class="card-header">
          <image class="icon" src="/static/neoburger-neo-balance.svg" mode="widthFix" :alt="t('treasuryBalanceTitle')" />
          <text class="section-title">{{ t("treasuryBalanceTitle") }}</text>
        </view>
        <view class="chart-placeholder">{{ t("noData") }}</view>
      </view>

      <view class="card fade-up delay-4">
        <view class="card-header">
          <image class="icon" src="/static/neoburger-cost.svg" mode="widthFix" :alt="t('projectCostTitle')" />
          <view class="card-header-text">
            <text class="section-title">{{ t("projectCostTitle") }}</text>
            <text class="section-caption">{{ t("projectCostPeriod") }}</text>
          </view>
        </view>
        <view class="table">
          <view class="table-row table-header">
            <text>{{ t("tableEvent") }}</text>
            <text>{{ t("tableCost") }}</text>
            <text>{{ t("tableTime") }}</text>
          </view>
          <view v-for="row in projectCostRows" :key="row.event" class="table-row">
            <text>{{ row.event }}</text>
            <text>{{ row.cost }}</text>
            <text>{{ row.time }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="activeTab === 'dashboard'" class="page-shell dashboard-shell">
      <view class="page-hero fade-up">
        <text class="page-hero-title">{{ t("dashboardTitle") }}</text>
      </view>

      <view class="card token-card fade-up delay-1">
        <view class="token-header">
          <image class="token-icon" src="/static/neoburger-bneo-dashboard.svg" mode="widthFix" :alt="t('bneoAlt')" />
          <text class="token-title">{{ t("tokenBneo") }}</text>
        </view>
        <view class="token-info">
          <text>{{ t("supplyLabel") }}: {{ totalStakedDisplay }}</text>
          <text>{{ t("holderLabel") }}: {{ t("placeholderDash") }}</text>
          <text>{{ t("contractAddressLabel") }}: {{ t("bneoContractAddressValue") }}</text>
        </view>
        <view class="chart-grid">
          <view class="chart-card">
            <text class="chart-title">{{ t("bneoTotalSupplyTitle") }}</text>
            <view class="chart-tabs">
              <button class="chart-tab" :class="{ active: supplyRange === '7' }" @click="supplyRange = '7'">
                {{ t("days7") }}
              </button>
              <button class="chart-tab" :class="{ active: supplyRange === '30' }" @click="supplyRange = '30'">
                {{ t("days30") }}
              </button>
            </view>
            <view class="chart-placeholder">{{ t("noData") }}</view>
          </view>
          <view class="chart-card">
            <text class="chart-title">{{ t("dailyGasRewardsPerNeo") }}</text>
            <view class="chart-tabs">
              <button class="chart-tab" :class="{ active: rewardsRange === '7' }" @click="rewardsRange = '7'">
                {{ t("days7") }}
              </button>
              <button class="chart-tab" :class="{ active: rewardsRange === '30' }" @click="rewardsRange = '30'">
                {{ t("days30") }}
              </button>
            </view>
            <view class="chart-placeholder">{{ t("noData") }}</view>
          </view>
        </view>
      </view>

      <view class="card token-card fade-up delay-2">
        <view class="token-header">
          <image class="token-icon" src="/static/neoburger-nobug-logo.svg" mode="widthFix" :alt="t('nobugAlt')" />
          <text class="token-title">{{ t("tokenNobug") }}</text>
        </view>
        <view class="token-info">
          <text>{{ t("supplyLabel") }}: {{ t("placeholderDash") }}</text>
          <text>{{ t("holderLabel") }}: {{ t("placeholderDash") }}</text>
          <text>{{ t("contractAddressLabel") }}: {{ t("nobugContractAddressValue") }}</text>
        </view>
      </view>

      <view class="card agent-card fade-up delay-3">
        <view class="agent-header">
          <text class="section-title">{{ t("agentInfoTitle") }}</text>
          <view class="agent-right">
            <text class="agent-right-text">{{ t("candidatesWhitelist") }}</text>
            <image class="icon" src="/static/neoburger-jump-logo.svg" mode="widthFix" :alt="t('jumpAlt')" />
          </view>
        </view>
        <view class="table">
          <view class="table-row table-header">
            <text>{{ t("voteTarget") }}</text>
            <text>{{ t("votesTotal") }}</text>
            <text>{{ t("scriptHash") }}</text>
          </view>
          <view class="table-row empty-row">
            <text class="empty-text">{{ t("noData") }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="activeTab === 'docs'" class="page-shell docs-shell">
      <view class="page-hero fade-up">
        <text class="page-hero-title">{{ t("docsTitle") }}</text>
        <text class="page-hero-subtitle">{{ t("docsSubtitle") }}</text>
      </view>
      <NeoDoc
        :title="t('title')"
        :subtitle="t('docSubtitle')"
        :description="t('docDescription')"
        :steps="docSteps"
        :features="docFeatures"
      />
      <view class="card doc-link-card fade-up delay-1">
        <text class="section-title">{{ t("docsLinkTitle") }}</text>
        <text class="section-text">{{ t("docsLinkText") }}</text>
        <text class="doc-link" @click="openExternal(t('docsUrl'))">{{ t("docsUrl") }}</text>
      </view>
    </view>

    <Fireworks :active="!!statusMessage && statusType === 'success'" :duration="3000" />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWallet } from "@neo/uniapp-sdk";
import { useI18n } from "@/composables/useI18n";
import { AppLayout, NeoCard, NeoDoc, Fireworks, NeoButton, NeoInput } from "@/shared/components";
import type { NavTab } from "@/shared/components/NavBar.vue";
import { getPrices, type PriceData } from "@/shared/utils/price";

const BNEO_CONTRACT = ref<string | null>(null);
const NEO_CONTRACT = "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5";

const { t } = useI18n();

const { getAddress, invokeContract, getBalance, chainType, switchChain, getContractAddress } = useWallet() as any;

const activeTab = ref("home");
const homeMode = ref<"burger" | "jazz">("burger");
const swapMode = ref<"stake" | "unstake">("stake");
const supplyRange = ref<"7" | "30">("7");
const rewardsRange = ref<"7" | "30">("7");

const navTabs = computed<NavTab[]>(() => [
  { id: "home", icon: "home", label: t("tabHome") },
  { id: "airdrop", icon: "rocket", label: t("tabAirdrop") },
  { id: "treasury", icon: "archive", label: t("tabTreasury") },
  { id: "dashboard", icon: "stats", label: t("tabDashboard") },
  { id: "docs", icon: "book", label: t("tabDocs") },
]);

const stakeAmount = ref("");
const unstakeAmount = ref("");
const neoBalance = ref(0);
const bNeoBalance = ref(0);
const loading = ref(false);
const statusMessage = ref("");
const statusType = ref<"success" | "error">("success");
const apy = ref(0);
const animatedApy = ref("0.0");
const loadingApy = ref(true);
const priceData = ref<PriceData | null>(null);
const totalStaked = ref<number | null>(null);
const totalStakedFormatted = ref<string | null>(null);
const walletAddress = ref<string | null>(null);

let apyAnimationTimer: ReturnType<typeof setInterval> | null = null;
let statusTimer: ReturnType<typeof setTimeout> | null = null;

const swapAmount = computed({
  get: () => (swapMode.value === "stake" ? stakeAmount.value : unstakeAmount.value),
  set: (value: string) => {
    if (swapMode.value === "stake") {
      stakeAmount.value = value;
    } else {
      unstakeAmount.value = value;
    }
  },
});

const swapOutput = computed(() => {
  const amount = parseFloat(swapAmount.value);
  if (!amount) return t("placeholderDash");
  return swapMode.value === "stake" ? estimatedBneo.value : estimatedNeo.value;
});

const swapCanSubmit = computed(() => (swapMode.value === "stake" ? canStake.value : canUnstake.value));

const swapButtonLabel = computed(() => (swapMode.value === "stake" ? t("swapToBneo") : t("swapToNeo")));

const walletConnected = computed(() => !!walletAddress.value);

const primaryActionLabel = computed(() => (walletConnected.value ? swapButtonLabel.value : t("connectWallet")));

const jazzActionLabel = computed(() => (walletConnected.value ? t("claimRewards") : t("connectWallet")));

const swapUsdText = computed(() => {
  const price = priceData.value?.neo.usd ?? 0;
  const rawAmount = parseFloat(swapAmount.value);
  const amount = swapMode.value === "stake" ? Math.floor(rawAmount || 0) : rawAmount || 0;
  if (!price || !amount) return t("approxUsdPlaceholder");
  return t("approxUsd", { value: (amount * price).toFixed(2) });
});

const totalRewardsUsdText = computed(() => t("approxUsd", { value: totalRewardsUsd.value }));

const aprDisplay = computed(() => (loadingApy.value ? t("apyPlaceholder") : `${animatedApy.value}%`));

const totalStakedDisplay = computed(() => {
  if (totalStakedFormatted.value) return totalStakedFormatted.value;
  if (totalStaked.value === null) return t("placeholderDash");
  return formatCompactNumber(totalStaked.value);
});

const totalStakedUsdText = computed(() => {
  const price = priceData.value?.neo.usd ?? 0;
  if (!price || totalStaked.value === null) return t("usdPlaceholder");
  return t("approxUsd", { value: formatCompactNumber(totalStaked.value * price) });
});

const nobugUsageTabs = computed(() => [t("nobugUsageRaise"), t("nobugUsageVote"), t("nobugUsageDelegate")]);

const nobugOnChainRelease = computed(() => [t("nobugOnChainRelease1"), t("nobugOnChainRelease2")]);

const nobugAirdropWays = computed(() => [
  t("nobugDistributionWayCommunity"),
  t("nobugDistributionWayEarlyUsers"),
]);

const nobugTbdWays = computed(() => [
  t("nobugDistributionWayOnChainMining"),
  t("nobugDistributionWayStake"),
  t("nobugDistributionWayTbdItem"),
]);

const treasuryAddresses = computed(() => [t("treasuryAddress1"), t("treasuryAddress2")]);

const treasuryAssets = computed(() => [
  { icon: "/static/neoburger-bneo-logo.svg", name: t("tokenBneo"), amount: t("placeholderDash") },
  { icon: "/static/neoburger-gas-logo.svg", name: t("tokenGas"), amount: t("placeholderDash") },
  { icon: "/static/neoburger-nobug-token.svg", name: t("tokenNobug"), amount: t("placeholderDash") },
]);

const footerLinks = computed(() => [
  { label: t("footerDoc"), url: t("docsUrl") },
  { label: t("footerNeo"), url: t("neoUrl") },
  { label: t("footerTwitter"), url: t("twitterUrl") },
  { label: t("footerGithub"), url: t("githubUrl") },
]);

const projectCostRows = computed(() => [
  {
    event: t("projectCostEventBurgerNeoDeployment"),
    cost: t("projectCostCostBurgerNeoDeployment"),
    time: t("projectCostTimeBurgerNeoDeployment"),
  },
  {
    event: t("projectCostEventBurgerAgentDeployment"),
    cost: t("projectCostCostBurgerAgentDeployment"),
    time: t("projectCostTimeBurgerAgentDeployment"),
  },
  {
    event: t("projectCostEventDailyMaintenance"),
    cost: t("projectCostCostDailyMaintenance"),
    time: t("projectCostTimeDailyMaintenance"),
  },
  {
    event: t("projectCostEventBurgerNeoUpgrade"),
    cost: t("projectCostCostBurgerNeoUpgrade"),
    time: t("projectCostTimeBurgerNeoUpgrade"),
  },
  {
    event: t("projectCostEventNobugDeployment"),
    cost: t("projectCostCostNobugDeployment"),
    time: t("projectCostTimeNobugDeployment"),
  },
]);

const docSteps = computed(() => [t("step1"), t("step2"), t("step3"), t("step4")]);
const docFeatures = computed(() => [
  { name: t("feature1Name"), desc: t("feature1Desc") },
  { name: t("feature2Name"), desc: t("feature2Desc") },
]);

const canStake = computed(() => {
  const amount = Math.floor(parseFloat(stakeAmount.value) || 0);
  return amount > 0 && amount <= neoBalance.value;
});

const canUnstake = computed(() => {
  const amount = parseFloat(unstakeAmount.value);
  return amount > 0 && amount <= bNeoBalance.value;
});

const estimatedBneo = computed(() => {
  const amount = Math.floor(parseFloat(stakeAmount.value) || 0);
  return (amount * 0.99).toFixed(2);
});

const estimatedNeo = computed(() => {
  const amount = parseFloat(unstakeAmount.value) || 0;
  return (amount * 1.01).toFixed(2);
});

const dailyRewards = computed(() => {
  return (bNeoBalance.value * (apy.value / 100 / 365)).toFixed(4);
});

const weeklyRewards = computed(() => {
  return (bNeoBalance.value * (apy.value / 100 / 52)).toFixed(4);
});

const monthlyRewards = computed(() => {
  return (bNeoBalance.value * (apy.value / 100 / 12)).toFixed(4);
});

const totalRewards = computed(() => {
  const monthly = parseFloat(monthlyRewards.value);
  return Number.isFinite(monthly) ? monthly : 0;
});

const totalRewardsUsd = computed(() => {
  const neoPrice = priceData.value?.neo.usd ?? 0;
  return (totalRewards.value * neoPrice).toFixed(2);
});

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

function formatCompactNumber(value: number): string {
  if (!Number.isFinite(value)) return t("placeholderDash");
  const absValue = Math.abs(value);
  const format = (num: number, unit: string) => `${trimTrailingZero(num.toFixed(1))}${unit}`;

  if (absValue >= 1_000_000_000) return format(value / 1_000_000_000, "B");
  if (absValue >= 1_000_000) return format(value / 1_000_000, "M");
  if (absValue >= 1_000) return format(value / 1_000, "K");
  return trimTrailingZero(value.toFixed(0));
}

function trimTrailingZero(value: string): string {
  return value.replace(/\.0$/, "");
}

function sanitizeStakeInput(value: string): string {
  if (!value) return "";
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return "";
  return String(Math.floor(parsed));
}

function updateSwapAmount(value: string) {
  if (swapMode.value === "stake") {
    swapAmount.value = sanitizeStakeInput(value);
  } else {
    swapAmount.value = value;
  }
}

function toggleSwapMode() {
  swapMode.value = swapMode.value === "stake" ? "unstake" : "stake";
}

function setStakeAmount(percentage: number) {
  stakeAmount.value = String(Math.floor(neoBalance.value * percentage));
}

function setUnstakeAmount(percentage: number) {
  unstakeAmount.value = (bNeoBalance.value * percentage).toFixed(2);
}

function setSwapAmount(percentage: number) {
  if (swapMode.value === "stake") {
    setStakeAmount(percentage);
  } else {
    setUnstakeAmount(percentage);
  }
}

function showStatus(message: string, type: "success" | "error") {
  statusMessage.value = message;
  statusType.value = type;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusMessage.value = "";
    statusTimer = null;
  }, 5000);
}

function animateApy() {
  const target = apy.value;
  const duration = 2000;
  const steps = 60;
  const increment = target / steps;
  let current = 0;
  let step = 0;

  if (apyAnimationTimer) clearInterval(apyAnimationTimer);

  apyAnimationTimer = setInterval(() => {
    current += increment;
    step++;
    animatedApy.value = current.toFixed(1);

    if (step >= steps) {
      animatedApy.value = target.toFixed(1);
      if (apyAnimationTimer) {
        clearInterval(apyAnimationTimer);
        apyAnimationTimer = null;
      }
    }
  }, duration / steps);
}

async function loadBalances() {
  try {
    const address = await getAddress();
    walletAddress.value = address || null;
    if (!address) {
      neoBalance.value = 0;
      bNeoBalance.value = 0;
      return;
    }

    const bneoContract = await ensureBneoContract();
    if (!bneoContract) return;

    const neo = await getBalance("NEO");
    const bneo = await getBalance(bneoContract);
    neoBalance.value = typeof neo === "string" ? parseFloat(neo) || 0 : typeof neo === "number" ? neo : 0;
    bNeoBalance.value = typeof bneo === "string" ? parseFloat(bneo) || 0 : typeof bneo === "number" ? bneo : 0;
  } catch {
  }
}

const APY_CACHE_KEY = "neoburger_apy_cache";
const STATS_ENDPOINTS = ["/api/neoburger-stats", "/api/neoburger/stats"];

const fetchStats = async () => {
  for (const endpoint of STATS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) continue;
      return await response.json();
    } catch {
      // Try next endpoint.
    }
  }
  return null;
};

const readCachedApy = () => {
  try {
    const uniApi = (globalThis as any)?.uni;
    const raw = uniApi?.getStorageSync?.(APY_CACHE_KEY) ?? (typeof localStorage !== "undefined" ? localStorage.getItem(APY_CACHE_KEY) : null);
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : null;
  } catch {
    return null;
  }
};

const writeCachedApy = (value: number) => {
  try {
    const uniApi = (globalThis as any)?.uni;
    if (uniApi?.setStorageSync) {
      uniApi.setStorageSync(APY_CACHE_KEY, String(value));
    } else if (typeof localStorage !== "undefined") {
      localStorage.setItem(APY_CACHE_KEY, String(value));
    }
  } catch {
  }
};

async function loadApy() {
  try {
    loadingApy.value = true;
    const cached = readCachedApy();
    if (cached !== null) {
      apy.value = cached;
    }
    const data = await fetchStats();
    if (data) {
      const nextApy = parseFloat(data.apy ?? data.apr);
      if (Number.isFinite(nextApy) && nextApy >= 0) {
        apy.value = nextApy;
        writeCachedApy(nextApy);
      }
      const nextTotalStaked = Number(data.total_staked ?? data.totalStakedNeo);
      if (Number.isFinite(nextTotalStaked) && nextTotalStaked >= 0) {
        totalStaked.value = nextTotalStaked;
      }
      const formatted = data.total_staked_formatted ?? data.totalStakedFormatted;
      if (typeof formatted === "string") {
        totalStakedFormatted.value = formatted;
      }
    }
  } catch {
  } finally {
    loadingApy.value = false;
    animateApy();
  }
}

async function ensureBneoContract(): Promise<string | null> {
  if (BNEO_CONTRACT.value) return BNEO_CONTRACT.value;
  try {
    const contract = await getContractAddress();
    if (contract) {
      BNEO_CONTRACT.value = contract;
    }
  } catch {
    // Ignore and return null.
  }
  return BNEO_CONTRACT.value;
}

async function handleStake() {
  if (!canStake.value || loading.value) return;

  loading.value = true;
  try {
    const amount = Math.floor(parseFloat(stakeAmount.value) || 0);
    const bneoContract = await ensureBneoContract();
    if (!bneoContract) {
      showStatus(t("contractUnavailable"), "error");
      return;
    }
    await invokeContract({
      scriptHash: NEO_CONTRACT,
      operation: "transfer",
      args: [
        { type: "Hash160", value: await getAddress() },
        { type: "Hash160", value: bneoContract },
        { type: "Integer", value: Math.floor(amount) },
        { type: "Any", value: null },
      ],
    });
    showStatus(`${t("stakeSuccess")} ${amount} ${t("tokenNeo")}!`, "success");
    stakeAmount.value = "";
    await loadBalances();
  } catch (e: any) {
    showStatus(e.message || t("stakeFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleUnstake() {
  if (!canUnstake.value || loading.value) return;

  loading.value = true;
  try {
    const amount = parseFloat(unstakeAmount.value);
    const integerAmount = Math.round(amount * 100000000);
    const bneoContract = await ensureBneoContract();
    if (!bneoContract) {
      showStatus(t("contractUnavailable"), "error");
      return;
    }
    await invokeContract({
      scriptHash: bneoContract,
      operation: "transfer",
      args: [
        { type: "Hash160", value: await getAddress() },
        { type: "Hash160", value: bneoContract },
        { type: "Integer", value: integerAmount },
        { type: "ByteArray", value: "" },
      ],
    });
    showStatus(`${t("unstakeSuccess")} ${amount} ${t("tokenBneo")}!`, "success");
    unstakeAmount.value = "";
    await loadBalances();
  } catch (e: any) {
    showStatus(e.message || t("unstakeFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleClaimRewards() {
  if (loading.value) return;

  loading.value = true;
  try {
    const sdk = await import("@neo/uniapp-sdk").then((m) => m.waitForSDK?.() || null);
    if (!sdk?.invoke) {
      throw new Error(t("sdkUnavailable"));
    }

    const bneoContract = await ensureBneoContract();
    if (!bneoContract) throw new Error(t("contractUnavailable"));

    await sdk.invoke("invokeFunction", {
      contract: bneoContract,
      method: "claim",
      args: [],
    });

    showStatus(t("claimSuccess"), "success");
    await loadBalances();
  } catch (e: any) {
    showStatus(e.message || t("claimFailed"), "error");
  } finally {
    loading.value = false;
  }
}

async function handleSwap() {
  if (swapMode.value === "stake") {
    await handleStake();
  } else {
    await handleUnstake();
  }
}

async function handlePrimaryAction() {
  if (walletConnected.value) {
    await handleSwap();
  } else {
    await handleConnectWallet();
  }
}

async function handleJazzAction() {
  if (walletConnected.value) {
    await handleClaimRewards();
  } else {
    await handleConnectWallet();
  }
}

async function handleConnectWallet() {
  await loadBalances();
}

async function copyToClipboard(value: string) {
  try {
    const uniApi = (globalThis as any)?.uni;
    if (uniApi?.setClipboardData) {
      await uniApi.setClipboardData({ data: value });
    } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      throw new Error("clipboard");
    }
    showStatus(t("copySuccess"), "success");
  } catch {
    showStatus(t("copyFailed"), "error");
  }
}

function openExternal(url: string) {
  if (!url) return;

  const uniApi = (globalThis as any)?.uni;
  if (uniApi?.openURL) {
    uniApi.openURL({ url });
    return;
  }

  const plusApi = (globalThis as any)?.plus;
  if (plusApi?.runtime?.openURL) {
    plusApi.runtime.openURL(url);
    return;
  }

  if (typeof window !== "undefined" && window.open) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  if (typeof window !== "undefined") {
    window.location.href = url;
  }
}

async function loadPrices() {
  try {
    priceData.value = await getPrices();
  } catch {
  }
}

onMounted(() => {
  loadBalances();
  loadApy();
  loadPrices();
});

onUnmounted(() => {
  if (apyAnimationTimer) {
    clearInterval(apyAnimationTimer);
    apyAnimationTimer = null;
  }
  if (statusTimer) {
    clearTimeout(statusTimer);
    statusTimer = null;
  }
});
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

@import url("https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;600;700;800&display=swap");

:global(page) {
  background: #f7f2ea;
}

:deep(.app-layout) {
  background: #f7f2ea;
  background-image:
    radial-gradient(circle at 10% 10%, rgba(0, 229, 153, 0.12), transparent 45%),
    radial-gradient(circle at 90% 30%, rgba(255, 184, 76, 0.18), transparent 40%),
    radial-gradient(circle at 50% 80%, rgba(255, 233, 204, 0.4), transparent 60%);
  color: #2a1f16;
  font-family: "Manrope", "Outfit", sans-serif;
}

:deep(.app-content) {
  background: transparent;
}

:deep(.navbar) {
  background: rgba(255, 255, 255, 0.92);
  border-top: 1px solid rgba(58, 40, 26, 0.12);
}

:deep(.nav-item) {
  color: rgba(72, 54, 40, 0.6);
}

:deep(.nav-item.active) {
  color: #00b97f;
}

:deep(.nav-item::after) {
  background: #00b97f;
}

:deep(.neo-btn--primary) {
  background: linear-gradient(135deg, #00e599 0%, #9ff6d5 100%);
  color: #0b2f24;
  box-shadow: 0 12px 25px rgba(0, 229, 153, 0.35);
}

:deep(.neo-btn--secondary) {
  background: #ffffff;
  color: #3c2b1f;
  border: 1px solid rgba(58, 40, 26, 0.16);
  box-shadow: none;
}

:deep(.neo-btn--success) {
  background: linear-gradient(135deg, #00c27a 0%, #00a86b 100%);
  color: #fef8f2;
  box-shadow: 0 12px 25px rgba(0, 194, 122, 0.3);
}

:deep(.neo-input__wrapper) {
  background: #ffffff;
  border: 1px solid rgba(58, 40, 26, 0.16);
  box-shadow: inset 0 2px 0 rgba(0, 0, 0, 0.04);
}

:deep(.neo-card) {
  background: #ffffff;
  border: 1px solid rgba(58, 40, 26, 0.12);
  box-shadow: 0 16px 26px rgba(33, 23, 16, 0.08);
  color: #2a1f16;
  backdrop-filter: none;
}

:deep(.neo-card--danger) {
  background: #fff5f2;
  border-color: rgba(239, 68, 68, 0.35);
  color: #b91c1c;
}

:deep(.neo-card--success) {
  background: #ecfdf3;
  border-color: rgba(16, 185, 129, 0.35);
  color: #065f46;
}

:deep(.neo-btn),
:deep(.neo-input__field) {
  font-family: "Manrope", "Outfit", sans-serif;
}

:deep(.neo-input__field) {
  color: #2a1f16;
}

:deep(.neo-input__field::placeholder) {
  color: rgba(42, 31, 22, 0.4);
}

:deep(.neo-doc) {
  color: #2a1f16;
}

:deep(.neo-doc .doc-header),
:deep(.neo-doc .doc-footer) {
  border-color: rgba(58, 40, 26, 0.12);
}

:deep(.neo-doc .doc-badge) {
  background: rgba(0, 229, 153, 0.12);
  color: #0f7f5a;
  border-color: rgba(0, 229, 153, 0.35);
  box-shadow: 0 0 12px rgba(0, 229, 153, 0.2);
}

:deep(.neo-doc .doc-subtitle),
:deep(.neo-doc .section-text),
:deep(.neo-doc .step-text),
:deep(.neo-doc .feature-desc),
:deep(.neo-doc .footer-text) {
  color: rgba(43, 31, 22, 0.7);
}

:deep(.neo-doc .section-label) {
  color: #0f7f5a;
  text-shadow: none;
}

:deep(.neo-doc .step-number) {
  background: #fff;
  color: #0f7f5a;
  border-color: rgba(0, 229, 153, 0.3);
  box-shadow: none;
}

:deep(.neo-doc .feature-card) {
  background: #f9f3ea;
  border-color: rgba(58, 40, 26, 0.12);
  box-shadow: 0 10px 20px rgba(33, 23, 16, 0.08);
}

.status-card {
  margin: 16px 18px 0;
}

.status-text {
  font-weight: 800;
  text-transform: uppercase;
  font-size: 13px;
  text-align: center;
  letter-spacing: 0.05em;
  font-family: "Manrope", "Outfit", sans-serif;
}

.chain-warning {
  padding: 16px 18px 0;
}

.chain-warning-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  text-align: center;
}

.chain-warning-message {
  font-size: 12px;
  opacity: 0.75;
}

.neoburger-shell,
.page-shell {
  padding: 20px 18px 36px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: "Manrope", "Outfit", sans-serif;
  color: #2a1f16;
}

.hero {
  background: linear-gradient(135deg, #0f7f5a 0%, #00e599 40%, #f2fff7 100%);
  border-radius: 28px;
  padding: 24px;
  color: #fff;
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 18px;
  box-shadow: 0 24px 50px rgba(11, 47, 36, 0.22);
}

.hero::after {
  content: "";
  position: absolute;
  right: -80px;
  top: -80px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  filter: blur(2px);
}

.hero-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1;
}

.hero-logo {
  width: 52px;
}

.hero-title {
  font-family: "Bebas Neue", "Manrope", sans-serif;
  font-size: 42px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-subtitle {
  font-size: 14px;
  max-width: 280px;
  line-height: 1.4;
  opacity: 0.9;
}

.hero-bubbles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 6px;
}

.hero-bubble {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 16px;
  padding: 12px;
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bubble-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.75;
}

.bubble-value {
  font-size: 20px;
  font-weight: 700;
}

.bubble-subvalue {
  font-size: 12px;
  opacity: 0.7;
}

.hero-media {
  position: relative;
  z-index: 1;
}

.hero-background {
  position: absolute;
  right: -10px;
  bottom: -20px;
  width: 120%;
  opacity: 0.35;
}

.hero-gif {
  width: 100%;
  border-radius: 18px;
  box-shadow: 0 18px 40px rgba(10, 54, 38, 0.3);
}

.station {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.station-tabs {
  background: #fff;
  border-radius: 999px;
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  box-shadow: 0 10px 25px rgba(33, 23, 16, 0.08);
}

.station-tab {
  border: none;
  background: transparent;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  padding: 10px 0;
  border-radius: 999px;
  color: rgba(43, 31, 22, 0.6);
  cursor: pointer;
}

.station-tab.active {
  background: #00e599;
  color: #0b2f24;
  box-shadow: 0 8px 16px rgba(0, 229, 153, 0.35);
}

.station-card {
  background: #fff;
  border-radius: 24px;
  padding: 20px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  box-shadow: 0 16px 30px rgba(33, 23, 16, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.station-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.station-title {
  font-family: "Bebas Neue", "Manrope", sans-serif;
  font-size: 28px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.station-subtitle {
  font-size: 13px;
  opacity: 0.7;
}

.station-learn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #0f7f5a;
  font-weight: 600;
  cursor: pointer;
}

.learn-icon {
  width: 16px;
}

.swap-panel {
  display: grid;
  gap: 14px;
}

.swap-block {
  background: #f9f3ea;
  border-radius: 18px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.swap-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(43, 31, 22, 0.6);
  font-weight: 700;
}

.swap-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.swap-asset {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(58, 40, 26, 0.12);
  font-weight: 700;
  font-size: 12px;
}

.swap-asset-icon {
  width: 18px;
}

.swap-input-field {
  flex: 1;
  min-width: 0;
}

.swap-usd {
  font-size: 12px;
  color: rgba(43, 31, 22, 0.6);
}

.swap-toggle {
  align-self: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #00e599;
  box-shadow: 0 10px 20px rgba(0, 229, 153, 0.3);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.swap-toggle-icon {
  width: 18px;
}

.swap-output {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 14px;
  background: #fff;
  border: 1px dashed rgba(58, 40, 26, 0.2);
}

.swap-output-value {
  font-weight: 700;
  font-size: 16px;
}

.station-tip {
  font-size: 12px;
  color: rgba(43, 31, 22, 0.6);
}

.station-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.chip {
  border-radius: 999px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  background: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.jazz-card {
  background: linear-gradient(135deg, rgba(0, 229, 153, 0.08), rgba(255, 184, 76, 0.12));
}

.jazz-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.jazz-item {
  background: #fff;
  border-radius: 14px;
  padding: 10px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.jazz-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(43, 31, 22, 0.6);
}

.jazz-value {
  font-size: 14px;
  font-weight: 700;
}

.jazz-subvalue {
  font-size: 11px;
  opacity: 0.6;
}

.jazz-note {
  font-size: 12px;
  color: rgba(43, 31, 22, 0.6);
}

.section {
  background: #fff;
  border-radius: 24px;
  padding: 22px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  box-shadow: 0 18px 30px rgba(33, 23, 16, 0.08);
  display: grid;
  gap: 18px;
}

.section.reverse {
  direction: rtl;
}

.section.reverse .section-content,
.section.reverse .section-media {
  direction: ltr;
}

.section.center {
  text-align: center;
  justify-items: center;
}

.section-title {
  font-family: "Bebas Neue", "Manrope", sans-serif;
  font-size: 28px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-strong {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.5;
}

.section-text {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(43, 31, 22, 0.7);
}

.section-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: rgba(43, 31, 22, 0.6);
}

.section-value {
  font-size: 12px;
  font-weight: 600;
  color: rgba(43, 31, 22, 0.8);
}

.section-pair {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
}

.section-media {
  width: 100%;
}

.section-image {
  width: 100%;
  border-radius: 18px;
}

.linkish {
  color: #0f7f5a;
  font-weight: 700;
  text-decoration: underline;
  margin-left: 6px;
}

.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.footer-logo {
  width: 80px;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(43, 31, 22, 0.6);
}

.footer-link {
  font-weight: 700;
  cursor: pointer;
}

.footer-divider {
  opacity: 0.4;
}

.page-hero {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-hero-logo {
  width: 40px;
}

.page-hero-title {
  font-family: "Bebas Neue", "Manrope", sans-serif;
  font-size: 32px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.page-hero-subtitle {
  font-size: 12px;
  color: rgba(43, 31, 22, 0.6);
  margin-top: 4px;
}

.card {
  background: #fff;
  border-radius: 20px;
  padding: 18px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  box-shadow: 0 16px 26px rgba(33, 23, 16, 0.08);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.connect-card {
  gap: 16px;
}

.token-card {
  background: #f9f3ea;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.token-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
}

.token-divider {
  height: 1px;
  background: rgba(58, 40, 26, 0.12);
  margin: 6px 0;
}

.token-subtitle {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(43, 31, 22, 0.7);
  font-weight: 700;
}

.distribution-grid {
  display: grid;
  gap: 10px;
}

.dist-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dist-percent {
  font-weight: 800;
  font-size: 20px;
  color: #0f7f5a;
}

.dist-percent.large {
  font-size: 28px;
}

.dist-text {
  font-size: 12px;
  color: rgba(43, 31, 22, 0.7);
}

.usage-tabs {
  display: grid;
  gap: 10px;
}

.usage-tab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f9f3ea;
  border-radius: 16px;
  padding: 10px 12px;
  border: 1px solid rgba(58, 40, 26, 0.12);
}

.usage-text {
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.usage-vector {
  width: 16px;
}

.distribution-block {
  padding: 12px 0;
  border-top: 1px solid rgba(58, 40, 26, 0.12);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.distribution-block:first-of-type {
  border-top: none;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 700;
}

.bullet-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bullet-item {
  font-size: 12px;
  color: rgba(43, 31, 22, 0.7);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.icon {
  width: 18px;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #f9f3ea;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(58, 40, 26, 0.12);
}

.address-text {
  font-size: 12px;
  font-weight: 600;
  word-break: break-all;
}

.icon-button {
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.asset-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.asset-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  background: #fdfbf8;
}

.asset-icon {
  width: 20px;
}

.asset-name {
  font-size: 13px;
  font-weight: 700;
}

.asset-amount {
  font-size: 12px;
  color: rgba(43, 31, 22, 0.7);
}

.chart-placeholder {
  height: 140px;
  border-radius: 16px;
  border: 1px dashed rgba(58, 40, 26, 0.2);
  display: grid;
  place-items: center;
  color: rgba(43, 31, 22, 0.5);
  background: #fdfbf8;
}

.table {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-row {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 0.8fr;
  gap: 8px;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  background: #fdfbf8;
}

.table-header {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  background: #f7ede0;
}

.section-caption {
  font-size: 11px;
  color: rgba(43, 31, 22, 0.6);
}

.token-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.token-icon {
  width: 22px;
}

.token-title {
  font-size: 18px;
  font-weight: 800;
}

.token-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  color: rgba(43, 31, 22, 0.7);
}

.chart-grid {
  display: grid;
  gap: 12px;
}

.chart-card {
  background: #fdfbf8;
  border-radius: 16px;
  padding: 12px;
  border: 1px solid rgba(58, 40, 26, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-title {
  font-size: 13px;
  font-weight: 700;
}

.chart-tabs {
  display: flex;
  gap: 8px;
}

.chart-tab {
  border: 1px solid rgba(58, 40, 26, 0.12);
  background: #fff;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: rgba(43, 31, 22, 0.6);
}

.chart-tab.active {
  background: #00e599;
  color: #0b2f24;
  border-color: transparent;
}

.agent-card {
  gap: 14px;
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.agent-right {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
  color: rgba(43, 31, 22, 0.6);
}

.empty-row {
  grid-template-columns: 1fr;
  text-align: center;
}

.empty-text {
  font-size: 12px;
  color: rgba(43, 31, 22, 0.6);
}

.doc-link-card {
  text-align: center;
  gap: 10px;
}

.doc-link {
  font-weight: 700;
  font-size: 13px;
  color: #0f7f5a;
  cursor: pointer;
}

.fade-up {
  animation: fadeUp 0.8s ease both;
}

.delay-1 {
  animation-delay: 0.1s;
}

.delay-2 {
  animation-delay: 0.2s;
}

.delay-3 {
  animation-delay: 0.3s;
}

.delay-4 {
  animation-delay: 0.4s;
}

.delay-5 {
  animation-delay: 0.5s;
}

.delay-6 {
  animation-delay: 0.6s;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (min-width: 768px) {
  .hero {
    grid-template-columns: 1.1fr 0.9fr;
    align-items: center;
  }

  .section {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: center;
  }

  .section.center {
    grid-template-columns: 1fr;
  }

  .chart-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
