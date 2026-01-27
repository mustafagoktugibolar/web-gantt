<template>
  <div class="panel">
    <div class="panel-header">Tasks</div>
    <div ref="scrollRef" class="scroll-area" @scroll="onScroll">
      <div :style="{ height: `${totalCount * rowHeight}px`, position: 'relative' }">
        <div :style="{ transform: `translateY(${visibleOffset}px)` }">
          <div
            v-for="task in tasks"
            :key="task.id"
            :class="['grid-row', { selected: task.id === selectedId }]"
            :style="{ height: `${rowHeight}px` }"
            @click="$emit('select', task.id)"
          >
            <strong>{{ task.name }}</strong>
            <span>{{ task.status }}</span>
            <span>{{ Math.round(task.progress ?? 0) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import type { Task } from '../services/mockApi';

const props = defineProps<{
  tasks: Task[];
  rowHeight: number;
  totalCount: number;
  scrollTop: number;
  visibleOffset: number;
  selectedId: string;
}>();

const emit = defineEmits<{
  (event: 'scroll', value: number): void;
  (event: 'select', value: string): void;
  (event: 'viewport', value: number): void;
}>();

const scrollRef = ref<HTMLDivElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const onScroll = () => {
  if (scrollRef.value) {
    emit('scroll', scrollRef.value.scrollTop);
  }
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
  if (scrollRef.value) {
    emit('scroll', scrollRef.value.scrollTop);
    emit('viewport', scrollRef.value.clientHeight);
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        emit('viewport', entry.contentRect.height);
      }
    });
    resizeObserver.observe(scrollRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>
