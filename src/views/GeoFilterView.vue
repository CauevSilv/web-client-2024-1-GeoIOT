<template>
  <div class="filter-container" >
    <Sidebar
        @toggle-filters="toggleFilters"
        @toggle-zone="toggleZone"
        :showFilters="showFilters"
        :showZone="showZone"
        @logout="logoutUser"
    />
    <div v-show="showFilters" class="filters" id="filters">
      <div class="title" id="title">FILTRAR</div>
      <PersonSearch
          id="autocomplete1"
          v-model="Person"
          :options="PersonOption"
          :reset="resetFilters"
          label="Colaborador:"
          @update:modelValue="onPersonSelect"
      />
      <DropDown
          id="dropdown2"
          v-model="Device"
          :options="DeviceOption"
          label="Dispositivos:"
      />
      <DropDown
        id="dropdown3"
        v-model="selectedHotzone"
        :options="zoneOptions"
        label="Zonas de interesse:"
        @change="drawZoneChange"
      />
      <DataRangePicker
          v-model:endDate="endDate"
          v-model:startDate="startDate"
          :reset="resetFilters"
          @update:startDate="startDate = $event"
          @update:endDate="endDate = $event"
          @update:selectedPeriod="selectedPeriod = $event"
      />
      <div class="button-group">
        <ClearButton class="full-width" @click="handleReset"></ClearButton>
        <StartButton class="full-width" @click="handleSave"></StartButton>
      </div>
      <div class="buttons-container">
        <div
            v-for="button in buttonsList"
            :key="button.id"
            class="toggle-button"
            :style="{ backgroundColor: button.active ? '#0f76b9' : '#ec1c24' }"
            @click="toggleButton(button)"
        >
          <span @click.stop="removeButton(button)" class="remove-button">X</span>
          {{ button.label }}
        </div>
      </div>
      <div>
        <History @openTeleport="paginatorHistory" :historyConfiguration="listOfHistory" :loading="loading" :person="Person" :init="endDate" :final="endDate"/>
      </div>
    </div>
    <div v-if="role == EnumRole.ADMIN">
    <div v-if="showZone"class="zone-component">
      <InterestZone
          @saveDraw="saveDraw"
          @toggleDrawing="toggleDrawing"
          @drawType="drawType"
          @changeZoneName="changeZoneName"
          @toggleZoneVisibility="$emit('toggleZoneVisibility')"
          @drawZone="drawZone"
          @removeShowedZone="$emit('removeZoneFilters')"
      />
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, watch} from 'vue';
import {fetchAllZones, fetchDevices, fetchPersons} from "@/services/apiService.ts";
import Sidebar from "@/components/SideBar.vue";
import DataRangePicker from "@/components/filter/DateRangePicker.vue";
import DropDown from "@/components/filter/DropDown.vue";
import History from "@/components/History.vue";
import ClearButton from "@/components/ClearButton.vue";
import StartButton from "@/components/StartButton.vue";
import PersonSearch from "@/components/PersonSearch.vue";
import {handleAxiosError} from "@/utils/errorHandler";
import {useToast} from "vue-toastification";
import {fetchHistory} from '@/services/apiService';
import InterestZone from "@/components/InterestZone.vue";
import {darkModeClick} from '@/components/stores/StoreDarkModeGetClick.js'
import {getClick} from '@/components/stores/StoreGetClick.js'
import { getPathColorManipulatorState } from '@/components/stores/StorePathManipulation.js';
import type {Polygon} from "ol/geom";
import {
  locationDtoToDrawedGeom,
  makePolygon,
  zoneOptions,
  drawedGeomsFromDb,
  selectedHotzone, buttonsList
} from "@/services/geomService";
import type {DrawedGeom} from "@/components/Types";
const emit = defineEmits(['saveFilter', 'clearPoints', 'toggleSvgColor', 'saveDraw','toggleDrawing','drawType','changeZoneName','toggleZoneVisibility','drawZone','removeZoneFilters','toggledUser','removedUserButton']);
import { EnumRole } from '@/utils/EnumRole';
import router from '@/router';
const toast = useToast();
const Person = ref(null);
const Device = ref(null);
const PersonOption = ref([]);
const DeviceOption = ref([]);
const ZoneOption = ref([]);
const listOfHistory = ref([]);
const totalPage = ref(0);
const page = ref(0);
const originalPersonOption = ref([]);
const showFilters = ref(false);
const showZone = ref(false);
const isPersonSelected = ref(false);
const startDate = ref(null);
const loading = ref(false);
const endDate = ref(null);
const selectedPeriod = ref('');
const resetFilters = ref(false);
const storeFilters = darkModeClick();
const storeGetClickToggleFilters = getClick();
const storePathManipulation = getPathColorManipulatorState();
const selectedMode = ref(null);
const role = ref<string>("");

