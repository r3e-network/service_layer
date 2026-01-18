<template>
  <view class="scratch-card-item" @click="handleClick">
    <view class="card-banner" :style="{ backgroundColor: lottery.color }">
      <text class="card-icon">🎰</text>
    </view>
    <view class="card-content">
      <text class="card-name">{{ lottery.name }}</text>
      <text class="card-price">{{ lottery.priceDisplay }}</text>
      <view class="card-info">
        <text class="max-prize">最高 {{ lottery.maxJackpotDisplay }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { LotteryTypeInfo } from '../../../shared/composables/useLotteryTypes'

const props = defineProps<{
  lottery: LotteryTypeInfo
}>()

const emit = defineEmits<{
  select: [lottery: LotteryTypeInfo]
}>()

const handleClick = () => emit('select', props.lottery)
</script>

<style lang="scss" scoped>
.scratch-card-item {
  background: linear-gradient(145deg, #2d1a1a, #3d2020);
  border: 2rpx solid rgba(#F59E0B, 0.3);
  border-radius: 16rpx;
  overflow: hidden;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.card-banner {
  height: 160rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon {
  font-size: 64rpx;
}

.card-content {
  padding: 20rpx;
}

.card-name {
  display: block;
  font-size: 32rpx;
  color: #F59E0B;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.card-price {
  display: block;
  font-size: 28rpx;
  color: #D4A574;
  margin-bottom: 12rpx;
}

.card-info {
  .max-prize {
    font-size: 24rpx;
    color: #DC2626;
  }
}
</style>
