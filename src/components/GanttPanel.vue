<template>
  <div class="gantt" ref="container" @scroll="handleScroll">
    <div class="gantt__canvas" :style="{ width: timelineWidth + 'px', height: totalHeight + 'px' }">
      <div class="gantt__rows" :style="{ transform: `translateY(${offset}px)` }">
        <div
          v-for="(bar, index) in bars"
          :key="bar.id"
          class="gantt__row"
          :style="{ height: rowHeight + 'px' }"
        >
          <div
            v-if="bar.within"
            class="gantt__bar"
            :class="[bar.status, { selected: bar.id === selectedId }]"
            :style="{
              left: bar.left + 'px',
              width: bar.width + 'px'
            }"
            @click="emit('select', bar.id)"
            @mouseenter="emit('hover', bar.id)"
            @mouseleave="emit('hover', null)"
          >
            <span class="gantt__progress" :style="{ width: bar.progress + '%' }"></span>
          </div>
          <div v-else class="gantt__bar gantt__bar--ghost"></div>
          <div v-if="hoveredId === bar.id" class="gantt__tooltip">
            <strong>{{ rows[index]?.name }}</strong>
            <div>{{ formatDate(rows[index]?.start) }} → {{ formatDate(rows[index]?.end) }}</div>
            <div>Progress: {{ bar.progress }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  bars: { type: Array, required: true },
  rows: { type: Array, required: true },
  rowHeight: { type: Number, required: true },
  totalHeight: { type: Number, required: true },
  offset: { type: Number, required: true },
  rangeStart: { type: Number, required: true },
  rangeEnd: { type: Number, required: true },
  pxPerHour: { type: Number, required: true },
  selectedId: { type: String, default: null },
  hoveredId: { type: String, default: null },
  scrollTop: { type: Number, required: true }
});

const emit = defineEmits(['scroll', 'select', 'hover', 'resize', 'hscroll']);
const container = ref(null);

const timelineWidth = computed(() => {
  const hours = (props.rangeEnd - props.rangeStart) / (1000 * 60 * 60);
  return Math.max(hours * props.pxPerHour, 600);
});

const handleScroll = () => {
  emit('scroll', container.value.scrollTop);
  emit('hscroll', container.value.scrollLeft);
};

const formatDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString();
};

onMounted(() => {
  emit('resize', {
    height: container.value.clientHeight,
    width: container.value.clientWidth
  });
});

watch(
  () => props.scrollTop,
  (next) => {
    if (!container.value) return;
    if (Math.abs(container.value.scrollTop - next) > 1) {
      container.value.scrollTop = next;
    }
  }
);
</script>

<style scoped>
.gantt {
  position: relative;
  height: 100%;
  overflow: auto;
  background: #fafbff;
}

.gantt__canvas {
  position: relative;
}

.gantt__rows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.gantt__row {
  position: relative;
  border-bottom: 1px solid #eef1f7;
}

.gantt__bar {
  position: absolute;
  top: 6px;
  height: 22px;
  border-radius: 6px;
  background: #4c84ff;
  overflow: hidden;
  cursor: pointer;
}

.gantt__bar.selected {
  outline: 2px solid #1f6feb;
}

.gantt__bar.blocked {
  background: #f97316;
}

.gantt__bar.done {
  background: #16a34a;
}

.gantt__bar.planned {
  background: #60a5fa;
}

.gantt__bar--ghost {
  position: absolute;
  top: 6px;
  height: 22px;
  width: 12px;
  background: #e5e7eb;
  border-radius: 6px;
}

.gantt__progress {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.35);
}

.gantt__tooltip {
  position: absolute;
  top: -4px;
  left: 12px;
  transform: translateY(-100%);
  background: #111827;
  color: #fff;
  padding: 6px 8px;
  border-radius: 6px;
  font-size: 11px;
  width: 200px;
  z-index: 2;
}
</style>
