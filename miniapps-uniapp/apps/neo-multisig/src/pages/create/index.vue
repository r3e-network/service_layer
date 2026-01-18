<template>
  <view class="page-container">
    <view class="nav-header">
      <text class="back-btn" @click="goBack">←</text>
      <view class="nav-text">
        <text class="title">{{ t("createTitle") }}</text>
        <text class="subtitle">{{ t("appSubtitle") }}</text>
      </view>
    </view>

    <view class="content">
      <NeoCard v-if="step === 1" class="step-card">
        <text class="step-title">{{ t("step1Title") }}</text>
        <text class="step-desc">{{ t("step1Desc") }}</text>

        <view class="signer-list">
          <view v-for="(signer, index) in signers" :key="index" class="signer-row">
            <text class="index">{{ index + 1 }}</text>
            <input
              class="input"
              v-model="signers[index]"
              :placeholder="t('signerPlaceholder')"
            />
            <text class="remove-btn" @click="removeSigner(index)" v-if="signers.length > 1">×</text>
          </view>
        </view>

        <NeoButton variant="secondary" size="sm" @click="addSigner" class="add-btn">
          {{ t("addSigner") }}
        </NeoButton>

        <view class="actions">
          <NeoButton variant="primary" block @click="goThreshold" :disabled="!isValidSigners">
            {{ t("buttonNext") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard v-if="step === 2" class="step-card">
        <text class="step-title">{{ t("step2Title") }}</text>
        <text class="step-desc">{{ t("step2Desc") }}</text>

        <view class="threshold-control">
          <text class="threshold-val">{{ threshold }}</text>
          <text class="threshold-total">/ {{ signers.length }}</text>
        </view>

        <slider
          :value="threshold"
          :min="1"
          :max="signers.length"
          activeColor="#00E599"
          @change="onThresholdChange"
        />

        <view class="actions row">
          <NeoButton variant="secondary" @click="step = 1">{{ t("buttonBack") }}</NeoButton>
          <NeoButton variant="primary" @click="finalizeConfig">{{ t("buttonNext") }}</NeoButton>
        </view>
      </NeoCard>

      <NeoCard v-if="step === 3" class="step-card">
        <text class="step-title">{{ t("step3Title") }}</text>
        <text class="step-desc">{{ t("step3Desc") }}</text>

        <view class="summary-block">
          <view class="summary-row">
            <text class="label">{{ t("multisigAddressLabel") }}</text>
            <text class="value mono">{{ multisigAddress || "--" }}</text>
          </view>
          <view class="summary-row">
            <text class="label">{{ t("multisigScriptHashLabel") }}</text>
            <text class="value mono">{{ multisigScriptHash || "--" }}</text>
          </view>
        </view>

        <view class="form-group">
          <text class="label">{{ t("chainLabel") }}</text>
          <view class="pill-group">
            <view
              class="pill"
              :class="{ active: selectedChain === 'neo-n3-mainnet' }"
              @click="setChain('neo-n3-mainnet')"
            >
              <text>{{ t("chainMainnet") }}</text>
            </view>
            <view
              class="pill"
              :class="{ active: selectedChain === 'neo-n3-testnet' }"
              @click="setChain('neo-n3-testnet')"
            >
              <text>{{ t("chainTestnet") }}</text>
            </view>
          </view>
        </view>

        <view class="form-group">
          <text class="label">{{ t("assetLabel") }}</text>
          <view class="asset-toggle">
            <text :class="{ active: asset === 'GAS' }" @click="asset = 'GAS'">{{ t("assetGas") }}</text>
            <text :class="{ active: asset === 'NEO' }" @click="asset = 'NEO'">{{ t("assetNeo") }}</text>
          </view>
        </view>

        <view class="form-group">
          <text class="label">{{ t("toAddressLabel") }}</text>
          <input class="input" v-model="toAddress" :placeholder="t('toAddressPlaceholder')" />
        </view>

        <view class="form-group">
          <text class="label">{{ t("amountLabel") }}</text>
          <input class="input" v-model="amount" type="digit" :placeholder="t('amountPlaceholder')" />
        </view>

        <view class="form-group">
          <text class="label">{{ t("memoLabel") }}</text>
          <input class="input" v-model="memo" :placeholder="t('memoPlaceholder')" />
        </view>

        <view class="actions row">
          <NeoButton variant="secondary" @click="step = 2">{{ t("buttonBack") }}</NeoButton>
          <NeoButton variant="primary" @click="prepareTransaction" :disabled="!isValidTx || isPreparing">
            {{ isPreparing ? t("loading") : t("buttonReview") }}
          </NeoButton>
        </view>
      </NeoCard>

      <NeoCard v-if="step === 4" class="step-card">
        <text class="step-title">{{ t("step4Title") }}</text>
        <text class="step-desc">{{ t("step4Desc") }}</text>

        <view class="review-item">
          <text class="label">{{ t("reviewFrom") }}</text>
          <text class="value mono">{{ multisigAddress }}</text>
        </view>
        <view class="review-item">
          <text class="label">{{ t("reviewTo") }}</text>
          <text class="value mono">{{ toAddress }}</text>
        </view>
        <view class="review-item">
          <text class="label">{{ t("reviewAmount") }}</text>
          <text class="value highlight">{{ amount }} {{ asset }}</text>
        </view>
        <view class="review-item">
          <text class="label">{{ t("reviewSigners") }}</text>
          <text class="value">{{ threshold }} / {{ signers.length }}</text>
        </view>
        <view class="review-item">
          <text class="label">{{ t("reviewChain") }}</text>
          <text class="value">{{ chainLabel }}</text>
        </view>
        <view class="review-item">
          <text class="label">{{ t("reviewFees") }}</text>
          <view class="fee-grid">
            <view class="fee-row">
              <text class="fee-label">{{ t("reviewNetworkFee") }}</text>
              <text class="fee-value">{{ formatGas(feeSummary.networkFee) }} GAS</text>
            </view>
            <view class="fee-row">
              <text class="fee-label">{{ t("reviewSystemFee") }}</text>
              <text class="fee-value">{{ formatGas(feeSummary.systemFee) }} GAS</text>
            </view>
          </view>
        </view>
        <view class="review-item">
          <text class="label">{{ t("reviewValidUntil") }}</text>
          <text class="value">{{ feeSummary.validUntilBlock }}</text>
        </view>
        <view v-if="memo" class="review-item">
          <text class="label">{{ t("detailMemo") }}</text>
          <text class="value">{{ memo }}</text>
        </view>

        <view class="actions row">
          <NeoButton variant="secondary" @click="step = 3">{{ t("buttonBack") }}</NeoButton>
          <NeoButton variant="primary" @click="submit" :disabled="isSubmitting">
            {{ isSubmitting ? t("buttonCreating") : t("buttonCreate") }}
          </NeoButton>
        </view>
      </NeoCard>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { NeoCard, NeoButton } from "@/shared/components";
import { useI18n } from "@/composables/useI18n";
import { useWallet } from "@neo/uniapp-sdk";
import { api } from "../../services/api";
import {
  buildTransferTransaction,
  createMultisigAccount,
  formatFixed8,
  isValidAddress,
  normalizePublicKeys,
  validateAmount,
} from "../../utils/multisig";

const { t } = useI18n();
const { chainId } = useWallet();

const step = ref(1);
const signers = ref(["", ""]);
const threshold = ref(1);
const selectedChain = ref<"neo-n3-mainnet" | "neo-n3-testnet">(
  chainId.value === "neo-n3-testnet" ? "neo-n3-testnet" : "neo-n3-mainnet",
);

const asset = ref<"GAS" | "NEO">("GAS");
const toAddress = ref("");
const amount = ref("");
const memo = ref("");
const isPreparing = ref(false);
const isSubmitting = ref(false);

const multisigAccount = ref<ReturnType<typeof createMultisigAccount> | null>(null);
const preparedTx = ref<any>(null);
const feeSummary = ref({
  systemFee: "0",
  networkFee: "0",
  validUntilBlock: 0,
});

watch(signers, (next) => {
  if (threshold.value > next.length) {
    threshold.value = next.length || 1;
  }
}, { deep: true });

const multisigAddress = computed(() => multisigAccount.value?.address || "");
const multisigScriptHash = computed(() => multisigAccount.value?.scriptHash || "");
const chainLabel = computed(() => (selectedChain.value === "neo-n3-mainnet" ? t("chainMainnet") : t("chainTestnet")));

const trimmedSigners = computed(() => signers.value.map((s) => s.trim()));
const isValidSigners = computed(() => {
  if (trimmedSigners.value.some((s) => !s)) return false;
  try {
    normalizePublicKeys(trimmedSigners.value);
    return true;
  } catch {
    return false;
  }
});

const isValidTx = computed(() => {
  return isValidAddress(toAddress.value) && validateAmount(amount.value, asset.value);
});

const goBack = () => uni.navigateBack();
const addSigner = () => signers.value.push("");
const removeSigner = (i: number) => signers.value.splice(i, 1);

const setChain = (chain: "neo-n3-mainnet" | "neo-n3-testnet") => {
  selectedChain.value = chain;
};

const onThresholdChange = (e: any) => {
  threshold.value = e.detail.value;
};

const goThreshold = () => {
  step.value = 2;
};

const finalizeConfig = () => {
  try {
    const normalized = normalizePublicKeys(trimmedSigners.value);
    multisigAccount.value = createMultisigAccount(threshold.value, normalized);
    step.value = 3;
  } catch (e: any) {
    const message = e?.message?.includes("duplicate") ? t("toastDuplicateSigners") : t("toastInvalidSigners");
    uni.showToast({ title: message, icon: "none" });
  }
};

const prepareTransaction = async () => {
  if (!multisigAccount.value) {
    uni.showToast({ title: t("toastInvalidSigners"), icon: "none" });
    return;
  }
  if (!isValidAddress(toAddress.value)) {
    uni.showToast({ title: t("toastInvalidAddress"), icon: "none" });
    return;
  }
  if (!validateAmount(amount.value, asset.value)) {
    uni.showToast({ title: t("toastInvalidAmount"), icon: "none" });
    return;
  }

  isPreparing.value = true;
  try {
    const prepared = await buildTransferTransaction({
      chainId: selectedChain.value,
      fromAddress: multisigAddress.value,
      toAddress: toAddress.value,
      amount: amount.value,
      assetSymbol: asset.value,
      threshold: threshold.value,
      publicKeys: multisigAccount.value.publicKeys,
    });
    preparedTx.value = prepared.tx;
    feeSummary.value = {
      systemFee: prepared.systemFee,
      networkFee: prepared.networkFee,
      validUntilBlock: prepared.validUntilBlock,
    };
    step.value = 4;
  } catch (e: any) {
    uni.showToast({ title: t("toastPrepareFailed"), icon: "none" });
  } finally {
    isPreparing.value = false;
  }
};

const submit = async () => {
  if (!preparedTx.value || !multisigAccount.value) return;
  isSubmitting.value = true;
  try {
    const result = await api.create({
      chainId: selectedChain.value,
      scriptHash: multisigAccount.value.scriptHash,
      threshold: threshold.value,
      signers: multisigAccount.value.publicKeys,
      transactionHex: preparedTx.value.serialize(false),
      memo: memo.value || undefined,
    });

    const history = uni.getStorageSync("multisig_history") ? JSON.parse(uni.getStorageSync("multisig_history")) : [];
    history.unshift({
      id: result.id,
      scriptHash: multisigAccount.value.scriptHash,
      status: result.status || "pending",
      createdAt: result.created_at || new Date().toISOString(),
    });
    uni.setStorageSync("multisig_history", JSON.stringify(history.slice(0, 10)));

    uni.redirectTo({ url: `/pages/sign/index?id=${result.id}` });
  } catch (e: any) {
    uni.showToast({ title: t("toastCreateFailed"), icon: "none" });
  } finally {
    isSubmitting.value = false;
  }
};

const formatGas = (value: string) => formatFixed8(value);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;

.page-container {
  padding: 24px;
  background: var(--bg-body);
  min-height: 100vh;
  color: white;
}

.nav-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 12px;
}

.nav-text {
  display: flex;
  flex-direction: column;
}

.back-btn {
  font-size: 24px;
  cursor: pointer;
}

.title {
  font-size: 20px;
  font-weight: 700;
}

.subtitle {
  font-size: 12px;
  color: var(--text-secondary);
}

.step-card {
  padding: 24px;
  margin-bottom: 24px;
}

.step-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
  display: block;
  color: #00E599;
}