const logoutUser = () =>{
  localStorage.clear();
  router.replace("/login");
}

function drawType(selectedMode:selectedMode){
  emit("drawType", selectedMode);
}
function saveDraw(){
  fetchAllZones().then((geoms) =>{
    zoneOptions.value = geoms.map(geom => ({
      label: geom.name,
      value: geom.idLocation
    })).filter((geom, index, self) =>
        index === self.findIndex(g => g.label === geom.label)
    );
    geoms.forEach(geom => {
      drawedGeomsFromDb.push(locationDtoToDrawedGeom(geom));
    })
    emit("saveDraw");
  });
}
function toggleDrawing(){
  emit("toggleDrawing")
}
function changeZoneName(changeZoneName:changeZoneName){
  emit("changeZoneName", changeZoneName);
}
function drawZone(drawZonePolygon:drawZone){
  emit("drawZone", drawZonePolygon);
}
function drawZoneChange(){
  let drawZonePolygon :Polygon = {};
  let selectedId :number = Number(selectedHotzone.value);
  drawedGeomsFromDb.forEach((geom) =>{
    if(geom.gid == selectedId){
      drawZonePolygon = makePolygon(geom);
    }
  })
  emit('drawZone',drawZonePolygon);
}
onMounted(async () => {
  role.value = localStorage.getItem("role");
  try {
    let personListFromDb = await fetchPersons();
    PersonOption.value = personListFromDb.map(person => ({
      label: person.fullName.toUpperCase(),
      value: person.idPerson
    })).filter((person, index, self) =>
        index === self.findIndex(p => p.label === person.label)
    );
    originalPersonOption.value = [...PersonOption.value];
  } catch (error) {
    console.error("Erro ao inicializar opções de pessoas:", error);
    handleAxiosError(error, toast);
  }
});

const onPersonSelect = async (selectedPerson) => {
  Person.value = selectedPerson;
  if (selectedPerson != null) {
    isPersonSelected.value = true;
    try {
      const allDevices = await fetchDevices();
      const filteredDevices = allDevices.filter(device => {
        return device.value === selectedPerson;
      });
      DeviceOption.value = filteredDevices;
      if (filteredDevices.length > 0) {
        Device.value = filteredDevices[0].value;
      } else {
        Device.value = null;
      }
    } catch (error) {
      console.log("Erro ao buscar dispositivos:", error);
      handleAxiosError(error, toast);
    }
  }
  fetchAllZones().then((geoms) =>{
    ZoneOption.value = geoms.map(geom => ({
      label: geom.name,
      value: geom.idLocation
    })).filter((geom, index, self) =>
        index === self.findIndex(g => g.label === geom.label)
    );
  });
};

function toggleFilters() {
  showFilters.value = !showFilters.value;
  storeGetClickToggleFilters.onClickFilters = !storeGetClickToggleFilters.onClickFilters;
  storePathManipulation.pathColorManipulatorIconFilter = !storePathManipulation.pathColorManipulatorIconFilter;
  if (storePathManipulation.pathColorManipulatorIconInterestZone === false) {
    showZone.value = false;
    storePathManipulation.pathColorManipulatorIconInterestZone = true;
  }
}

function toggleZone() {
  showZone.value = !showZone.value;
  storeGetClickToggleFilters.onClickInterestZone = !storeGetClickToggleFilters.onClickInterestZone;
  storePathManipulation.pathColorManipulatorIconInterestZone = !storePathManipulation.pathColorManipulatorIconInterestZone;
  if (storePathManipulation.pathColorManipulatorIconFilter === false) {
    showFilters.value = false;
    storePathManipulation.pathColorManipulatorIconFilter = true;
  }
}

function handleSave() {
  let hasErrors = false;

  if (!Person.value) {
    toast.error("Por favor, selecione um colaborador.");
    hasErrors = true;
  }
  if (!Device.value) {
    toast.error("Por favor, selecione um dispositivo.");
    hasErrors = true;
  }
  if (!startDate.value) {
    toast.error("Por favor, selecione uma data de início.");
    hasErrors = true;
  }
  if (!endDate.value) {
    toast.error("Por favor, selecione uma data de fim.");
    hasErrors = true;
  }

  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);

    if (end < start) {
      toast.error("A data de fim deve ser superior à data de início.");
      hasErrors = true;
    } else {
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 31) {
        toast.error("O intervalo selecionado não pode ser maior que 31 dias.");
        hasErrors = true;
      }
    }
  let filterDataForButtons = {};
    if (!hasErrors) {
      if(selectedHotzone.value){
        const filterData = {
          person: Person.value,
          device: Device.value,
          startDate: startDate.value,
          endDate: endDate.value,
          selectedZone: selectedHotzone.value,
        };
        filterDataForButtons = filterData;
        emit('saveFilter', filterData);
      } else {
        const filterData = {
          person: Person.value,
          device: Device.value,
          startDate: startDate.value,
          endDate: endDate.value,
        };
        filterDataForButtons = filterData;
        emit('saveFilter', filterData);
        loading.value = true;
        page.value = 1;
        getHistory(filterData.person, filterData.startDate, filterData.endDate, page.value);
      }
      if (!hasErrors && !buttonsList.value.find(button => button.id === Person.value) && selectedHotzone.value == undefined) {
        if(buttonsList.value.length > 0){
          buttonsList.value.push({
            id: Person.value,
            label: `${PersonOption.value.find(p => p.value === Person.value).label}`,
            active: true,
            filterButtonData: {filterDataForButtons},
          });
          buttonsList.value[buttonsList.value.length - 2].active = false;
        }else{
          buttonsList.value.push({
            id: Person.value,
            label: `${PersonOption.value.find(p => p.value === Person.value).label}`,
            active: true,
            filterButtonData: {filterDataForButtons},
          });
        }
      }

    }
  }
}

