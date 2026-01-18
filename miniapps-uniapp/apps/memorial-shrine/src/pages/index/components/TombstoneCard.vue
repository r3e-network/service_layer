<template>
  <view class="tombstone-card" @click="$emit('click')">
    <view class="tombstone-top">
      <view class="photo-frame" v-if="memorial.photoHash">
        <image :src="memorial.photoHash" mode="aspectFill" />
      </view>
      <view class="icon-frame" v-else>
        <text class="candle-icon" :class="{ burning: memorial.hasRecentTribute }">🕯️</text>
      </view>
    </view>
    <view class="tombstone-body">
      <text class="name">{{ memorial.name }}</text>
      <text class="years">{{ memorial.birthYear }} - {{ memorial.deathYear }}</text>
      <text class="candle" :class="{ burning: memorial.hasRecentTribute }">🕯️</text>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Memorial {
  id: number;
  name: string;
  photoHash: string;
  birthYear: number;
  deathYear: number;
  hasRecentTribute: boolean;
}

defineProps<{
  memorial: Memorial;
}>();

defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
$gold: #c9a962;
$gold-light: #e6d4a8;
$muted: #6b6965;
$incense: #ff9844;

.tombstone-card {
  width: 140px;
  cursor: pointer;
  transition: transform 0.3s;
  
  &:active {
    transform: translateY(-4px);
  }
}

.tombstone-top {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.photo-frame {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid $gold;
  overflow: hidden;
  
  image {
    width: 100%;
    height: 100%;
  }
}

.icon-frame {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba($gold, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle, rgba($gold, 0.1), transparent);
}

.candle-icon {
  font-size: 24px;
  opacity: 0.6;
  
  &.burning {
    animation: glow 2s ease-in-out infinite;
  }
}

.tombstone-body {
  background: linear-gradient(180deg, #3a3d45, #2a2d35, #1a1d25);
  border-radius: 40px 40px 4px 4px;
  padding: 16px 12px 20px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: $gold-light;
  margin-bottom: 4px;
}

.years {
  display: block;
  font-size: 11px;
  color: $muted;
  margin-bottom: 8px;
}

.candle {
  font-size: 20px;
  opacity: 0.6;
  
  &.burning {
    animation: glow 2s ease-in-out infinite;
  }
}

@keyframes glow {
  0%, 100% {
    filter: drop-shadow(0 0 4px $incense);
    opacity: 0.8;
  }
  50% {
    filter: drop-shadow(0 0 12px $incense);
    opacity: 1;
  }
}
</style>
