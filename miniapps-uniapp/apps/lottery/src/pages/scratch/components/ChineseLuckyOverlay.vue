<template>
  <view v-if="visible" class="lucky-overlay" @click="close">
    <!-- Gold Coins Rain -->
    <view class="coins-container">
      <view
        v-for="i in 20"
        :key="i"
        class="coin"
        :style="getCoinStyle(i)"
      >🪙</view>
    </view>

    <!-- Prize Display -->
      <view class="prize-card" @click.stop>
        <view class="prize-header">
        <text class="congrats">{{ t("scratchCongrats") }}</text>
      </view>
      <view class="prize-amount">
        <text class="amount">{{ prize }}</text>
        <text class="unit">GAS</text>
      </view>
      <view class="prize-tier">
        <text>{{ tierLabel }}</text>
      </view>
      <button class="btn-claim" @click="close">
        {{ t("scratchClaim") }}
      </button>
    </view>

    <!-- Red Confetti -->
    <view class="confetti-container">
      <view
        v-for="i in 30"
        :key="'c'+i"
        class="confetti"
        :style="getConfettiStyle(i)"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../../composables/useI18n'

const props = defineProps<{
  visible: boolean
  prize: number
  tier: number
}>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()
const tierLabel = computed(() => {
  const tierKeyMap: Record<number, string> = {
    1: "tierConsolation",
    2: "tierFifth",
    3: "tierFourth",
    4: "tierThird",
    5: "tierSpecial"
  }
  const key = tierKeyMap[props.tier]
  return key ? t(key as any) : ''
})

const close = () => emit('close')

const getCoinStyle = (i: number) => ({
  left: `${(i * 5) % 100}%`,
  animationDelay: `${i * 0.1}s`,
  animationDuration: `${1.5 + Math.random()}s`
})

const getConfettiStyle = (i: number) => ({
  left: `${(i * 3.3) % 100}%`,
  backgroundColor: i % 2 === 0 ? 'var(--lucky-red)' : 'var(--lucky-gold)',
  animationDelay: `${i * 0.05}s`
})
</script>

<style lang="scss" scoped>
.lucky-overlay {
  position: fixed;
  inset: 0;
  background: var(--lucky-overlay);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prize-card {
  background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));
  border: 4rpx solid var(--lucky-gold);
  border-radius: 24rpx;
  padding: 60rpx;
  text-align: center;
  z-index: 10;
}

.congrats {
  font-size: 36rpx;
  color: var(--lucky-gold-text);
}

.prize-amount {
  margin: 40rpx 0;
  .amount {
    font-size: 80rpx;
    font-weight: bold;
    color: var(--lucky-gold-light);
  }
  .unit {
    font-size: 32rpx;
    color: var(--text-secondary);
    margin-left: 10rpx;
  }
}

.prize-tier {
  color: var(--lucky-red-text);
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.btn-claim {
  background: linear-gradient(135deg, var(--lucky-gold), var(--lucky-gold-light));
  color: var(--button-on-warning);
  padding: 20rpx 60rpx;
  border-radius: 12rpx;
  font-weight: bold;
  border: none;
}

.coin {
  position: absolute;
  top: -50rpx;
  font-size: 40rpx;
  animation: coinFall 2s ease-in forwards;
}

.confetti {
  position: absolute;
  top: -20rpx;
  width: 16rpx;
  height: 16rpx;
  animation: confettiFall 3s ease-out forwards;
}

@keyframes coinFall {
  to { transform: translateY(120vh) rotate(720deg); }
}

@keyframes confettiFall {
  to { transform: translateY(120vh) rotate(360deg); opacity: 0; }
}
</style>
