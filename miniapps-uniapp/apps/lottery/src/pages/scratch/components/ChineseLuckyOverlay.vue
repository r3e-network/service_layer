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
        <text class="congrats">🎉 恭喜中奖 🎉</text>
      </view>
      <view class="prize-amount">
        <text class="amount">{{ prize }}</text>
        <text class="unit">GAS</text>
      </view>
      <view class="prize-tier">
        <text>{{ tierLabel }}</text>
      </view>
      <button class="btn-claim" @click="close">
        领取奖励
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

const props = defineProps<{
  visible: boolean
  prize: number
  tier: number
}>()

const emit = defineEmits<{
  close: []
}>()

const tierLabels = ['', '安慰奖', '五等奖', '四等奖', '三等奖', '特等奖']
const tierLabel = computed(() => tierLabels[props.tier] || '')

const close = () => emit('close')

const getCoinStyle = (i: number) => ({
  left: `${(i * 5) % 100}%`,
  animationDelay: `${i * 0.1}s`,
  animationDuration: `${1.5 + Math.random()}s`
})

const getConfettiStyle = (i: number) => ({
  left: `${(i * 3.3) % 100}%`,
  backgroundColor: i % 2 === 0 ? '#DC2626' : '#F59E0B',
  animationDelay: `${i * 0.05}s`
})
</script>

<style lang="scss" scoped>
.lucky-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prize-card {
  background: linear-gradient(145deg, #3d1515, #4d1a1a);
  border: 4rpx solid #F59E0B;
  border-radius: 24rpx;
  padding: 60rpx;
  text-align: center;
  z-index: 10;
}

.congrats {
  font-size: 36rpx;
  color: #F59E0B;
}

.prize-amount {
  margin: 40rpx 0;
  .amount {
    font-size: 80rpx;
    font-weight: bold;
    color: #FCD34D;
  }
  .unit {
    font-size: 32rpx;
    color: #D4A574;
    margin-left: 10rpx;
  }
}

.prize-tier {
  color: #DC2626;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.btn-claim {
  background: linear-gradient(135deg, #F59E0B, #FCD34D);
  color: #1a0a0a;
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
