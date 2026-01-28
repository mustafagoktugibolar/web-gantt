<template>
  <div class="grid" ref="container" @scroll="handleScroll">
    <div class="grid__spacer" :style="{ height: totalHeight + 'px' }">
      <div class="grid__rows" :style="{ transform: `translateY(${offset}px)` }">
        <div
          v-for="task in rows"
          :key="task.id"
          class="grid__row"
          :class="{ selected: task.id === selectedId }"
          :style="{ height: rowHeight + 'px' }"
          @click="emit('select', task.id)"
          @mouseenter="emit('hover', task.id)"
          @mouseleave="emit('hover', null)"
        >
          <div class="grid__title">{{ task.name }}</div>
          <div class="grid__meta">{{ task.status }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  rows: { type: Array, required: true },
  rowHeight: { type: Number, required: true },
  totalHeight: { type: Number, required: true },
  offset: { type: Number, required: true },
  selectedId: { type: String, default: null },
  scrollTop: { type: Number, required: true }
});

const emit = defineEmits(['scroll', 'select', 'hover', 'resize']);
const container = ref(null);
let resizeObserver;

const handleScroll = () => {
  emit('scroll', container.value.scrollTop);
};

onMounted(() => {
  emit('resize', container.value.clientHeight);
  resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    emit('resize', entry.contentRect.height);
  });
  resizeObserver.observe(container.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
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
.grid {
  height: 100%;
  overflow: auto;
  background: #fff;
  border-right: 1px solid #e5e7eb;
}

.grid__spacer {
  position: relative;
}

.grid__rows {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.grid__row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4px 12px;
  border-bottom: 1px solid #f0f1f5;
  cursor: pointer;
}

.grid__row.selected {
  background: #eaf2ff;
}

.grid__title {
  font-weight: 600;
  font-size: 13px;
}

.grid__meta {
  font-size: 11px;
  color: #6b7280;
}
</style>