function toggleButton(buttonActioned) {
  buttonActioned.active = !buttonActioned.active;
  buttonsList.value.forEach((button) => {
    if (button.id !== buttonActioned.id) {
      button.active = false;
    }
  })
  emit('toggledUser',buttonActioned);
}

function removeButton(buttonRemoved) {
  emit('removedUserButton', buttonRemoved);

}

const paginatorHistory = (event) => {
  let currentPage = page.value + 1;
  let total = Number(totalPage.value);
  if(total >= currentPage){
    loading.value = true;
    getHistory(Person.value, startDate.value, endDate.value, currentPage);
  }
}

const getHistory = async (person, startDate, endDate, pageValue) => {
  try {
    const historyRequest = await fetchHistory(person, startDate, endDate, pageValue);
    listOfHistory.value = [...new Set([...listOfHistory.value, ...historyRequest.content])
    ];
    if (listOfHistory.value.length == 1) {
      if (totalPage.value >= pageValue)
        loading.value = true;
      getHistory(person, startDate, endDate, pageValue + 1);
    }
    totalPage.value = historyRequest.totalPages;
    page.value = historyRequest.pageable.pageNumber;
    loading.value = false;
  } catch (error){
    console.error(error)
    toast.error("Erro ao buscar histórico. Tente novamente mais tarde.")
  }
}
function handleReset() {
  Person.value = null;
  Device.value = null;
  DeviceOption.value = [];
  startDate.value = null;
  endDate.value = null;
  selectedPeriod.value = '';
  listOfHistory.value = [];
  selectedHotzone.value = 0;

  resetFilters.value = true;
  setTimeout(() => {
    resetFilters.value = false;
  }, 0);

  emit('clearPoints');
}

watch(() => storeFilters.onClickDarkMode,
  () => {

  const filter = document.getElementById('filters')
  const title = document.getElementById('title')

  if (storeFilters.onClickDarkMode){
    filter.style.borderRight = "4px solid #EC1C24";
    filter.style.background = "#262626";
    title.style.color = "#FFF";
  } else {
    filter.style.borderRight = "4px solid #000059",
    filter.style.background = "#EFEFEF",
    title.style.color = "#000";
  }
});
onMounted(()=>{
  fetchAllZones().then((geoms) =>{
    zoneOptions.value = geoms.map(geom => ({
      label: geom.name,
      value: geom.idLocation
    })).filter((geom, index, self) =>
        index === self.findIndex(g => g.label === geom.label)
    );
    geoms.forEach(geom => {
      drawedGeomsFromDb.push(locationDtoToDrawedGeom(geom));
    })
  });
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

.filters {
  position: fixed;
  top: 3%;
  left: 100px;
  width: 380px;
  height: 87%;
  padding: 16px;
  border-right: 4px solid #000059;
  background: #EFEFEF;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: left 0.5s ease;
  font-family: 'Poppins', regular, sans-serif;
  font-size: 12px;
  z-index: 10;
  text:#fff;
}

.title {
  font-family: 'Poppins', regular, sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #000;
  padding-bottom: 0%;
}

.button-group {
  margin-top: 16px;
  display: flex;
  gap: 10px;
}

.full-width {
  flex: 1;
}

.filter-container ::-webkit-scrollbar {
  width: 5px;
  }

.filter-container ::-webkit-scrollbar-thumb {
  border-radius: 50px;
  background: #A0A0A080;
}

.filter-container ::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 50px;
}
.buttons-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 16px;
}

.toggle-button {
  position: relative;
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 5px;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding:5px;
  text-align: center;
}


.remove-button {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background-color: #6d6d6d;
  border-radius: 50%;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.remove-button:hover {
  background-color: #606060;
  transform: scale(1.1);
}
</style>