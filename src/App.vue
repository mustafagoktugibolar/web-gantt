<template>
  <div class="app">
    <TimelineToolbar
      :range="state.timelineRange"
      :zoom-level="state.zoomLevel"
      :is-loading="state.isLoading"
      @update-range="handleRangeUpdate"
      @update-zoom="handleZoomUpdate"
      @toggle-debug="state.showDebug = !state.showDebug"
    />
    <div class="content">
      <GridPanel
        :tasks="state.visibleTasks"
        :row-height="rowHeight"
        :total-count="state.totalCount"
        :scroll-top="state.scrollTop"
        :visible-offset="state.visibleOffset"
        :selected-id="state.selectedId"
        @scroll="handleVerticalScroll"
        @select="handleSelect"
        @viewport="handleViewport"
      />
      <GanttPanel
        :tasks="state.visibleTasks"
        :bars="bars"
        :row-height="rowHeight"
        :timeline-range="state.timelineRange"
        :zoom-level="state.zoomLevel"
        :scroll-top="state.scrollTop"
        :visible-offset="state.visibleOffset"
        :total-count="state.totalCount"
        :selected-id="state.selectedId"
        @scroll="handleVerticalScroll"
        @select="handleSelect"
        @hover="handleHover"
        @horizontal="handleHorizontal"
        @viewport="handleViewport"
      />
    </div>
    <DebugPanel v-if="state.showDebug" :metrics="state.metrics" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import TimelineToolbar from './components/TimelineToolbar.vue';
import GridPanel from './components/GridPanel.vue';
import GanttPanel from './components/GanttPanel.vue';
import DebugPanel from './components/DebugPanel.vue';
import { useTaskStore } from './composables/useTaskStore';

const rowHeight = 36;
const {
  state,
  bars,
  initialize,
  updateTimelineRange,
  updateZoomLevel,
  updateScrollTop,
  updateViewportHeight,
  updateHorizontalScroll,
  selectTask,
  setHoverTask,
  dispose
} = useTaskStore({ rowHeight });

const handleVerticalScroll = (value: number) => {
  updateScrollTop(value);
};

const handleSelect = (taskId: string) => {
  selectTask(taskId);
};

const handleHover = (taskId: string | null) => {
  setHoverTask(taskId);
};

const handleViewport = (height: number) => {
  updateViewportHeight(height);
};

const handleHorizontal = (payload: { scrollLeft: number; width: number }) => {
  updateHorizontalScroll(payload.scrollLeft, payload.width);
};

const handleRangeUpdate = (range: { start: number; end: number }) => {
  updateTimelineRange(range);
};

const handleZoomUpdate = (zoom: number) => {
  updateZoomLevel(zoom);
};

onMounted(() => {
  initialize();
});

onBeforeUnmount(() => {
  dispose();
});
</script>
