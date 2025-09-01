<template>
  <div class="filter-container" >
    <Sidebar
        @toggle-filters="toggleFilters"
        @toggle-zone="toggleZone"
        :showFilters="showFilters"
        :showZone="showZone"
        @logout="logoutUser"
    />
    <div v-if="role == EnumRole.ADMIN">
    <div v-if="showZone"class="zone-component">
      <InterestZone
          @saveDraw="saveDraw"
          @toggleDrawing="toggleDrawing"
          @drawType="drawType"
          @changeZoneName="changeZoneName"
          @toggleZoneVisibility="$emit('toggleZoneVisibility')"
          @removeShowedZone="$emit('removeZoneFilters')"
          @drawGeomFromGeomTable="$emit('drawZone')"
      />
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {fetchAllZones} from "@/services/apiService";
import Sidebar from "@/components/SideBar.vue";
import InterestZone from "@/components/InterestZone.vue";
import {getClick} from '@/components/stores/StoreGetClick.js'
import { getPathColorManipulatorState } from '@/components/stores/StorePathManipulation.js';
import {
  locationDtoToDrawedGeom,
  zoneOptions,
  drawedGeomsFromDb,
} from "@/services/geomService";
const emit = defineEmits(['saveFilter', 'clearPoints', 'toggleSvgColor', 'saveDraw','toggleDrawing','drawType','changeZoneName','toggleZoneVisibility','drawZone','removeZoneFilters','toggledUser','removedUserButton']);
import { EnumRole } from '@/utils/EnumRole';
import router from '@/router';

const showFilters = ref(false);
const showZone = ref(false);
const storeGetClickToggleFilters = getClick();
const storePathManipulation = getPathColorManipulatorState();
const role = ref<string>("");

const logoutUser = () =>{
  localStorage.clear();
  router.replace("/login");
}

function drawType(selectedMode:selectedMode){
  emit("drawType", selectedMode);
}
function saveDraw(){
  emit("saveDraw");
}
function toggleDrawing(){
  emit("toggleDrawing")
}
function changeZoneName(changeZoneName:changeZoneName){
  emit("changeZoneName", changeZoneName);
}

onMounted(async () => {
  role.value! = localStorage.getItem("role");
});

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