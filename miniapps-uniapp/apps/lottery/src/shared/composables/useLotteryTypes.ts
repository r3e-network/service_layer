import { ref, computed } from 'vue'
import { useI18n } from '../../composables/useI18n'

// Lottery type enum matching contract
export enum LotteryType {
  ScratchWin = 0,    // 福彩刮刮乐
  DoubleColor = 1,   // 双色球
  Happy8 = 2,        // 快乐8
  Lucky7 = 3,        // 七乐彩
  SuperLotto = 4,    // 大乐透
  Supreme = 5        // 至尊彩
}

export interface LotteryTypeInfo {
  type: LotteryType
  key: string
  name: string
  nameEn: string
  nameZh?: string
  price: number
  priceDisplay: string
  isInstant: boolean
  maxJackpot: number
  maxJackpotDisplay: string
  description: string
  descriptionZh?: string
  banner: string
  color: string
}

// Lottery type definitions
// Lottery type definitions
export const LOTTERY_TYPES: LotteryTypeInfo[] = [
  {
    type: LotteryType.ScratchWin, // Reuse ID 0 for Basic
    key: 'neo-bronze',
    name: 'Neo Bronze',
    nameEn: 'Neo Bronze',
    nameZh: 'Neo 青铜',
    price: 1,
    priceDisplay: '1 GAS',
    isInstant: true,
    maxJackpot: 100,
    maxJackpotDisplay: '100 GAS',
    description: 'Entry level lucky draw. Win up to 100x!',
    descriptionZh: '入门级幸运抽奖，最高赢取 100 倍！',
    banner: '/static/lottery/bronze.png',
    color: '#CD7F32' // Bronze
  },
  {
    type: LotteryType.DoubleColor, // Reuse ID 1
    key: 'neo-silver',
    name: 'Neo Silver',
    nameEn: 'Neo Silver',
    nameZh: 'Neo 白银',
    price: 2,
    priceDisplay: '2 GAS',
    isInstant: true,
    maxJackpot: 500,
    maxJackpotDisplay: '500 GAS',
    description: 'Double the stakes, 5x the maximum payout.',
    descriptionZh: '加倍下注，最高 5 倍奖金。',
    banner: '/static/lottery/silver.png',
    color: '#C0C0C0' // Silver
  },
  {
    type: LotteryType.Happy8, // Reuse ID 2
    key: 'neo-gold',
    name: 'Neo Gold',
    nameEn: 'Neo Gold',
    nameZh: 'Neo 黄金',
    price: 3,
    priceDisplay: '3 GAS',
    isInstant: true,
    maxJackpot: 2000,
    maxJackpotDisplay: '2,000 GAS',
    description: 'Golden opportunity for massive rewards.',
    descriptionZh: '黄金机会，大额奖励等你来。',
    banner: '/static/lottery/gold.png',
    color: '#FFD700' // Gold
  },
  {
    type: LotteryType.Lucky7, // Reuse ID 3
    key: 'neo-platinum',
    name: 'Neo Platinum',
    nameEn: 'Neo Platinum',
    nameZh: 'Neo 铂金',
    price: 4,
    priceDisplay: '4 GAS',
    isInstant: true,
    maxJackpot: 5000,
    maxJackpotDisplay: '5,000 GAS',
    description: 'Premium tier with elite winning potential.',
    descriptionZh: '尊享等级，赢取更高大奖。',
    banner: '/static/lottery/platinum.png',
    color: '#E5E4E2' // Platinum
  },
  {
    type: LotteryType.SuperLotto, // Reuse ID 4
    key: 'neo-diamond',
    name: 'Neo Diamond',
    nameEn: 'Neo Diamond',
    nameZh: 'Neo 钻石',
    price: 5,
    priceDisplay: '5 GAS',
    isInstant: true,
    maxJackpot: 10000,
    maxJackpotDisplay: '10,000 GAS',
    description: 'The ultimate jackpot experience.',
    descriptionZh: '终极大奖体验，冲击巅峰。',
    banner: '/static/lottery/diamond.png',
    color: '#B9F2FF' // Diamond
  }
]

// Prize tier definitions (Generic structure, actual odds handled by contract)
export const PRIZE_TIERS = [
  { tier: 1, odds: 10, multiplier: 1, label: 'Break Even' },     // 10%
  { tier: 2, odds: 5, multiplier: 2, label: 'Double Up' },       // 5%
  { tier: 3, odds: 1, multiplier: 10, label: 'Lucky Strike' },   // 1%
  { tier: 4, odds: 0.1, multiplier: 50, label: 'Fortune' },      // 0.1%
  { tier: 5, odds: 0.001, multiplier: 1000, label: 'Jackpot' }   // 0.001%
]

// Composable function
export function useLotteryTypes() {
  const { locale } = useI18n()
  const selectedType = ref<LotteryType>(LotteryType.ScratchWin)
  const isZh = computed(() => locale.value === 'zh')

  const localizeLottery = (lottery?: LotteryTypeInfo | null): LotteryTypeInfo | undefined => {
    if (!lottery) return undefined
    const name = isZh.value ? lottery.nameZh || lottery.name : lottery.nameEn || lottery.name
    const description = isZh.value ? lottery.descriptionZh || lottery.description : lottery.description
    return {
      ...lottery,
      name,
      description
    }
  }

  const instantTypes = computed(() =>
    LOTTERY_TYPES.filter(t => t.isInstant).map((lottery) => localizeLottery(lottery) as LotteryTypeInfo)
  )

  const scheduledTypes = computed(() =>
    LOTTERY_TYPES.filter(t => !t.isInstant).map((lottery) => localizeLottery(lottery) as LotteryTypeInfo)
  )

  const currentType = computed(() =>
    localizeLottery(LOTTERY_TYPES.find(t => t.type === selectedType.value))
  )

  const getLotteryType = (type: LotteryType) =>
    localizeLottery(LOTTERY_TYPES.find(t => t.type === type))

  const getLotteryByKey = (key: string) =>
    localizeLottery(LOTTERY_TYPES.find(t => t.key === key))

  const calculatePrize = (type: LotteryType, tier: number) => {
    const lottery = getLotteryType(type)
    if (!lottery) return 0
    const prizeTier = PRIZE_TIERS.find(t => t.tier === tier)
    if (!prizeTier) return 0
    return lottery.price * prizeTier.multiplier
  }

  return {
    selectedType,
    instantTypes,
    scheduledTypes,
    currentType,
    getLotteryType,
    getLotteryByKey,
    calculatePrize,
    LOTTERY_TYPES,
    PRIZE_TIERS
  }
}
