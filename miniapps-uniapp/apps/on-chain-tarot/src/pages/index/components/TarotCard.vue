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
@import "@/shared/styles/tokens.scss";
@import "@/shared/styles/variables.scss";

.tarot-card {
  width: 100px;
  height: 160px;
  background: linear-gradient(135deg, rgba(159, 157, 243, 0.1) 0%, rgba(123, 121, 209, 0.05) 100%);
  border: 1px solid rgba(159, 157, 243, 0.2);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transform-style: preserve-3d;

  &.flipped {
    background: linear-gradient(135deg, rgba(159, 157, 243, 0.2) 0%, rgba(123, 121, 209, 0.1) 100%);
    border-color: rgba(159, 157, 243, 0.5);
    box-shadow: 0 0 30px rgba(159, 157, 243, 0.3);
    transform: rotateY(0deg) scale(1.05); /* Assuming we implement true 3d flip later, for now just scale/glow */
  }

  &:not(.flipped):hover {
    transform: translateY(-5px);
    border-color: rgba(159, 157, 243, 0.4);
    box-shadow: 0 0 20px rgba(159, 157, 243, 0.2);
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
  color: white;
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
  opacity: 0.6;
}
.top-left { top: 4px; left: 4px; }
.top-right { top: 4px; right: 4px; }
.bottom-left { bottom: 4px; left: 4px; }
.bottom-right { bottom: 4px; right: 4px; }
</style>
