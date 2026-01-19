<template>
  <view class="scratch-canvas-wrapper">
    <canvas
      canvas-id="scratchCanvas"
      class="scratch-canvas"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    />
    <view class="prize-layer" :class="{ revealed: isRevealed }">
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  enabled: boolean
  revealThreshold?: number
}>()

const emit = defineEmits<{
  reveal: []
  progress: [percent: number]
}>()

const isRevealed = ref(false)
const scratchProgress = ref(0)
const threshold = props.revealThreshold || 50

let ctx: any = null

const getScratchCoating = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return '#c0c0c0'
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--lucky-scratch-coating')
    .trim()
  return value || '#c0c0c0'
}

const initCanvas = () => {
  ctx = uni.createCanvasContext('scratchCanvas')
  ctx.setFillStyle(getScratchCoating())
  ctx.fillRect(0, 0, 300, 200)
  ctx.draw()
}

const onTouchStart = () => {
  if (!props.enabled || isRevealed.value) return
}

const onTouchMove = (e: any) => {
  if (!ctx || !props.enabled || isRevealed.value) return

  const touch = e.touches[0]
  ctx.globalCompositeOperation = 'destination-out'
  ctx.beginPath()
  ctx.arc(touch.x, touch.y, 20, 0, Math.PI * 2)
  ctx.fill()
  ctx.draw(true)

  scratchProgress.value += 1
  emit('progress', Math.min(scratchProgress.value / threshold * 100, 100))

  if (scratchProgress.value >= threshold) {
    isRevealed.value = true
    emit('reveal')
  }
}

const onTouchEnd = () => {}

const reset = () => {
  isRevealed.value = false
  scratchProgress.value = 0
  initCanvas()
}

watch(() => props.enabled, (val) => {
  if (val) initCanvas()
})

onMounted(() => {
  if (props.enabled) initCanvas()
})

defineExpose({ reset, isRevealed })
</script>

<style lang="scss" scoped>
.scratch-canvas-wrapper {
  position: relative;
  width: 600rpx;
  height: 400rpx;
  border: 4rpx solid var(--lucky-gold);
  border-radius: 16rpx;
  overflow: hidden;
}

.scratch-canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 2;
}

.prize-layer {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--lucky-red), var(--lucky-crimson));
}
</style>
