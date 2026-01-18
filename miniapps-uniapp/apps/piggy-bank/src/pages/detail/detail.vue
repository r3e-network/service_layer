<template>
  <view class="container" v-if="bank">
    <!-- Header with Back -->
    <view class="nav">
      <text class="back-btn" @click="goBack">←</text>
      <text class="page-title">{{ bank.name }}</text>
    </view>

    <!-- Status Card -->
    <view class="hero-card" :style="{ borderColor: bank.themeColor, boxShadow: `0 0 20px ${bank.themeColor}30` }">
       <view class="lock-icon">{{ isLocked ? '🔒' : '🔓' }}</view>
       <text class="status-text">{{ isLocked ? t('detail.locked') : t('detail.unlocked') }}</text>
       
       <view class="balance-hidden" v-if="isLocked">
          <text class="hidden-label">{{ t('detail.balance_hidden') }}</text>
          <view class="dots">
             <view class="dot"></view><view class="dot"></view><view class="dot"></view>
          </view>
       </view>
       
       <!-- Show balances after unlock -->
       <view class="balance-revealed" v-else>
          <view v-for="(balance, address) in balances" :key="address" class="balance-row">
             <text class="token-icon">{{ balance.token.icon }}</text>
             <text class="token-balance">{{ balance.amount }} {{ balance.token.symbol }}</text>
          </view>
          <text class="empty-balance" v-if="Object.keys(balances).length === 0">No deposits</text>
       </view>

       <text class="unlock-date">{{ t('detail.unlocks_on', { date: new Date(bank.unlockTime * 1000).toLocaleDateString() }) }}</text>
    </view>

    <!-- Goal Check Section (ZK) -->
    <view class="section">
       <view class="section-header">
         <text class="section-title">
           {{ t('detail.goal') }}: {{ bank.targetAmount }} {{ bank.targetToken.symbol }}
         </text>
         <button class="zk-btn" @click="verifyGoal" :loading="checkingGoal">
           {{ checkingGoal ? '...' : t('detail.check_goal') }}
         </button>
       </view>
       
       <view v-if="goalStatus !== null" class="goal-feedback" :class="{ success: goalStatus }">
          {{ goalStatus ? t('detail.goal_reached') : t('detail.goal_not_reached') }}
       </view>
    </view>

    <view class="section" v-if="isWrongChain">
      <view class="warning-card">
        <text class="warning-text">{{ t('wallet.wrong_network') }}</text>
        <button class="switch-btn" @click="switchToBankChain">
          {{ t('wallet.switch_network') }}
        </button>
      </view>
    </view>

    <!-- Deposit Section -->
    <view class="section deposit-section" v-if="isLocked">
       <text class="section-title">{{ t('detail.deposit') }}</text>
       
       <!-- Token Selector -->
       <view class="token-selector">
         <view 
           v-for="token in availableTokens" 
           :key="token.address"
           class="token-option"
           :class="{ active: selectedToken?.address === token.address }"
           @click="selectedToken = token"
         >
           <text class="token-icon">{{ token.icon }}</text>
           <text class="token-name">{{ token.symbol }}</text>
         </view>
         <view class="token-option add-token" @click="showTokenInput = true">
           <text class="add-icon">+</text>
         </view>
       </view>
       
       <!-- Custom Token Input -->
       <view class="custom-token-input" v-if="showTokenInput">
         <input 
           class="address-input" 
           v-model="customTokenAddress" 
           placeholder="Enter any ERC-20 token address (0x...)"
           placeholder-class="placeholder"
         />
         <view class="btn-row">
           <button class="cancel-btn" @click="showTokenInput = false">Cancel</button>
           <button class="add-btn" @click="addCustomToken" :disabled="isLookingUp">
             {{ isLookingUp ? 'Loading...' : 'Add Token' }}
           </button>
         </view>
       </view>
       
       <view class="input-row">
          <input 
            class="amount-input" 
            type="digit" 
            v-model="depositAmount" 
            :placeholder="`0.0 ${selectedToken?.symbol || ''}`" 
          />
          <button class="deposit-btn" @click="handleDeposit" :disabled="!depositAmount || !selectedToken || isDepositing">
             {{ isDepositing ? t('common.loading') : t('detail.deposit') }}
          </button>
       </view>
       
       <text class="deposit-hint" v-if="selectedToken && !selectedToken.isNative">
         ⚠️ ERC-20 tokens require approval before deposit
       </text>
    </view>

    <!-- Smash Section -->
    <view class="section smash-section" v-if="!isLocked">
       <button class="smash-btn" @click="handleSmash" :disabled="isWithdrawing">
          {{ isWithdrawing ? t('common.loading') : `🔨 ${t('detail.smash')}` }}
       </button>
    </view>
    
    <!-- Deposit History -->
    <view class="section history-section" v-if="bank.notes.length > 0">
       <text class="section-title">{{ t('detail.deposits') }} ({{ bank.notes.length }})</text>
       <view class="note-list">
         <view v-for="(note, idx) in bank.notes" :key="idx" class="note-item">
           <view class="note-info">
             <view class="note-token">
               <text class="note-icon">{{ note.token.icon }}</text>
               <text class="note-amount">{{ note.amount }} {{ note.token.symbol }}</text>
             </view>
             <text class="note-status" :class="{ confirmed: note.depositTxHash, spent: note.isSpent }">
               {{ note.isSpent ? '✓ Withdrawn' : (note.depositTxHash ? '✓ Confirmed' : '⏳ Pending') }}
             </text>
           </view>
         </view>
       </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { storeToRefs } from 'pinia';
