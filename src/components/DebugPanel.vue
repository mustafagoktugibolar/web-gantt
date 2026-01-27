<template>
  <div class="debug-panel">
    <h4>Debug</h4>
    <div class="metric">
      <span>Visible rows</span>
      <span>{{ metrics.visibleRows }}</span>
    </div>
    <div class="metric">
      <span>Visible time</span>
      <span>{{ metrics.visibleTime }}</span>
    </div>
    <div class="metric">
      <span>Updates/sec</span>
      <span>{{ metrics.updatesPerSec }}</span>
    </div>
    <div class="metric">
      <span>Worker ms</span>
      <span>{{ metrics.computeMs }}</span>
    </div>
    <div class="metric">
      <span>Dropped frames</span>
      <span>{{ metrics.droppedFrames }}</span>
    </div>
    <div class="metric">
      <span>Stale responses</span>
      <span>{{ metrics.staleResponses }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  metrics: {
    visibleRows: string;
    visibleTime: string;
    updatesPerSec: number;
    computeMs: number;
    droppedFrames: number;
    staleResponses: number;
  };
}>();
</script>
