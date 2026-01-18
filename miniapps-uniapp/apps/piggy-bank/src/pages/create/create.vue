<template>
  <view class="container">
    <view class="nav">
      <text class="back-btn" @click="goBack">←</text>
      <text class="page-title">{{ t('create.create_btn') }}</text>
    </view>

    <view class="form-container">
      <view class="form-group">
        <text class="label">{{ t('create.name_label') }}</text>
        <input class="input-field" v-model="form.name" :placeholder="t('create.name_placeholder')" placeholder-class="placeholder" />
      </view>

      <view class="form-group">
        <text class="label">{{ t('create.purpose_label') }}</text>
        <input class="input-field" v-model="form.purpose" placeholder="What are you saving for?" placeholder-class="placeholder" />
      </view>

      <view class="form-group">
        <text class="label">{{ t('create.target_label') }}</text>
        <view class="target-row">
          <input class="input-field target-input" type="digit" v-model="form.targetAmount" placeholder="0.0" placeholder-class="placeholder" />
          
          <!-- Token Selector -->
          <view class="token-dropdown" @click="showTokenPicker = true">
            <text class="token-icon">{{ selectedToken?.icon || '🪙' }}</text>
            <text class="token-symbol">{{ selectedToken?.symbol || 'Select' }}</text>
            <text class="dropdown-arrow">▼</text>
          </view>
        </view>
      </view>

      <view class="form-group">
        <text class="label">{{ t('create.date_label') }}</text>
        <picker mode="date" :start="minDate" :value="form.date" @change="onDateChange">
           <view class="picker-view">
             {{ form.date || t('create.select_date') }}
           </view>
        </picker>
      </view>

      <view class="spacer"></view>

      <button class="submit-btn" @click="submit" :disabled="!isValid">
        {{ t('create.create_btn') }}
      </button>
    </view>
    
    <!-- Token Picker Modal -->
    <view class="modal-overlay" v-if="showTokenPicker" @click="showTokenPicker = false">
      <view class="modal-content" @click.stop>
        <text class="modal-title">{{ t('create.select_token') }}</text>
        
        <!-- Custom Token Input -->
        <view class="custom-token-section">
          <text class="section-label">{{ t('create.custom_token') }}</text>
          <view class="custom-input-row">
            <input 
              class="address-input" 
              v-model="customTokenAddress" 
              placeholder="0x..."
              placeholder-class="placeholder"
            />
            <button class="lookup-btn" @click="lookupCustomToken" :disabled="isLookingUp">
              {{ isLookingUp ? '...' : '🔍' }}
            </button>
          </view>
          <text class="lookup-error" v-if="lookupError">{{ lookupError }}</text>
        </view>
        
        <!-- Popular Tokens -->
        <text class="section-label">{{ t('create.popular_tokens') }}</text>
        <view class="token-list">
          <view 
            v-for="token in allTokens" 
            :key="token.address"
            class="token-row"
            :class="{ active: selectedToken?.address === token.address }"
            @click="selectToken(token)"
          >
            <text class="token-icon-lg">{{ token.icon }}</text>
            <view class="token-info">
              <text class="token-name">{{ token.name }}</text>
              <text class="token-sym">{{ token.symbol }}</text>
            </view>
            <text class="custom-badge" v-if="token.isCustom">Custom</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { usePiggyStore, type TokenInfo } from '@/stores/piggy';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();
const store = usePiggyStore();
const { currentChainId } = storeToRefs(store);

const showTokenPicker = ref(false);
const customTokenAddress = ref('');
const isLookingUp = ref(false);
const lookupError = ref('');

// Get all tokens (popular + custom)
const allTokens = computed(() => store.getAllTokens());

// Min date is tomorrow
const minDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
});

const selectedToken = ref<TokenInfo | null>(store.getDefaultToken());

watch(currentChainId, () => {
  selectedToken.value = store.getDefaultToken();
});

const form = ref({
  name: '',
  purpose: '',
  targetAmount: '',
  date: ''
});

const isValid = computed(() => {
  return form.value.name && form.value.targetAmount && form.value.date && selectedToken.value;
});

const onDateChange = (e: any) => {
  form.value.date = e.detail.value;
};

const selectToken = (token: TokenInfo) => {
  selectedToken.value = token;
  showTokenPicker.value = false;
};