import { usePiggyStore, type TokenInfo } from '@/stores/piggy';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();
const store = usePiggyStore();
const { currentChainId, isConnected } = storeToRefs(store);
const bankId = ref('');
const depositAmount = ref('');
const selectedToken = ref<TokenInfo | null>(store.getDefaultToken());
const checkingGoal = ref(false);
const goalStatus = ref<boolean | null>(null);
const isDepositing = ref(false);
const isWithdrawing = ref(false);
const showTokenInput = ref(false);
const customTokenAddress = ref('');
const isLookingUp = ref(false);

const bank = computed(() => store.piggyBanks.find(b => b.id === bankId.value));
const isLocked = computed(() => bank.value ? Date.now() / 1000 < bank.value.unlockTime : true);
const balances = computed(() => bank.value ? store.getBalances(bankId.value) : {});
const isWrongChain = computed(() => bank.value ? bank.value.chainId !== currentChainId.value : false);

// Available tokens for quick selection
const availableTokens = computed(() => store.getAllTokens().slice(0, 6)); // Show first 6

watch(currentChainId, () => {
  selectedToken.value = store.getDefaultToken();
});

onLoad((options: any) => {
  if (options.id) {
    bankId.value = options.id;
  }
});

const goBack = () => uni.navigateBack();

const switchToBankChain = async () => {
  if (!bank.value) return;
  try {
    await store.switchChain(bank.value.chainId);
  } catch (e: any) {
    uni.showToast({ title: e.message || 'Switch failed', icon: 'none' });
  }
};

const addCustomToken = async () => {
  if (!customTokenAddress.value) return;
  
  isLookingUp.value = true;
  try {
    const token = await store.lookupToken(customTokenAddress.value);
    if (token) {
      selectedToken.value = token;
      showTokenInput.value = false;
      customTokenAddress.value = '';
      uni.showToast({ title: `Added ${token.symbol}`, icon: 'success' });
    } else {
      uni.showToast({ title: 'Invalid token address', icon: 'none' });
    }
  } catch (e: any) {
    uni.showToast({ title: e.message || 'Failed', icon: 'none' });
  } finally {
    isLookingUp.value = false;
  }
};

const verifyGoal = async () => {
    checkingGoal.value = true;
    goalStatus.value = null;
    try {
        const result = await store.checkGoalReached(bankId.value);
        goalStatus.value = result;
    } finally {
        checkingGoal.value = false;
    }
};

const handleDeposit = async () => {
    if (!depositAmount.value || !bank.value || !selectedToken.value) return;
    
    isDepositing.value = true;
    try {
        const confirmed = await new Promise<boolean>((resolve) => {
          uni.showModal({
            title: '⚠️ Important',
            content: `Depositing ${depositAmount.value} ${selectedToken.value.symbol}. Your note has been saved locally. If you clear app data, you will lose access to these funds forever!`,
            confirmText: 'I Understand',
            success: (res) => resolve(Boolean(res.confirm)),
            fail: () => resolve(false),
          });
        });
        if (!confirmed) return;

        if (!isConnected.value) {
          await store.connectWallet();
        }
        await store.sendDeposit(bankId.value, depositAmount.value, selectedToken.value);
        uni.showToast({ title: t('detail.deposit_success'), icon: 'success' });
        depositAmount.value = '';
        goalStatus.value = null;
    } catch (e: any) {
        uni.showToast({ title: e.message || 'Error', icon: 'none' });
    } finally {
        isDepositing.value = false;
    }
};

const handleSmash = async () => {
    if (!bank.value) return;
    
    isWithdrawing.value = true;
    try {
        const withdrawals = store.previewWithdrawals(bankId.value);
        
        if (withdrawals.length === 0) {
            uni.showToast({ title: 'No confirmed deposits to withdraw', icon: 'none' });
            return;
        }
        
        const summary = withdrawals.map(w => `${w.amount} ${w.token.symbol}`).join('\n');
        
        const confirmed = await new Promise<boolean>((resolve) => {
          uni.showModal({
            title: '🔨 Smash Piggy Bank!',
            content: `Withdrawing:\n${summary}\n\nThis will send ZK proofs to the contract.`,
            success: (res) => resolve(Boolean(res.confirm)),
            fail: () => resolve(false),
          });
        });
        if (!confirmed) return;

        if (!isConnected.value) {
          await store.connectWallet();
        }
        await store.withdraw(bankId.value);
        uni.showToast({ title: t('detail.smash_success'), icon: 'success' });
    } catch (e: any) {
        uni.showToast({ title: e.message, icon: 'none' });
    } finally {
        isWithdrawing.value = false;
    }
};
</script>

