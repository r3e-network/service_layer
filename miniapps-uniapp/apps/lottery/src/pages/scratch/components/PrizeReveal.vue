<template>
  <view class="prize-reveal" :class="{ winner: isWinner }">
    <view class="prize-content">
      <text v-if="isWinner" class="prize-amount">
        {{ formatPrize(prize) }}
      </text>
      <text v-else class="no-prize">{{ t("scratchNoPrize") }}</text>
    </view>
    <text v-if="tierLabel" class="tier-label">{{ tierLabel }}</text>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../../composables/useI18n'

const props = defineProps<{
  prize: number
  tier?: number
}>()

const isWinner = computed(() => props.prize > 0)
const { t } = useI18n()

const tierLabel = computed(() => {
  if (!props.tier) return ''
  const tierKeyMap: Record<number, string> = {
    1: "tierBreakEven",
    2: "tierDoubleUp",
    3: "tierLuckyStrike",
    4: "tierFortune",
    5: "tierJackpot"
  }
  const key = tierKeyMap[props.tier]
  return key ? t(key as any) : ''
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
    color: var(--lucky-gold-light);
  }
  .no-prize {
    font-size: 36rpx;
    color: var(--text-muted);
  }
}

.tier-label {
  display: block;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: var(--lucky-red-text);
}
</style>
