<template>
  <div class="debug" v-if="open">
    <div class="debug__row">Visible rows: {{ visible.startIndex }} - {{ visible.endIndex }}</div>
    <div class="debug__row">Time range: {{ rangeLabel }}</div>
    <div class="debug__row">Updates/sec: {{ updatesPerSec }}</div>
    <div class="debug__row">Worker ms: {{ workerMs }}</div>
    <div class="debug__row">Stale fetches: {{ staleFetches }}</div>
  </div>
  <button class="debug__toggle" @click="open = !open">
    {{ open ? 'Hide' : 'Show' }} Debug
  </button>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  visible: { type: Object, required: true },
  rangeStart: { type: Number, required: true },
  rangeEnd: { type: Number, required: true },
  updatesPerSec: { type: Number, required: true },
  workerMs: { type: Number, required: true },
  staleFetches: { type: Number, required: true }
});

const open = ref(true);

const rangeLabel = computed(() => {
  const start = new Date(props.rangeStart).toLocaleString();
  const end = new Date(props.rangeEnd).toLocaleString();
  return `${start} → ${end}`;
});
</script>

<style scoped>
.debug {
  position: fixed;
  right: 16px;
  bottom: 16px;
  background: rgba(17, 24, 39, 0.9);
  color: #fff;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
}

.debug__toggle {
  position: fixed;
  right: 16px;
  bottom: 16px;
  margin-top: 8px;
  background: #111827;
}
</style>
