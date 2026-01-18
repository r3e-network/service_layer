<script setup lang="ts">
import { onMounted } from "vue";

onMounted(() => {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", "dark");
  }
});

</script>

<style lang="scss">
@use "@/shared/styles/variables.scss" as *;

page {
  background: #111;
  color: #fff;
  height: 100%;
}
</style>