const lookupCustomToken = async () => {
  if (!customTokenAddress.value) return;
  
  isLookingUp.value = true;
  lookupError.value = '';
  
  try {
    const token = await store.lookupToken(customTokenAddress.value);
    if (token) {
      selectedToken.value = token;
      showTokenPicker.value = false;
      customTokenAddress.value = '';
    } else {
      lookupError.value = 'Token not found or invalid address';
    }
  } catch (e: any) {
    lookupError.value = e.message || 'Failed to lookup token';
  } finally {
    isLookingUp.value = false;
  }
};

const goBack = () => uni.navigateBack();

const submit = () => {
  if (!isValid.value || !selectedToken.value) return;
  
  const unlockTimestamp = Math.floor(new Date(form.value.date).getTime() / 1000);
  if (unlockTimestamp <= Math.floor(Date.now() / 1000)) {
    uni.showToast({ title: t('create.invalid_date'), icon: 'none' });
    return;
  }
  
  try {
    store.createPiggyBank(
      form.value.name,
      form.value.purpose,
      form.value.targetAmount,
      selectedToken.value,
      unlockTimestamp
    );
    uni.showToast({ title: t('create.create_success'), icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 500);
  } catch (e: any) {
    uni.showToast({ title: e.message || t('create.invalid_date'), icon: 'none' });
  }
};
</script>

<style scoped lang="scss">
.container {
  padding: 20px;
  background: var(--bg-primary);
  min-height: 100vh;
  color: var(--text-primary);
}

.nav {
  display: flex;
  align-items: center;
  margin-bottom: 40px;
}

.back-btn {
  font-size: 24px;
  margin-right: 20px;
  padding: 10px;
}

.page-title {
  font-size: 20px;
  font-weight: bold;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.label {
  font-size: 14px;
  opacity: 0.8;
  font-weight: 500;
}

.target-row {
  display: flex;
  gap: 10px;
}

.target-input {
  flex: 1;
}

.token-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 120px;
}

.token-icon {
  font-size: 18px;
}

.token-symbol {
  font-weight: bold;
  font-size: 14px;
}

.dropdown-arrow {
  font-size: 10px;
  opacity: 0.5;
}

.input-field {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px;
  color: var(--text-primary);
  font-size: 16px;
  transition: all 0.3s;
  
  &:focus {
    border-color: #00ff9d;
    background: rgba(255, 255, 255, 0.1);
  }
}

.placeholder {
  color: rgba(255, 255, 255, 0.2);
}

.picker-view {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px;
  color: var(--text-primary);
}

.spacer {
  height: 40px;
}

.submit-btn {
  background: linear-gradient(90deg, #00ff9d, #00e5ff);
  color: #000;
  border-radius: 12px;
  padding: 15px;
  font-weight: bold;
  font-size: 16px;
  border: none;
  
  &:active {
    opacity: 0.8;
  }
  
  &[disabled] {
    opacity: 0.3;
    background: #555;
    color: #888;
  }
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 20px;
  padding: 25px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  display: block;
  text-align: center;
}

.section-label {
  font-size: 12px;
  opacity: 0.5;
  margin-bottom: 10px;
  display: block;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.custom-token-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.custom-input-row {
  display: flex;
  gap: 10px;
}

.address-input {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  color: var(--text-primary);
  font-size: 12px;
  font-family: monospace;
}

.lookup-btn {
  background: rgba(0, 255, 157, 0.2);
  border: 1px solid #00ff9d;
  border-radius: 10px;
  padding: 10px 15px;
  font-size: 16px;
}

.lookup-error {
  color: #ff6b6b;
  font-size: 11px;
  margin-top: 8px;
  display: block;
}

.token-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.token-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s;
  
  &.active {
    background: rgba(0, 255, 157, 0.1);
    border-color: #00ff9d;
  }
}

.token-icon-lg {
  font-size: 28px;
  width: 40px;
  text-align: center;
}

.token-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.token-name {
  font-size: 14px;
  font-weight: bold;
}

.token-sym {
  font-size: 11px;
  opacity: 0.5;
}

.custom-badge {
  font-size: 10px;
  background: rgba(0, 229, 255, 0.2);
  color: #00e5ff;
  padding: 3px 8px;
  border-radius: 4px;
}
</style>
