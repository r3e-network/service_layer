<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";

onLaunch(() => {
  console.log("Neo Chat MiniApp launched");
});

onShow(() => {
  console.log("Neo Chat MiniApp shown");
});

onHide(() => {
  console.log("Neo Chat MiniApp hidden");
});
</script>

<style>
page {
  background-color: #0f0f1a;
  min-height: 100vh;
}
</style>
