<template>
  <div class="history-wrapper" :class="{ 'dark-mode': isDarkMode }">
    <div class="history-title">Histórico:</div>
    <div class="history-container">
      <contenthistory class="history-entry">
        <div class="start-icon"></div>
        <div class="grid">
          <div class="text-detail">
            {{ formatDateTime(props.historyConfiguration[0]?.initDateTime) }}
          </div>
          <div class="text-detail">
            {{ formatAddress(props.historyConfiguration[0]?.initial?.address) }}
          </div>
        </div>
      </contenthistory>
      <div class = "recoil">
        <button class="expand-history" @click="toggleHistory">
          Linha do tempo
        </button>
      </div>
    </div>
    <Loading v-if="props.loading"/>
    <ul class="history-container" @scroll="handleScroll" ref="scrollContainer">
      <HistoryDetail v-for="config in props.historyConfiguration"
                     v-if="!props.loading && showHistory " :key="props.historyConfiguration.length"
                     :HistoryDetail="config">
      </HistoryDetail>
      <span style="display: flex; justify-content: center;" v-if="props.historyConfiguration.length == 0 && !props.loading && showHistory">
        <p>Histórico Vazio</p>
      </span>
    </ul>

    <div class="history-container">
      <contenthistory class="history-entry">
        <div class="end-icon"></div>
        <div class="grid">
          <div class="text-detail">
            {{ formatDateTime(props.historyConfiguration[historyConfiguration.length - 1]?.endDateTime) }}
          </div>
          <div class="text-detail">
            {{ formatAddress(props.historyConfiguration[historyConfiguration.length - 1]?.finality?.address) }}
          </div>
        </div>
      </contenthistory>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, defineEmits, onMounted, onUnmounted, computed } from 'vue'
import HistoryDetail from './HistoryDetail.vue';
import type { HistoryConfig } from './Types'
import Loading from '@/components/Loading.vue';
import { darkModeClick } from '@/components/stores/StoreDarkModeGetClick.js'
import { getClick } from '@/components/stores/StoreGetClick.js'

const showHistory = ref(false)
const scrollContainer = ref(null)
const store = darkModeClick()
const storeFilters = getClick()
const emits = defineEmits(['openTeleport']);
const props = defineProps<{
  historyConfiguration: HistoryConfig
  totalPage: Number
  loading: Boolean
  person: String
  init: String
  final: String
}>();

watch(() => props.historyConfiguration, () => {
  showHistory.value = true;
});

let isTeleportOpen = false;
const handleScroll = (event:any) => {
  const element = event.target;
  const atBottom = Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) <= 1;
  if (atBottom &&!isTeleportOpen) {
    isTeleportOpen = true;
    emits('openTeleport', true);
  } else if (!atBottom && isTeleportOpen) {
    isTeleportOpen = false;
  };
};

function expandItems() {
  showHistory.value = !showHistory.value;

}
const isDarkMode = computed(() => store.onClickDarkMode && storeFilters.onClickFilters)

function toggleHistory() {
  showHistory.value = !showHistory.value

}

function formatDateTime(dateString: string): string {
  if (!dateString) return 'Data e horário indisponíveis'
  const date = new Date(dateString)
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function formatAddress(address: { road: string, town: string, state: string, country: string }): string {
  if (!address) return 'Endereço indisponível'
  return `${address.road} - ${address.town? address.town : ""} - ${address.state} - ${address.country}`
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap');
.history-wrapper {
  background-color: transparent;
  border-radius: 5px;
}
.history-title {
  color: #000;
  font-weight: 500;
  font-size: 18px;
  margin: 5px 0;
}
.history-container {
  overflow: auto;
  max-height: 260px;
  padding: 2;
  display: grid;
  grid-template-rows: auto;
  align-items: center;
}
.history-entry {
  display: grid;
  grid-template-columns: 10% 90%;
  width: 100%;
  border-radius: 8px;
  background-color: #6D6D6D;
  padding: 0;
  align-items: center;
  justify-items: center;
}
.start-icon, .end-icon {
  width: 30px;
  height: 30px;
  background-size: 75%;
  background-repeat: no-repeat;
  background-position: center;
}
.start-icon {
  background-image: url('@/assets/IconStartPin.png');
}
.end-icon {
  background-image: url('@/assets/IconEndPin.png');
}
.text-detail {
  font-size: 14px;
  color: #FFF;
}
.grid {
  display: grid;
  grid-template-rows: 50% 50%;
  padding: 5px;
  width: 100%;
}
.expand-history {
  border:3px solid transparent;
  border-radius: 10px;
  width: 100%;
  background-color: #6D6D6D;
  color: #FFF;
  font-size: 14px;
  padding: 1%;
  font-weight:600;
  cursor: pointer;
  text-align: center;
}
.empty-history {
  text-align: center;
}
.dark-mode .history-entry{
  border: 1px solid #555555;
}
.dark-mode .expand-history{
  background-color: #5f5f5f;
  border-color:3px solid transparent;
}
.dark-mode .history-title,
.dark-mode .text-detail,
.dark-mode .expand-history {
  color: #FFF;
}
.recoil{
  background: transparent;
  border: 4px solid transparent;
}
</style>