.step-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  display: block;
}

.signer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.index {
  font-size: 12px;
  color: var(--text-secondary);
  width: 18px;
  text-align: center;
}

.input {
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-size: 12px;
  font-family: $font-mono;
}

.remove-btn {
  font-size: 20px;
  color: #ef4444;
}

.add-btn {
  margin-bottom: 24px;
}

.threshold-control {
  text-align: center;
  margin-bottom: 24px;
}

.threshold-val {
  font-size: 48px;
  font-weight: 800;
  color: #00E599;
}

.threshold-total {
  color: var(--text-secondary);
}

.summary-block {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;

  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.value {
  font-size: 12px;
  text-align: right;
}

.mono {
  font-family: $font-mono;
}

.form-group {
  margin-bottom: 16px;
}

.pill-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pill {
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 12px;
  transition: all 0.2s ease;

  &.active {
    border-color: #00E599;
    color: white;
    background: rgba(0, 229, 153, 0.12);
  }
}

.asset-toggle {
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 4px;

  text {
    flex: 1;
    text-align: center;
    padding: 8px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;

    &.active {
      background: #00E599;
      color: black;
    }
  }
}

.actions {
  margin-top: 24px;

  &.row {
    display: flex;
    gap: 16px;
    justify-content: space-between;
  }
}

.review-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.highlight {
  color: #00E599;
  font-weight: 700;
  font-size: 16px;
}

.fee-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fee-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.fee-label {
  color: var(--text-secondary);
}
</style>
