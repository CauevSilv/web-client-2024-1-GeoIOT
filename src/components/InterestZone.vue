<template>
  <div :class="['zone-container', { 'dark-mode': storeFilters.onClickDarkMode, 'cursor-pencil': drawMode }]">
    <div class="zone-of-interest">
      <h2 :class="['title', { 'dark-mode-text': storeFilters.onClickDarkMode }]">ZONA DE INTERESSE</h2>
      <label for="zone-name" :class="['label', { 'dark-mode-text': storeFilters.onClickDarkMode }]">
        Dê um nome para sua zona de interesse:
      </label>
      <input type="text" id="zone-name" :class="['input', { 'dark-mode-input': storeFilters.onClickDarkMode }]"
             placeholder="Nome da zona de interesse" @change="changeZoneName" v-model="zoneName"/>
      <div class="options">
        <div class="dropdown-container">
          <DropDown
              id="draw-mode-dropdown"
              :options="modeOptions"
              v-model="selectedMode"
              class="small-dropdown"
              @change="drawType"
          />
          <button v-if="selectedMode" class="clear-button" @click="clearSelectedMode">
            &times;
          </button>
        </div>
        <div class="button-group">
          <button :class="['eraser-button', { 'dark-mode-save': storeFilters.onClickDarkMode }]" @click="eraseDraw">
            <IconEraser class="icon-eraser"/>
          </button>
          <button :class="['save-button', { 'dark-mode-save': storeFilters.onClickDarkMode }]" @click="saveDraw">
            <IconSaveGeometry class="icon-save-geometry"/>
          </button>
        </div>
      </div>
      <div class="delete-zone-container">
        <button v-if="deletedHotzones && deletedHotzones.length > 0" @click="removeShowedZone" :class="['remove-button', { 'dark-mode-button': storeFilters.onClickDarkMode }]">
          <IconRemoveFilter></IconRemoveFilter>
        </button>
        <DropDown id="delete-hotzone" label="Zonas de interesse:" :options="zoneOptions"
                  v-model="deletedHotzones" class="dropdown" @change="drawZoneChange"/>
        <button @click="deleteZone" :class="['delete-button', { 'dark-mode-button': storeFilters.onClickDarkMode }]">
          Deletar
        </button>
      </div>
      <div v-if="zoneOptions !== undefined">
        <GeomTable :prop ="zoneOptions"/>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import {ref} from 'vue';
import {useToast} from 'vue-toastification';
import DropDown from "@/components/filter/DropDown.vue";
import {darkModeClick} from "./stores/StoreDarkModeGetClick";
import {deleteZoneByGid, fetchAllZones} from "@/services/apiService";
import {
  locationDtoToDrawedGeom,
  makePolygon,
  zoneOptions,
  drawedGeomsFromDb,
  selectedHotzone,
  drawingActive,
  deletedHotzones
} from "@/services/geomService";
import type {Polygon} from "ol/geom";
import IconEraser from "@/components/icons/IconEraser.vue";
import IconSaveGeometry from "@/components/icons/IconSaveGeometry.vue";
import IconRemoveFilter from "@/components/icons/IconRemoveFilter.vue";
import GeomTable from "@/components/GeomTable.vue";

const modeOptions = [
  {label: 'Círculo', value: 'Circle'},
  {label: 'Polígono', value: 'Polygon'}
];
let selectedMode = ref('');
const drawMode = ref(false);
const zoneName = ref(null);
const emit = defineEmits([
  'saveDraw', 'drawType', 'toggleDrawing', 'changeZoneName', 'toggleZoneVisibility', 'drawZone', 'removeShowedZone', 'interestZonesFromDb'
]);
const storeFilters = darkModeClick();
const toast = useToast();

function saveDraw() {
  if (!zoneName.value) {
    toast.error("Por favor, insira um nome para a zona de interesse.");
    return;
  }

  if (!drawingActive.value) {
    toast.error("Por favor, desenhe a zona de interesse antes de salvar.");
    return;
  }

  emit("saveDraw");

  fetchAllZones().then((geoms) => {
    zoneOptions.value = geoms.map(geom => ({
      label: geom.name,
      value: geom.idLocation
    })).filter((geom, index, self) =>
        index === self.findIndex(g => g.label === geom.label)
    );
    geoms.forEach(geom => {
      drawedGeomsFromDb.push(locationDtoToDrawedGeom(geom));
    });

    zoneName.value = null;
    selectedMode.value = null;
    emit("toggleDrawing");
    drawMode.value = false;
  });
}

