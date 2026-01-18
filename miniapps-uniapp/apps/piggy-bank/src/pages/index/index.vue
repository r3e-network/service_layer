<template>
  <view class="container">
  <view class="header">
    <view class="title-row">
      <text class="title">{{ t('app.title') }}</text>
      <button class="settings-btn" @click="openSettings">⚙️</button>
    </view>
    <text class="subtitle">{{ t('app.subtitle') }}</text>
    <view class="status-row">
      <text class="status-chip">{{ currentChain?.shortName || 'EVM' }}</text>
      <text class="status-chip" :class="{ connected: isConnected }">
        {{ isConnected ? formatAddress(userAddress) : t('wallet.not_connected') }}
      </text>
      <button class="connect-btn" v-if="!isConnected" @click="handleConnect">
        {{ t('wallet.connect') }}
      </button>
    </view>
  </view>

  <view v-if="configIssues.length > 0" class="config-warning">
    <text class="warning-title">{{ t('settings.missing_config') }}</text>
    <text v-for="issue in configIssues" :key="issue" class="warning-item">
      • {{ issue }}
    </text>
  </view>

    <scroll-view scroll-y class="content">
      <view v-if="piggyBanks.length === 0" class="empty-state">
        <text class="empty-text">No Piggy Banks yet.</text>
        <button class="create-btn" @click="goToCreate">{{ t('create.create_btn') }}</button>
      </view>

      <view v-else class="grid">
        <view 
          v-for="bank in piggyBanks" 
          :key="bank.id" 
          class="card"
          @click="goToDetail(bank.id)"
          :style="{ borderColor: bank.themeColor, boxShadow: `0 0 10px ${bank.themeColor}40` }"
        >
          <view class="card-header">
            <text class="bank-name">{{ bank.name }}</text>
            <view class="status-badge" :class="{ locked: isLocked(bank) }">
              {{ isLocked(bank) ? '🔒' : '🔓' }}
            </view>
          </view>
          
          <text class="purpose">{{ bank.purpose }}</text>
          
          <view class="progress-section">
          <text class="label">
            {{ t('create.target_label') }}: {{ bank.targetAmount }} {{ bank.targetToken.symbol }}
          </text>
            <view class="progress-bar-bg">
              <!-- Since balance is hidden, we don't show real progress distinctively unless checked -->
              <view class="progress-bar-fill unknown"></view>
            </view>
          </view>
          
          <text class="date-info">
             {{ new Date(bank.unlockTime * 1000).toLocaleDateString() }}
          </text>
        </view>
      </view>
    </scroll-view>

    <view v-if="piggyBanks.length > 0" class="fab" @click="goToCreate">
      <text class="fab-icon">+</text>
    </view>
  </view>

  <view v-if="showSettings" class="modal-overlay" @click="showSettings = false">
    <view class="modal-content" @click.stop>
      <text class="modal-title">{{ t('settings.title') }}</text>

      <view class="form-group">
        <text class="label">{{ t('settings.network') }}</text>
        <picker
          mode="selector"
          :value="currentChainIndex"
          :range="chainOptions"
          range-key="name"
          @change="onChainChange"
        >
          <view class="picker-view">
            {{ selectedChain?.name || t('settings.select_network') }}
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="label">{{ t('settings.alchemy_key') }}</text>
        <input
          class="input-field"
          type="password"
          v-model="settingsForm.alchemyApiKey"
          :placeholder="t('settings.alchemy_placeholder')"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-group">
        <text class="label">{{ t('settings.walletconnect') }}</text>
        <input
          class="input-field"
          v-model="settingsForm.walletConnectProjectId"
          :placeholder="t('settings.walletconnect_placeholder')"
          placeholder-class="placeholder"
        />
      </view>

      <view class="form-group">
        <text class="label">{{ t('settings.contract_address') }}</text>
        <input
          class="input-field"
          v-model="settingsForm.contractAddress"
          placeholder="0x..."
          placeholder-class="placeholder"
        />
      </view>

      <view class="modal-actions">
        <button class="cancel-btn" @click="showSettings = false">{{ t('common.cancel') }}</button>
        <button class="submit-btn" @click="saveSettings">{{ t('common.confirm') }}</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePiggyStore, type PiggyBank } from '@/stores/piggy';
import { storeToRefs } from 'pinia';
import { useI18n } from '@/composables/useI18n';
import { formatAddress } from '@/shared/utils/format';

const { t } = useI18n();
const store = usePiggyStore();
const { piggyBanks, currentChainId, alchemyApiKey, walletConnectProjectId, userAddress, isConnected } =
  storeToRefs(store);

const showSettings = ref(false);
const chainOptions = computed(() => store.EVM_CHAINS);
const currentChain = computed(() =>
  chainOptions.value.find((chain) => chain.id === currentChainId.value),
);
const selectedChain = computed(() =>
  chainOptions.value.find((chain) => chain.id === settingsForm.value.chainId),
);
const currentChainIndex = computed(() =>
  Math.max(
    0,
    chainOptions.value.findIndex((chain) => chain.id === settingsForm.value.chainId),
  ),
);

