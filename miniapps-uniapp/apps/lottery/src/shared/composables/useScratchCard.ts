/**
 * useScratchCard - Scratch card composable for lottery miniapp
 * Handles SDK integration for buying and revealing scratch tickets
 */
import { ref, computed } from 'vue'
import { useI18n } from "@/composables/useI18n"
import { LotteryType, LOTTERY_TYPES, PRIZE_TIERS } from './useLotteryTypes'
import { parseInvokeResult, parseStackItem, type ParsedStackValue } from '../utils/neo'

// Types
export interface ScratchTicket {
  id: string
  player: string
  type: LotteryType
  purchaseTime: number
  scratched: boolean
  prize: number
}

export interface BuyTicketResult {
  ticketId: string
  lotteryType: LotteryType
  price: number
}

export interface RevealResult {
  ticketId: string
  lotteryType: LotteryType
  isWinner: boolean
  prize: number
  purchaseTime: number
  tier?: number
}

const APP_ID = 'miniapp-lottery'
let cachedContractAddress: string | null = null

// Use any for SDK to avoid type conflicts with @neo/uniapp-sdk
type MiniAppSDKType = {
  invoke(method: string, params?: Record<string, unknown>): Promise<unknown>
  getConfig(): { contractAddress?: string | null }
  payments: {
    payGAS(appId: string, amount: string, memo?: string): Promise<{
      request_id: string
      receipt_id?: string | null
      invocation?: unknown
    }>
  }
  wallet: {
    getAddress(): Promise<string>
    invokeIntent?(requestId: string): Promise<unknown>
  }
  events?: {
    list(params?: { app_id?: string; event_name?: string; limit?: number }): Promise<{
      events: Array<{ tx_hash?: string; state?: unknown }>
    }>
  }
}

/**
 * Wait for SDK to be available
 */
async function waitForSDK(
  t: (key: string, args?: Record<string, string | number>) => string,
  timeout = 5000
): Promise<MiniAppSDKType> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error(t("sdkUnavailable")))
      return
    }

    const sdk = (window as any).MiniAppSDK
    if (sdk) {
      resolve(sdk as MiniAppSDKType)
      return
    }

    const timer = setTimeout(() => {
      reject(new Error(t("sdkInitTimeout")))
    }, timeout)

    const handler = () => {
      clearTimeout(timer)
      const sdk = (window as any).MiniAppSDK
      if (sdk) {
        resolve(sdk as MiniAppSDKType)
      } else {
        reject(new Error(t("sdkUnavailable")))
      }
    }

    window.addEventListener('miniapp-sdk-ready', handler, { once: true })
  })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const resolveContractAddress = async (
  sdk: MiniAppSDKType,
  t: (key: string, args?: Record<string, string | number>) => string
): Promise<string> => {
  if (cachedContractAddress) return cachedContractAddress
  const local = sdk.getConfig?.()
  if (local?.contractAddress) {
    cachedContractAddress = local.contractAddress
    return cachedContractAddress
  }
  try {
    const remote = (await sdk.invoke('getConfig')) as { contractAddress?: string | null } | undefined
    if (remote?.contractAddress) {
      cachedContractAddress = remote.contractAddress
      return cachedContractAddress
    }
  } catch {
    // Ignore and fall through to error.
  }
  throw new Error(t("contractUnavailable"))
}

const parseScratchTicket = (payload: ParsedStackValue): ScratchTicket | null => {
  if (!payload) return null
  if (Array.isArray(payload)) {
    const [id, player, type, purchaseTime, scratched, prize] = payload
    const parsedId = String(id ?? '')
    if (!parsedId) return null
    return {
      id: parsedId,
      player: String(player ?? ''),
      type: Number(type ?? 0) as LotteryType,
      purchaseTime: Number(purchaseTime ?? 0),
      scratched: scratched === true || scratched === 'true' || scratched === 1 || scratched === '1',
      prize: Number(prize ?? 0),
    }
  }
  if (typeof payload === 'object') {
    const data = payload as Record<string, unknown>
    const parsedId = String(data.Id ?? data.id ?? '')
    if (!parsedId) return null
    return {
      id: parsedId,
      player: String(data.Player ?? data.player ?? ''),
      type: Number(data.Type ?? data.type ?? 0) as LotteryType,
      purchaseTime: Number(data.PurchaseTime ?? data.purchaseTime ?? 0),
      scratched:
        data.Scratched === true ||
        data.Scratched === 'true' ||
        data.Scratched === 1 ||
        data.Scratched === '1' ||
        data.scratched === true ||
        data.scratched === 'true' ||
        data.scratched === 1 ||
        data.scratched === '1',
      prize: Number(data.Prize ?? data.prize ?? 0),
    }
  }
  return null
}