function eraseDraw() {
  emit("toggleDrawing");
  emit("toggleDrawing");
}

function changeZoneName() {
  emit('changeZoneName', zoneName.value);
}

function drawType() {
  if (drawingActive.value) {
    drawMode.value = !drawMode.value;
    emit('toggleDrawing');
    emit('drawType', selectedMode.value);
    emit('toggleDrawing');
    drawMode.value = !drawMode.value;
  } else {
    emit('drawType', selectedMode.value);
    emit('toggleDrawing');
    drawMode.value = !drawMode.value;
  }
}

function drawZoneChange() {
  let drawZonePolygon: Polygon = {};
  let selectedId: number = Number(deletedHotzones.value);
  drawedGeomsFromDb.forEach((geom) => {
    if (geom.gid == selectedId) {
      drawZonePolygon = makePolygon(geom);
    }
  });
  emit('drawZone', drawZonePolygon);
}

function removeShowedZone() {
  selectedHotzone.value = 0;
  emit('removeShowedZone');
  drawMode.value = false;
  deletedHotzones.value = '';
}

function deleteZone() {
  emit('removeShowedZone');
  let selectedId: number = Number(deletedHotzones.value);
  deleteZoneByGid(selectedId).then((geoms) => {
    fetchAllZones().then((geoms) => {
      zoneOptions.value = geoms.map(geom => ({
        label: geom.name,
        value: geom.idLocation
      })).filter((geom, index, self) =>
          index === self.findIndex(g => g.label === geom.label)
      );
      geoms.forEach(geom => {
        drawedGeomsFromDb.push(locationDtoToDrawedGeom(geom));
      });
      deletedHotzones == ref<number>();
    });
    deletedHotzones.value = '';
  });
}

function clearSelectedMode() {
  selectedMode.value = '';
  emit("toggleDrawing");
  drawMode.value = false;
}
</script>

<
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

.zone-container {
  position: fixed;
  top: 3%;
  left: 100px;
  width: 380px;
  height: 87%;
  padding: 8px;
  background: #EFEFEF;
  border-right: 4px solid #000059;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  transition: right 0.5s ease;
  color: #000;
  z-index: 10;
  font-family: 'Poppins', regular, sans-serif;
}

.zone-of-interest {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  border-radius: 8px;
}

.delete-zone-container {
  margin-top: 30px;
}

.delete-zone-container .dropdown, .delete-button{
  margin-bottom: 10px;
}

.dropdown-container {
  position: relative;
  margin-bottom: 5px;
}

.title {
  font-family: 'Poppins', regular, sans-serif;
  font-weight: 700;
  font-size: 24px;
  color: #000;
  padding-bottom: 8px;
}

.clear-button {
  position: absolute;
  right: -30px;
  top: 40%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
}

.clear-button:hover {
  color: #EC1C24;
}

.dropdown-container {
  position: relative;
}

.label {
  display: block;
  margin-bottom: 8px;
  font-size: 12px;
  font-family: 'Poppins', regular, sans-serif;
}

.input {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: none;
  background-color: #6D6D6D;
  color: #FFF;
  margin-bottom: 20px;
}

.input::placeholder {
  color: #FFFFFF;
  opacity: 1;
}

.options {
  display: flex;
  gap: 10px;
  width: 100%;
  justify-content: space-between;
}

.small-dropdown {
  height: 37px;
  display: flex;
  justify-content: center;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.eraser-button, .save-button, .remove-button {
  background-color: #6D6D6D;
  color: #FFF;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-left: auto;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-button {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 5px;
  background-color: #000059;
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 20px;
}

.dropdown {
  margin-bottom: 16px;
  width: 100%;
}

.dark-mode {
  background-color: #262626 !important;
  border-right: 4px solid #EC1C24;
}

.dark-mode-text {
  color: #FFF !important;
}

.dark-mode-input {
  background-color: #444444 !important;
  color: #FFF;
}

.dark-mode-button {
  background-color: #EC1C24 !important;
}

.dark-mode-input::placeholder {
  color: #FFF !important;
  opacity: 0.8;
}

.save-button.dark-mode-save {
  background-color: #EC1C24 !important;
}

.dark-mode .eraser-button {
  background-color: #EC1C24 !important;
  color: #FFF !important;
}

.cursor-pencil {
  cursor: crosshair;
}

.cursor-default {
  cursor: default;
}
</style>