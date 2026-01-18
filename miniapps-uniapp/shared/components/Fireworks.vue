<template>
  <view class="fireworks-container" :style="{ pointerEvents: 'none' }">
    <canvas 
      v-if="active"
      ref="canvasRef" 
      class="fireworks-canvas"
      :style="{ width: width + 'px', height: height + 'px' }"
    ></canvas>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  active: boolean;
  duration?: number;
}>();

// Declare uni global for TypeScript
declare const uni: any;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const width = ref(300);
const height = ref(600);
let ctx: CanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let particles: Particle[] = [];

// Particle Class
class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  decay: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.alpha = 1;
    this.color = color;
    this.decay = Math.random() * 0.015 + 0.015;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05; // gravity
    this.alpha -= this.decay;
  }

  draw(context: CanvasRenderingContext2D) {
    context.save();
    context.globalAlpha = this.alpha;
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, 2, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

const colors = ['#FF4D4D', '#FFDE59', '#00E599', '#A855F7', '#FFFFFF'];

const createExplosion = (x: number, y: number) => {
  const count = 30 + Math.random() * 20;
  const color = colors[Math.floor(Math.random() * colors.length)];
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
};

const loop = () => {
  if (!ctx || !width.value) return;
  
  // Clear with trails
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, width.value, height.value);
  ctx.globalCompositeOperation = 'lighter';

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw(ctx);
    if (p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  // Random explosions
  if (Math.random() < 0.05) {
    createExplosion(
      Math.random() * width.value,
      Math.random() * height.value * 0.6 + height.value * 0.1
    );
  }

  animationId = requestAnimationFrame(loop);
};

const start = () => {
  if (!canvasRef.value) return;
  const sysInfo = uni.getSystemInfoSync();
  width.value = sysInfo.windowWidth;
  height.value = sysInfo.windowHeight;
  
  // Need to wait for canvas render in Vue/UniApp
  setTimeout(() => {
    if (!canvasRef.value) return;
    ctx = canvasRef.value.getContext('2d');
    if (ctx) {
      particles = [];
      loop();
      
      // Initial burst
      createExplosion(width.value * 0.5, height.value * 0.3);
      
      if (props.duration) {
        setTimeout(() => {
          stop();
        }, props.duration);
      }
    }
  }, 100);
};

const stop = () => {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  ctx = null;
  particles = [];
};

watch(() => props.active, (val) => {
  if (val) start();
  else stop();
});

onMounted(() => {
  if (props.active) start();
});

onUnmounted(() => {
  stop();
});
</script>

<style scoped>
.fireworks-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
}
.fireworks-canvas {
  width: 100%;
  height: 100%;
}
</style>
