<template>
  <div class="toolbar">
    <div class="toolbar__group">
      <label>
        Start
        <input type="datetime-local" v-model="localStart" />
      </label>
      <label>
        End
        <input type="datetime-local" v-model="localEnd" />
      </label>
      <label>
        Zoom
        <select v-model.number="localZoom">
          <option :value="20">20 px/hr</option>
          <option :value="30">30 px/hr</option>
          <option :value="40">40 px/hr</option>
          <option :value="60">60 px/hr</option>
          <option :value="80">80 px/hr</option>
        </select>
      </label>
    </div>
    <div class="toolbar__group">
      <button @click="setPreset(24)">24h</button>
      <button @click="setPreset(72)">3d</button>
      <button @click="setPreset(168)">7d</button>
    </div>
  </div>
  <div class="ruler" @wheel.prevent="onWheel">
    <div
      v-for="tick in ticks"
      :key="tick.label"
      class="ruler__tick"
      :style="{ left: tick.left + '%' }"
    >
      <span>{{ tick.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { formatDateInput, parseDateInput } from '../utils/time';

const props = defineProps({
  start: { type: Number, required: true },
  end: { type: Number, required: true },
  pxPerHour: { type: Number, required: true }
});

const emit = defineEmits(['update']);

const localStart = ref(formatDateInput(props.start));
const localEnd = ref(formatDateInput(props.end));
const localZoom = ref(props.pxPerHour);

let debounceId;

const pushUpdate = () => {
  const start = parseDateInput(localStart.value) ?? props.start;
  const end = parseDateInput(localEnd.value) ?? props.end;
  emit('update', { start, end, pxPerHour: localZoom.value });
};

const debounceUpdate = () => {
  clearTimeout(debounceId);
  debounceId = setTimeout(pushUpdate, 300);
};

watch([localStart, localEnd, localZoom], debounceUpdate);

watch(
  () => [props.start, props.end, props.pxPerHour],
  ([nextStart, nextEnd, nextZoom]) => {
    localStart.value = formatDateInput(nextStart);
    localEnd.value = formatDateInput(nextEnd);
    localZoom.value = nextZoom;
  }
);

const setPreset = (hours) => {
  const start = props.start;
  const end = start + hours * 60 * 60 * 1000;
  localEnd.value = formatDateInput(end);
  debounceUpdate();
};

const clampZoom = (value) => Math.min(Math.max(value, 10), 120);

const onWheel = (event) => {
  const direction = event.deltaY > 0 ? -1 : 1;
  const step = direction * 5;
  localZoom.value = clampZoom(localZoom.value + step);
  debounceUpdate();
};

const ticks = computed(() => {
  const count = 6;
  const rangeMs = props.end - props.start;
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    const time = props.start + rangeMs * ratio;
    return {
      left: ratio * 100,
      label: new Date(time).toLocaleDateString()
    };
  });
});
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.toolbar__group {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 600;
}

.ruler {
  position: relative;
  height: 32px;
  background: repeating-linear-gradient(
    to right,
    #e5e7eb,
    #e5e7eb 1px,
    transparent 1px,
    transparent 40px
  );
  border-bottom: 1px solid #e5e7eb;
  background-color: #fff;
}

.ruler__tick {
  position: absolute;
  top: 4px;
  transform: translateX(-50%);
  font-size: 10px;
  color: #6b7280;
  white-space: nowrap;
}

.ruler__tick::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  width: 1px;
  height: 10px;
  background: #9ca3af;
}
</style>
