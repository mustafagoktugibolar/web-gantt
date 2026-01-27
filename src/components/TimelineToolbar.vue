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
</template>

<script setup>
import { ref, watch } from 'vue';
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
</style>