const settingsForm = ref({
  chainId: currentChainId.value,
  alchemyApiKey: alchemyApiKey.value,
  walletConnectProjectId: walletConnectProjectId.value,
  contractAddress: store.getContractAddress(currentChainId.value),
});

const configIssues = computed(() => {
  const issues: string[] = [];
  if (!alchemyApiKey.value) issues.push(t('settings.issue_alchemy'));
  if (!store.getContractAddress(currentChainId.value)) issues.push(t('settings.issue_contract'));
  return issues;
});

const isLocked = (bank: PiggyBank) => Date.now() / 1000 < bank.unlockTime;

const openSettings = () => {
  settingsForm.value = {
    chainId: currentChainId.value,
    alchemyApiKey: alchemyApiKey.value,
    walletConnectProjectId: walletConnectProjectId.value,
    contractAddress: store.getContractAddress(currentChainId.value),
  };
  showSettings.value = true;
};

const onChainChange = (e: any) => {
  const idx = Number(e.detail.value);
  const chain = chainOptions.value[idx];
  if (!chain) return;
  settingsForm.value.chainId = chain.id;
  settingsForm.value.contractAddress = store.getContractAddress(chain.id);
};

const saveSettings = async () => {
  try {
    store.setAlchemyApiKey(settingsForm.value.alchemyApiKey);
    store.setWalletConnectProjectId(settingsForm.value.walletConnectProjectId);
    store.setContractAddress(settingsForm.value.chainId, settingsForm.value.contractAddress);
    await store.switchChain(settingsForm.value.chainId);
    showSettings.value = false;
  } catch (err: any) {
    uni.showToast({ title: err?.message || 'Settings error', icon: 'none' });
  }
};

const handleConnect = async () => {
  try {
    await store.connectWallet();
  } catch (err: any) {
    uni.showToast({ title: err?.message || t('wallet.connect_failed'), icon: 'none' });
  }
};

const goToCreate = () => {
  uni.navigateTo({ url: '/pages/create/create' });
};

const goToDetail = (id: string) => {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` });
};
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: 20px;
  box-sizing: border-box;
}

.header {
  margin-bottom: 30px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 32px;
  font-weight: 800;
  display: block;
  background: linear-gradient(90deg, #00ff9d, #00e5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.settings-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  padding: 6px 10px;
}

.subtitle {
  font-size: 16px;
  opacity: 0.7;
}

.status-row {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.status-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.status-chip.connected {
  background: rgba(0, 255, 157, 0.15);
  border-color: rgba(0, 255, 157, 0.4);
  color: #00ff9d;
}

.connect-btn {
  background: linear-gradient(90deg, #00ff9d, #00e5ff);
  color: #000;
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  font-weight: 700;
  font-size: 12px;
}

.config-warning {
  border: 1px solid rgba(255, 159, 67, 0.4);
  background: rgba(255, 159, 67, 0.12);
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.warning-title {
  font-weight: 700;
  display: block;
  margin-bottom: 6px;
}

.warning-item {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.content {
  flex: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  opacity: 0.5;
}

.create-btn {
  margin-top: 20px;
  background: linear-gradient(90deg, #00ff9d, #00e5ff);
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 10px 30px;
  font-weight: bold;
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  background: rgba(255, 255, 255, 0.05); // Glass
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  transition: transform 0.2s;
  
  &:active {
    transform: scale(0.98);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.bank-name {
  font-size: 20px;
  font-weight: bold;
}

.purpose {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 15px;
  display: block;
}

.progress-section {
  margin-bottom: 10px;
}

.label {
  font-size: 12px;
  opacity: 0.6;
}

.progress-bar-bg {
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
  margin-top: 5px;
  overflow: hidden;
}

.progress-bar-fill.unknown {
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg,
    rgba(255,255,255,0.1),
    rgba(255,255,255,0.1) 10px,
    rgba(255,255,255,0.2) 10px,
    rgba(255,255,255,0.2) 20px
  );
}

.date-info {
  font-size: 12px;
  opacity: 0.5;
  text-align: right;
  display: block;
}

.fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #00ff9d, #00e5ff);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 255, 157, 0.4);
  z-index: 100;
  
  &:active {
    transform: scale(0.9);
  }
}

.fab-icon {
  font-size: 32px;
  color: #000;
  font-weight: bold;
  margin-top: -4px; // Optical adjustment
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 420px;
  background: #0f0f0f;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.input-field {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  color: #fff;
}

.picker-view {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.04);
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.cancel-btn {
  flex: 1;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  padding: 10px;
  border-radius: 10px;
}

.submit-btn {
  flex: 1;
  background: linear-gradient(90deg, #00ff9d, #00e5ff);
  color: #000;
  border: none;
  border-radius: 10px;
  padding: 10px;
  font-weight: 700;
}
</style>
