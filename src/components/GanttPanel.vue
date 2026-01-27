<template>
  <div class="panel">
    <div class="panel-header">Gantt Timeline</div>
    <div ref="scrollRef" class="scroll-area" @scroll="onScroll">
      <div
        :style="{
          position: 'relative',
          height: `${totalCount * rowHeight}px`,
          width: `${timelineWidth}px`
        }"
      >
        <div class="timeline-background"></div>
        <div :style="{ transform: `translateY(${visibleOffset}px)` }">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="gantt-row"
            :style="{ height: `${rowHeight}px`, top: `${taskOffsets.get(task.id) ?? 0}px` }"
          ></div>
          <div
            v-for="bar in bars"
            :key="bar.id"
            :class="['gantt-bar', { selected: bar.id === selectedId }]"
            :style="{
              transform: `translate(${bar.x}px, ${taskOffsets.get(bar.id) ?? 0}px)`,
              width: `${bar.width}px`
            }"
            @click="$emit('select', bar.id)"
            @mouseenter="onHover(bar.id, $event)"
            @mouseleave="onHover(null, $event)"
          ></div>
        </div>
        <div v-if="tooltip" class="tooltip" :style="tooltip.style">
          <div><strong>{{ tooltip.name }}</strong></div>
          <div>{{ tooltip.range }}</div>
          <div>{{ tooltip.progress }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Task } from '../services/mockApi';
import type { Bar } from '../services/ganttEngine';

const props = defineProps<{
  tasks: Task[];
  bars: Bar[];
  rowHeight: number;
  timelineRange: { start: number; end: number };
  zoomLevel: number;
  scrollTop: number;
  visibleOffset: number;
  totalCount: number;
  selectedId: string;
}>();

const emit = defineEmits<{
  (event: 'scroll', value: number): void;
  (event: 'select', value: string): void;
  (event: 'hover', value: string | null): void;
  (event: 'horizontal', value: { scrollLeft: number; width: number }): void;
  (event: 'viewport', value: number): void;
}>();

const scrollRef = ref<HTMLDivElement | null>(null);
const tooltip = ref<null | { name: string; range: string; progress: string; style: Record<string, string> }>(null);
let resizeObserver: ResizeObserver | null = null;

const timelineWidth = computed(() => {
  const hours = (props.timelineRange.end - props.timelineRange.start) / (60 * 60 * 1000);
  return Math.max(hours * props.zoomLevel, 800);
});

const taskOffsets = computed(() => {
  const offsets = new Map<string, number>();
  props.tasks.forEach((task, index) => {
    offsets.set(task.id, index * props.rowHeight);
  });
  return offsets;
});

const onScroll = () => {
  if (!scrollRef.value) return;
  emit('scroll', scrollRef.value.scrollTop);
  emit('horizontal', { scrollLeft: scrollRef.value.scrollLeft, width: scrollRef.value.clientWidth });
  emit('hover', null);
  tooltip.value = null;
};

const onHover = (id: string | null, event: MouseEvent) => {
  emit('hover', id);
  if (!id) {
    tooltip.value = null;
    return;
  }
  const task = props.tasks.find((item) => item.id === id);
  if (!task) return;
  tooltip.value = {
    name: task.name,
    range: `${new Date(task.start).toLocaleString()} → ${new Date(task.end).toLocaleString()}`,
    progress: `Progress: ${Math.round(task.progress ?? 0)}%`,
    style: {
      left: `${event.offsetX}px`,
      top: `${event.offsetY}px`
    }
  };
};

watch(
  () => props.scrollTop,
  (value) => {
    if (scrollRef.value && Math.abs(scrollRef.value.scrollTop - value) > 1) {
      scrollRef.value.scrollTop = value;
    }
  }
);

onMounted(() => {
  if (!scrollRef.value) return;
  emit('scroll', scrollRef.value.scrollTop);
  emit('horizontal', { scrollLeft: scrollRef.value.scrollLeft, width: scrollRef.value.clientWidth });
  emit('viewport', scrollRef.value.clientHeight);
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry?.contentRect) {
      emit('viewport', entry.contentRect.height);
    }
  });
  resizeObserver.observe(scrollRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>
