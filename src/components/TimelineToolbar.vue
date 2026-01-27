<template>
  <div class="toolbar">
    <div class="range">
      <label>Start</label>
      <input type="datetime-local" :value="startValue" @input="onStartChange" />
    </div>
    <div class="range">
      <label>End</label>
      <input type="datetime-local" :value="endValue" @input="onEndChange" />
    </div>
    <div class="range">
      <label>Zoom</label>
      <select :value="zoomLevel" @change="onZoomChange">
        <option v-for="zoom in zoomOptions" :key="zoom" :value="zoom">
          {{ zoom }} px/hr
        </option>
      </select>
    </div>
    <button @click="$emit('toggle-debug')">Toggle Debug</button>
    <span v-if="isLoading">Loading…</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  range: { start: number; end: number };
  zoomLevel: number;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  (event: 'update-range', value: { start: number; end: number }): void;
  (event: 'update-zoom', value: number): void;
  (event: 'toggle-debug'): void;
}>();

const zoomOptions = [24, 36, 48, 64, 80, 96];
const pendingRange = ref({ ...props.range });
let debounceHandle: number | null = null;

const toInputValue = (value: number) => {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const startValue = computed(() => toInputValue(props.range.start));
const endValue = computed(() => toInputValue(props.range.end));

const emitRange = () => {
  if (debounceHandle) {
    window.clearTimeout(debounceHandle);
  }
  debounceHandle = window.setTimeout(() => {
    emit('update-range', pendingRange.value);
  }, 250);
};

const onStartChange = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  pendingRange.value = {
    ...pendingRange.value,
    start: new Date(value).getTime()
  };
  emitRange();
};

const onEndChange = (event: Event) => {
  const value = (event.target as HTMLInputElement).value;
  pendingRange.value = {
    ...pendingRange.value,
    end: new Date(value).getTime()
  };
  emitRange();
};

const onZoomChange = (event: Event) => {
  emit('update-zoom', Number((event.target as HTMLSelectElement).value));
};
</script>
