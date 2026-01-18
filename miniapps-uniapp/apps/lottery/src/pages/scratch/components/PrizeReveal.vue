<template>
  <view class="prize-reveal" :class="{ winner: isWinner }">
    <view class="prize-content">
      <text v-if="isWinner" class="prize-amount">
        {{ formatPrize(prize) }}
      </text>
      <text v-else class="no-prize">谢谢参与</text>
    </view>
    <text v-if="tierLabel" class="tier-label">{{ tierLabel }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PRIZE_TIERS } from '../../../shared/composables/useLotteryTypes'

const props = defineProps<{
  prize: number
  tier?: number
}>()

const isWinner = computed(() => props.prize > 0)

const tierLabel = computed(() => {
  if (!props.tier) return ''
  const t = PRIZE_TIERS.find(p => p.tier === props.tier)
  return t?.label || ''
})

const formatPrize = (amount: number) => {
  return amount >= 1 ? `${amount.toFixed(2)} GAS` : `${amount.toFixed(4)} GAS`
}
</script>

<style lang="scss" scoped>
.prize-reveal {
  text-align: center;
  padding: 40rpx;
}

.prize-content {
  .prize-amount {
    font-size: 56rpx;
    font-weight: bold;
    color: #FCD34D;
  }
  .no-prize {
    font-size: 36rpx;
    color: #999;
  }
}

.tier-label {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #DC2626;
}
</style>
