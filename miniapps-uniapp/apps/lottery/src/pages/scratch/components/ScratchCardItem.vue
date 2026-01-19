<template>
  <view class="scratch-card-item" @click="handleClick">
    <view class="card-banner" :style="{ backgroundColor: lottery.color }">
      <text class="card-icon">🎰</text>
    </view>
    <view class="card-content">
      <text class="card-name">{{ lottery.name }}</text>
      <text class="card-price">{{ lottery.priceDisplay }}</text>
      <view class="card-info">
      <text class="max-prize">{{ t("maxPrize") }} {{ lottery.maxJackpotDisplay }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { LotteryTypeInfo } from '../../../shared/composables/useLotteryTypes'
import { useI18n } from '../../../composables/useI18n'

const { t } = useI18n()

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
  background: linear-gradient(145deg, var(--bg-card), var(--bg-elevated));
  border: 2rpx solid var(--lucky-gold-soft);
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
  color: var(--lucky-gold-text);
  font-weight: bold;
  margin-bottom: 8rpx;
}

.card-price {
  display: block;
  font-size: 28rpx;
  color: var(--text-muted);
  margin-bottom: 12rpx;
}

.card-info {
  .max-prize {
    font-size: 24rpx;
    color: var(--lucky-red-text);
  }
}
</style>