/**
 * Composable for scratch card operations
 */
export function useScratchCard() {
  const { t } = useI18n()
  const translate = t as unknown as (key: string, args?: Record<string, string | number>) => string
  // State
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const currentTicket = ref<ScratchTicket | null>(null)
  const playerTickets = ref<ScratchTicket[]>([])
  const lastRevealResult = ref<RevealResult | null>(null)
  const playerAddress = ref<string | null>(null)

  const waitForEvent = async (sdk: MiniAppSDKType, txid: string, eventName: string) => {
    if (!sdk.events?.list || !txid) return null
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const res = await sdk.events.list({ app_id: APP_ID, event_name: eventName, limit: 25 })
      const match = res.events.find((evt) => evt.tx_hash === txid)
      if (match) return match
      await sleep(1500)
    }
    return null
  }

  const fetchScratchTicket = async (sdk: MiniAppSDKType, contract: string, ticketId: string) => {
    const result = await sdk.invoke('invokeRead', {
      contract,
      method: 'GetScratchTicket',
      args: [{ type: 'Integer', value: ticketId }],
    })
    return parseScratchTicket(parseInvokeResult(result))
  }

  /**
   * Get player's wallet address
   */
  const getPlayerAddress = async (): Promise<string> => {
    if (playerAddress.value) return playerAddress.value

    const sdk = await waitForSDK(translate)
    const address = await sdk.wallet.getAddress()
    playerAddress.value = address
    return address
  }

  /**
   * Buy a scratch ticket
   */
  const buyTicket = async (lotteryType: LotteryType): Promise<BuyTicketResult> => {
    isLoading.value = true
    error.value = null

    try {
      const sdk = await waitForSDK(translate)
      const address = await getPlayerAddress()

      // Get lottery type info
      const typeInfo = LOTTERY_TYPES.find(t => t.type === lotteryType)
      if (!typeInfo) {
        throw new Error(t("invalidLotteryType"))
      }

      if (!typeInfo.isInstant) {
        throw new Error(t("lotteryNotInstant"))
      }

      const contract = await resolveContractAddress(sdk, translate)

      // Step 1: Pay for the ticket
      const paymentResponse = await sdk.payments.payGAS(
        APP_ID,
        typeInfo.price.toString(),
        `scratch:${lotteryType}:1`
      )

      // Step 2: Invoke wallet to sign the transaction
      if (sdk.wallet.invokeIntent) {
        const intentId = paymentResponse.receipt_id || paymentResponse.request_id
        await sdk.wallet.invokeIntent(intentId)
      }

      const receiptId = paymentResponse.receipt_id
      if (!receiptId) {
        throw new Error(t("receiptMissing"))
      }

      // Step 3: Call contract to buy scratch ticket
      const tx = await sdk.invoke('invokeFunction', {
        contract,
        method: 'BuyScratchTicket',
        args: [
          { type: 'Hash160', value: address },
          { type: 'Integer', value: String(lotteryType) },
          { type: 'Integer', value: String(receiptId) },
        ],
      })

      const txid = String((tx as any)?.txid || (tx as any)?.txHash || '')
      let ticketId = ''
      const purchasedEvent = txid ? await waitForEvent(sdk, txid, 'ScratchTicketPurchased') : null
      if (purchasedEvent?.state && Array.isArray(purchasedEvent.state)) {
        const values = purchasedEvent.state.map(parseStackItem)
        ticketId = String(values[1] ?? '')
      }

      if (!ticketId) {
        await loadPlayerTickets()
        const latest = [...playerTickets.value].sort((a, b) => b.purchaseTime - a.purchaseTime)[0]
        ticketId = latest?.id || ''
      }

      if (!ticketId) {
        throw new Error(t("ticketPending"))
      }

      // Refresh player tickets
      await loadPlayerTickets()

      return {
        ticketId,
        lotteryType,
        price: typeInfo.price,
      }
    } catch (e) {
      error.value = e as Error
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Reveal/scratch a ticket
   */
  const revealTicket = async (ticketId: string): Promise<RevealResult> => {
    isLoading.value = true
    error.value = null

    try {
      const sdk = await waitForSDK(translate)
      const address = await getPlayerAddress()
      const contract = await resolveContractAddress(sdk, translate)

      const tx = await sdk.invoke('invokeFunction', {
        contract,
        method: 'RevealScratchTicket',
        args: [
          { type: 'Hash160', value: address },
          { type: 'Integer', value: ticketId },
        ],
      })

      const txid = String((tx as any)?.txid || (tx as any)?.txHash || '')
      const revealedEvent = txid ? await waitForEvent(sdk, txid, 'ScratchTicketRevealed') : null

      let prizeValue = 0
      let isWinner = false
      if (revealedEvent?.state && Array.isArray(revealedEvent.state)) {
        const values = revealedEvent.state.map(parseStackItem)
        prizeValue = Number(values[2] ?? 0)
        isWinner = Boolean(values[3])
      }

      const updatedTicket = await fetchScratchTicket(sdk, contract, ticketId)
      const ticketInfo = updatedTicket || getTicket(ticketId)
      const lotteryType = ticketInfo?.type ?? LotteryType.ScratchWin
      const purchaseTime = ticketInfo?.purchaseTime ?? 0

      if (updatedTicket && !revealedEvent) {
        prizeValue = updatedTicket.prize
        isWinner = updatedTicket.prize > 0
      }

      if (updatedTicket) {
        const index = playerTickets.value.findIndex(t => t.id === ticketId)
        if (index >= 0) {
          playerTickets.value[index] = updatedTicket
        } else {
          playerTickets.value.push(updatedTicket)
        }
      }

      // Calculate prize tier
      let tier: number | undefined
      if (isWinner && prizeValue > 0) {
        const typeInfo = LOTTERY_TYPES.find(t => t.type === lotteryType)
        if (typeInfo) {
          const multiplier = prizeValue / typeInfo.price
          const prizeTier = PRIZE_TIERS.find(t => t.multiplier === multiplier)
          tier = prizeTier?.tier
        }
      }

      const revealResult: RevealResult = {
        ticketId,
        lotteryType,
        isWinner,
        prize: prizeValue,
        purchaseTime,
        tier
      }

      lastRevealResult.value = revealResult

      // Update local ticket state
      const ticketIndex = playerTickets.value.findIndex(t => t.id === ticketId)
      if (ticketIndex >= 0) {
        playerTickets.value[ticketIndex].scratched = true
        playerTickets.value[ticketIndex].prize = prizeValue
      }

      return revealResult
    } catch (e) {
      error.value = e as Error
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load player's scratch tickets
   */
  const loadPlayerTickets = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const sdk = await waitForSDK(translate)
      const address = await getPlayerAddress()
      const contract = await resolveContractAddress(sdk, translate)

      const result = await sdk.invoke('invokeRead', {
        contract,
        method: 'GetPlayerScratchTickets',
        args: [
          { type: 'Hash160', value: address },
          { type: 'Integer', value: '0' },
          { type: 'Integer', value: '50' },
        ],
      })

      const parsed = parseInvokeResult(result)
      const tickets = Array.isArray(parsed)
        ? parsed.map(parseScratchTicket).filter((ticket): ticket is ScratchTicket => !!ticket)
        : []
      playerTickets.value = tickets.sort((a, b) => b.purchaseTime - a.purchaseTime)
    } catch (e) {
      error.value = e as Error
      playerTickets.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get unscratched tickets
   */
  const unscratchedTickets = computed(() =>
    playerTickets.value.filter(t => !t.scratched)
  )

  /**
   * Get scratched tickets
   */
  const scratchedTickets = computed(() =>
    playerTickets.value.filter(t => t.scratched)
  )

  /**
   * Get ticket by ID
   */
  const getTicket = (ticketId: string): ScratchTicket | undefined =>
    playerTickets.value.find(t => t.id === ticketId)

  /**
   * Get prize tier label
   */
  const getPrizeTierLabel = (tier: number): string => {
    const prizeTier = PRIZE_TIERS.find(t => t.tier === tier)
    return prizeTier?.label || ''
  }

  /**
   * Format prize amount
   */
  const formatPrize = (amount: number): string => {
    if (amount >= 1) {
      return `${amount.toFixed(2)} GAS`
    }
    return `${amount.toFixed(4)} GAS`
  }

  return {
    // State
    isLoading,
    error,
    currentTicket,
    playerTickets,
    lastRevealResult,
    playerAddress,

    // Computed
    unscratchedTickets,
    scratchedTickets,

    // Methods
    getPlayerAddress,
    buyTicket,
    revealTicket,
    loadPlayerTickets,
    getTicket,
    getPrizeTierLabel,
    formatPrize
  }
}
