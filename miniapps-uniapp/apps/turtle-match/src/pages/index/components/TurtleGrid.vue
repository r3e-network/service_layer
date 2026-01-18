<template>
  <view class="turtle-grid">
    <view 
      v-for="(turtle, index) in gridTurtles" 
      :key="index"
      :class="['turtle-grid__cell', { 
        'turtle-grid__cell--empty': !turtle,
        'turtle-grid__cell--matched': matchedIds.includes(turtle?.id)
      }]"
    >
      <TurtleSprite 
        v-if="turtle"
        :color="turtle.color"
        :matched="matchedIds.includes(turtle.id)"
      />
      <view v-else class="turtle-grid__placeholder" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Turtle } from "@/shared/composables/useTurtleMatch";
import TurtleSprite from "./TurtleSprite.vue";

const props = defineProps<{
  gridTurtles: (Turtle | null)[];
  matchedPair?: number[];  // Grid position indices of matched turtles
}>();

const matchedIds = computed(() => {
  if (!props.matchedPair || props.matchedPair.length === 0) return [];
  // Get turtle IDs from grid positions
  return props.matchedPair
    .map(pos => props.gridTurtles[pos]?.id)
    .filter((id): id is number => id !== undefined);
});
</script>

<style lang="scss" scoped>
.turtle-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 20px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.turtle-grid__cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.turtle-grid__cell--empty {
  border: 2px dashed rgba(16, 185, 129, 0.3);
}

.turtle-grid__cell--matched {
  animation: cell-glow 0.5s ease-in-out;
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
}

.turtle-grid__placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.03);
}

@keyframes cell-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(245, 158, 11, 0.3); }
  50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.8); }
}
</style>