<style scoped lang="scss">
.container {
  padding: 20px;
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.nav {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
}
.back-btn {
    font-size: 24px;
    padding: 10px;
    margin-right: 10px;
}
.page-title {
    font-size: 20px;
    font-weight: bold;
}

.hero-card {
    background: rgba(255,255,255,0.05);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 40px 20px;
    border: 1px solid rgba(255,255,255,0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 30px;
}

.lock-icon {
    font-size: 48px;
    margin-bottom: 10px;
}
.status-text {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 20px;
}

.balance-hidden {
    background: rgba(0,0,0,0.3);
    padding: 10px 20px;
    border-radius: 12px;
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.balance-revealed {
    background: rgba(0,255,157,0.1);
    padding: 15px 25px;
    border-radius: 12px;
    margin-bottom: 15px;
    width: 100%;
}

.balance-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    
    &:last-child {
        border-bottom: none;
    }
}

.empty-balance {
    opacity: 0.5;
    text-align: center;
    font-size: 14px;
}

.token-icon {
    font-size: 20px;
    width: 30px;
    text-align: center;
}

.token-balance {
    font-size: 16px;
    font-weight: bold;
}

.hidden-label {
    font-size: 12px;
    opacity: 0.6;
    margin-bottom: 5px;
}

.dots {
    display: flex;
    gap: 4px;
    .dot {
        width: 8px;
        height: 8px;
        background: currentColor;
        border-radius: 50%;
        opacity: 0.5;
        animation: pulse 1s infinite alternate;
    }
}

.unlock-date {
    font-size: 12px;
    opacity: 0.5;
}

.section {
    margin-bottom: 30px;
    background: rgba(255,255,255,0.02);
    padding: 20px;
    border-radius: 16px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
}

.warning-card {
  border: 1px solid rgba(255, 159, 67, 0.4);
  background: rgba(255, 159, 67, 0.12);
  padding: 14px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.warning-text {
  font-size: 13px;
  font-weight: 600;
}

.switch-btn {
  background: #ff9f43;
  color: #000;
  border: none;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
}

.token-selector {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
}

.token-option {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 12px;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.1);
    transition: all 0.3s;
    
    &.active {
        background: rgba(0,255,157,0.2);
        border-color: #00ff9d;
    }
    
    &.add-token {
        border-style: dashed;
    }
}

.add-icon {
    font-size: 18px;
    opacity: 0.5;
}

.token-name {
    font-size: 12px;
    font-weight: bold;
}

.custom-token-input {
    background: rgba(0,0,0,0.2);
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 15px;
}

.address-input {
    width: 100%;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 12px;
    color: var(--text-primary);
    font-family: monospace;
    font-size: 12px;
    margin-bottom: 10px;
}

.btn-row {
    display: flex;
    gap: 10px;
}

.cancel-btn {
    flex: 1;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 8px;
    padding: 8px;
    color: var(--text-primary);
}

.add-btn {
    flex: 1;
    background: linear-gradient(90deg, #00ff9d, #00e5ff);
    border: none;
    border-radius: 8px;
    padding: 8px;
    color: #000;
    font-weight: bold;
}

.deposit-btn, .zk-btn {
    background: linear-gradient(90deg, #00ff9d, #00e5ff);
    color: #000;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    padding: 8px 16px;
    font-weight: bold;
}

.zk-btn {
    background: rgba(255,255,255,0.1);
    color: var(--text-primary);
    border: 1px solid rgba(255,255,255,0.2);
}

.input-row {
    display: flex;
    gap: 10px;
}

.amount-input {
    flex: 1;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    padding: 10px;
    color: var(--text-primary);
    border: 1px solid rgba(255,255,255,0.1);
}

.deposit-hint {
    font-size: 11px;
    opacity: 0.6;
    margin-top: 10px;
    display: block;
}

.goal-feedback {
    margin-top: 10px;
    padding: 10px;
    border-radius: 8px;
    background: rgba(255,0,0,0.1);
    color: #ff9999;
    text-align: center;
    
    &.success {
        background: rgba(0,255,157,0.1);
        color: #00ff9d;
    }
}

.smash-btn {
    width: 100%;
    background: linear-gradient(90deg, #ff00ff, #ff00aa);
    color: white;
    font-weight: bold;
    font-size: 18px;
    padding: 20px;
    border-radius: 12px;
    border: none;
    box-shadow: 0 5px 20px rgba(255, 0, 100, 0.4);
    
    &:active {
        transform: scale(0.98);
    }
}

.note-list {
    margin-top: 10px;
}

.note-item {
    padding: 12px;
    background: rgba(0,0,0,0.2);
    border-radius: 8px;
    margin-bottom: 8px;
}

.note-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.note-token {
    display: flex;
    align-items: center;
    gap: 8px;
}

.note-icon {
    font-size: 16px;
}

.note-amount {
    font-weight: bold;
}

.note-status {
    font-size: 11px;
    opacity: 0.6;
    
    &.confirmed {
        color: #00ff9d;
        opacity: 1;
    }
    &.spent {
        color: #888;
    }
}

@keyframes pulse {
    from { opacity: 0.3; }
    to { opacity: 0.8; }
}
</style>
