<template>
  <div class="app">
    <TimelineToolbar
      :start="timeline.start"
      :end="timeline.end"
      :px-per-hour="timeline.pxPerHour"
      @update="updateTimeline"
    />
    <div class="app__body">
      <div class="app__panel" :style="{ width: leftWidth + '%' }">
        <GridPanel
          :rows="visibleTasks"
          :row-height="rowHeight"
          :total-height="totalHeight"
          :offset="gridOffset"
          :scroll-top="scrollTop"
          :selected-id="selectedId"
          @scroll="onScroll"
          @select="selectTask"
          @hover="hoverTask"
          @resize="setViewportHeight"
        />
      </div>
      <div
        class="app__splitter"
        @mousedown="startResize"
      ></div>
      <div class="app__panel" :style="{ width: 100 - leftWidth + '%' }">
        <GanttPanel
          :rows="visibleTasks"
          :bars="bars"
          :row-height="rowHeight"
          :total-height="totalHeight"
          :offset="gridOffset"
          :scroll-top="scrollTop"
          :range-start="timeline.start"
          :range-end="timeline.end"
          :px-per-hour="timeline.pxPerHour"
          :selected-id="selectedId"
          :hovered-id="hoveredId"
          @scroll="onScroll"
          @hscroll="onHorizontalScroll"
          @select="selectTask"
          @hover="hoverTask"
          @resize="setGanttViewport"
        />
      </div>
    </div>
    <div class="app__status">
      <span v-if="loading">Loading…</span>
      <span>Visible time: {{ formatRange(visibleTimeRange) }}</span>
    </div>
    <DebugPanel
      :visible="visibleRange"
      :range-start="visibleTimeRange.start"
      :range-end="visibleTimeRange.end"
      :updates-per-sec="updatesPerSec"
      :worker-ms="workerMs"
      :stale-fetches="staleFetches"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import TimelineToolbar from './components/TimelineToolbar.vue';
import GridPanel from './components/GridPanel.vue';
import GanttPanel from './components/GanttPanel.vue';
import DebugPanel from './components/DebugPanel.vue';
import { useTaskStore } from './store/useTaskStore';

const {
  timeline,
  visibleTasks,
  bars,
  visibleRange,
  visibleTimeRange,
  loading,
  scrollTop,
  updatesPerSec,
  workerMs,
  staleFetches,
  rowHeight,
  gridOffset,
  totalHeight,
  selectedId,
  hoveredId,
  init,
  updateTimeline,
  onScroll,
  onHorizontalScroll,
  setViewportHeight,
  setViewportWidth,
  selectTask,
  hoverTask
} = useTaskStore();

const leftWidth = ref(35);
let resizing = false;

const startResize = () => {
  resizing = true;
};

const handleResize = (event) => {
  if (!resizing) return;
  const next = (event.clientX / window.innerWidth) * 100;
  leftWidth.value = Math.min(Math.max(next, 20), 60);
};

const stopResize = () => {
  resizing = false;
};

const formatRange = (range) => {
  const start = new Date(range.start).toLocaleTimeString();
  const end = new Date(range.end).toLocaleTimeString();
  return `${start} → ${end}`;
};

const setGanttViewport = ({ height, width }) => {
  setViewportHeight(height);
  setViewportWidth(width);
};

onMounted(async () => {
  window.addEventListener('mousemove', handleResize);
  window.addEventListener('mouseup', stopResize);
  setViewportWidth(window.innerWidth);
  window.addEventListener('resize', () => setViewportWidth(window.innerWidth));
  await init();
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleResize);
  window.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f6f7fb;
}

.app__body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.app__panel {
  height: 100%;
  min-width: 0;
}

.app__splitter {
  width: 6px;
  cursor: col-resize;
  background: #e5e7eb;
}

.app__status {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 12px;
  color: #4b5563;
}
</style>
