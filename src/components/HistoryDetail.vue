<template>
  <li class="expanded-history" :class="{ 'dark-mode': isDarkMode }" >
    <div class="start-icon"></div>
    <div class="grid">
      <div class="text-detail">
        {{ formatDateTime(HistoryDetail?.initDateTime) }}
      </div>
      <div class="text-detail">
        {{ HistoryDetail?.initial?.address?.road }} -
        {{ HistoryDetail?.initial?.address?.town ? HistoryDetail?.initial?.address?.town: "" }} -
        {{ HistoryDetail?.initial?.address?.state }} -
        {{ HistoryDetail?.initial?.address?.country }}
      </div>
    </div>
    <div class="end-icon"></div>
    <div class="grid">
      <div class="text-detail">
        {{ formatDateTime(HistoryDetail?.endDateTime) }}
      </div>
      <div class="text-detail">
        {{ HistoryDetail?.finality?.address?.road }} -
        {{ HistoryDetail?.finality?.address?.town ? HistoryDetail?.initial?.address?.town : ""}} -
        {{ HistoryDetail?.finality?.address?.state }} -
        {{ HistoryDetail?.finality?.address?.country }}
      </div>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { HistoryContent } from './Types';
import { darkModeClick } from '@/components/stores/StoreDarkModeGetClick.js';
import { getClick } from '@/components/stores/StoreGetClick.js';
import { computed } from 'vue';

const store = darkModeClick();
const storeFilters = getClick();

const props = defineProps<{
  HistoryDetail: HistoryContent;
}>();

const isDarkMode = computed(() => store.onClickDarkMode && storeFilters.onClickFilters);

function formatDateTime(dateString: string): string {
  if (!dateString) return 'Data e horário indisponíveis';

  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900&display=swap');

.start-icon {
  width: 30px;
  height: 30px;
  background-image: url('@/assets/IconStartPin.png');
  background-size: 75%;
  background-repeat: no-repeat;
  background-position: center;
}

.end-icon {
  width: 30px;
  height: 30px;
  background-image: url('@/assets/IconEndPin.png');
  background-size: 75%;
  background-repeat: no-repeat;
  background-position: center;
}

.history-container {
  border-radius: 8px;
  box-sizing: border-box;
  background: #3D3D3D;
  display: grid;
  grid-template-rows: repeat(auto, 100%);
  height: 100%;
  padding: 0;
  align-items: center;
  justify-items: center;
  row-gap: 2%;
}

.text-detail {
  align-content: center;
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  color: #000;
  font-size: 12px;
  font-family: 'Poppins', regular, sans-serif;
  resize: none;
  box-sizing: border-box;
  cursor: default;
}

.dark-mode .text-detail {
  color: #FFF;
}

.grid {
  display: grid;
  grid-template-rows: 30% 70%;
  padding: 5px;
  width: 100%;
  height: auto;
  cursor: default;
  justify-items: center;
  background-color:transparent;
  align-items: center;
}

.expanded-history{
  display: grid;
  grid-template-columns: 10% 90%;
  align-items: center;
  justify-items: center;
  border-radius: 10px;
  border:2px solid #DADADA;
  background: #c0c0c0;

}

.dark-mode .expanded-history {
  border:2px solid #2d2d2d;
  background: #3d3d3d;
}
</style>
