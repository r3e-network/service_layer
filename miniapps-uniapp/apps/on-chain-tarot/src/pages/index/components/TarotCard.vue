<template>
  <view
    :class="['tarot-card', { flipped: card.flipped, 'card-glow': card.flipped }]"
    @click="$emit('flip')"
  >
    <view class="card-inner">
      <!-- Card Front (Revealed) -->
      <view v-if="card.flipped" class="card-front">
        <view class="card-border-decoration">
          <text class="corner-star top-left">✦</text>
          <text class="corner-star top-right">✦</text>
          <text class="corner-star bottom-left">✦</text>
          <text class="corner-star bottom-right">✦</text>
        </view>
        <text class="card-face">{{ card.icon }}</text>
        <text class="card-name">{{ card.name }}</text>
      </view>

      <!-- Card Back (Hidden) -->
      <view v-else class="card-back">
        <view class="card-back-pattern">
          <text class="pattern-moon">🌙</text>
          <text class="pattern-stars">✨</text>
          <text class="pattern-center">🔮</text>
          <text class="pattern-stars">✨</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
export interface Card {
  id: number;
  name: string;
  icon: string;
  flipped: boolean;
}

defineProps<{
  card: Card;
}>();

defineEmits(["flip"]);
</script>

<style lang="scss" scoped>
@use "@/shared/styles/tokens.scss" as *;
@use "@/shared/styles/variables.scss";

.tarot-card {
  width: 100px;
  height: 160px;
  background: linear-gradient(135deg, rgba(82, 0, 255, 0.15) 0%, rgba(121, 40, 202, 0.1) 100%);
  border: 1px solid rgba(138, 43, 226, 0.3);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 10px rgba(138, 43, 226, 0.1);
  overflow: hidden;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transform-style: preserve-3d;

  &.flipped {
    background: linear-gradient(135deg, rgba(82, 0, 255, 0.25) 0%, rgba(121, 40, 202, 0.2) 100%);
    border-color: rgba(138, 43, 226, 0.6);
    box-shadow: 0 0 30px rgba(138, 43, 226, 0.4), inset 0 0 20px rgba(138, 43, 226, 0.1);
    transform: rotateY(0deg) scale(1.05); /* Assuming we implement true 3d flip later, for now just scale/glow */
  }

  &:not(.flipped):hover {
    transform: translateY(-5px);
    border-color: rgba(138, 43, 226, 0.5);
    box-shadow: 0 0 20px rgba(138, 43, 226, 0.3);
  }
}

.card-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
}

.card-back-pattern {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
  filter: grayscale(100%);
}
.pattern-center { font-size: 44px; }
.pattern-moon { font-size: 24px; }
.pattern-stars { font-size: 16px; }

.card-face {
  font-size: 60px;
  display: block;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
}

.card-name {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
  color: var(--text-primary);
  padding: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  margin-top: 8px;
  font-style: normal;
  letter-spacing: 0.05em;
}

.card-border-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.corner-star {
  position: absolute;
  font-size: 8px;
  color: #00E599;
  opacity: 0.8;
  filter: drop-shadow(0 0 2px #00E599);
}
.top-left { top: 6px; left: 6px; }
.top-right { top: 6px; right: 6px; }
.bottom-left { bottom: 6px; left: 6px; }
.bottom-right { bottom: 6px; right: 6px; }
</style>
