<template>
  <div class="map-wrapper">
    <GeoFilterView class="filter-overlay"
                   @saveFilter="handleFilterData"
                   @clearPoints="clearPoints"
                   @saveDraw="saveGeometry"
                   @toggleDrawing="toggleDrawing"
                   @drawType="drawTypeUpdate"
                   @changeZoneName="changeZoneName"
                   @toggleZoneVisibility="toggleZoneVisibility"
                   @drawZone="drawZone"
                   @removeZoneFilters="removeZoneFilters"
                   @toggledUser="toggledUserHandler"
                   @removedUserButton="removedUserHandler"
    />

    <DarkOrLight class="toggle-dark-white-mode" @toggle-dark-white-mode="toggleTheme"/> 
    <div id="map" class="map-container"></div>
    <div
        class="icon-center"
        @click="centerMap"
        :style="{ cursor: 'pointer', opacity: iconOpacity }"
    >
      <i class="fa-solid fa-location-crosshairs icon-center-icon"></i>
    </div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {Feature, Map, Overlay} from 'ol';
import {Vector as VectorSource, XYZ} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Circle, LineString, Point, type Polygon} from 'ol/geom';
import {Fill, Icon, Stroke, Style} from 'ol/style';
import GeoFilterView from "@/views/GeoFilterView.vue";
import PlaybackControl from '@/views/PlaybackControl.vue';
import type {Coordinate} from 'ol/coordinate';
import {useToast} from "vue-toastification";
import {boundingExtent} from 'ol/extent';
import {
  fetchAllZones,
  fetchGeomData,
  fetchGeomDataWithinZone,
  fetchPersonById,
  fetchStopPoints,
  saveGeomData
} from "@/services/apiService";
import {createMap, createNewVectorLayer} from "@/services/mapService";
import {Draw, Extent} from "ol/interaction";
import DarkOrLight from '@/views/DarkOrLight.vue';
import IconStopPoint from "@/assets/IconStopPoint.png";
import type {GeometryPoint, Pessoa, StopPoint} from "@/services/Types";
import {
  buttonsList,
  convertToDrawedGeom,
  createStartAndEndPoint,
  drawedGeomsFromDb,
  drawingActive,
  loadedRoutes,
  locationDtoToDrawedGeom,
  makeFeature,
  makeLineString,
  makeMultiplePointsLegacy,
  makePointsFromArray,
  selectedHotzone, startPointIconMap,
  zoneOptions
} from "@/services/geomService";
import IconEndPin from "@/assets/IconEndPin.png";
import {handleTypeError} from "@/utils/errorHandler";
import IconPositionMap from "@/assets/IconPositionMap.png";

const toast = useToast();

let cursorType = ref('default')
let center = ref([-60.457873,0.584053]);
let projection = ref("EPSG:4326");
let zoom = ref(5);
let map = ref<Map | null>(null);

let source = ref<VectorSource>();
let draw = ref<Draw | null>(null);
let drawType = ref('Circle');
let drawGeomName = ref<string>();
let zoneVisibility = ref(true);
let zoneDrawd :Boolean = false;

const mapMode = ref(false);
let darkOrWhiteMap: string;
const iconScale = ref(1);
const iconOpacity = ref(1);

function saveGeometry() {
  map.value?.getLayers().array_.forEach(layer => {
    if (layer.values_.layerName == 'Draw Layer') {
      layer.getSource().getFeatures().forEach((feature: Feature) => {
        try {
          if (feature.getGeometry().getRadius()) {
            saveGeomData(convertToDrawedGeom(feature, 'CIRCLE', drawGeomName.value)).then((obj) => {
              fetchAllZones().then((geoms) => {
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
          }
        } catch (e) {
          saveGeomData(convertToDrawedGeom(feature, 'POLYGON', drawGeomName.value)).then((obj) => {
            fetchAllZones().then((geoms) => {
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
          handleTypeError(e);
        }
      });
      source.value = new VectorSource();
    }
  })
}
function toggleZoneVisibility(){
  if(zoneVisibility.value) {
    zoneVisibility.value = false;
    map.value?.getLayers().array_.forEach(layer =>{
      if(layer.values_.layerName == 'Draw Layer'){
        layer.setVisible(false);
      }
    })
  } else {
    zoneVisibility.value = true;
    map.value?.getLayers().array_.forEach(layer =>{
      if(layer.values_.layerName == 'Draw Layer'){
        layer.setVisible(true)
      }
    })
  }
}
function drawTypeUpdate(selectedMode:selectedMode){
  drawType.value = selectedMode;
}
function changeZoneName(newZoneName){
  drawGeomName.value = newZoneName;
}

function toggleTheme() {
  const iconCenter = document.getElementById("icon-center");
  mapMode.value = !mapMode.value;

  if (mapMode.value) {
    darkOrWhiteMap = 'streets-v2-dark';
  } else {
    darkOrWhiteMap = 'streets-v2';
  }
  if (map.value) {
    map.value?.getLayers().array_.forEach(layer => {
      if(layer.values_.layerName == 'TileLayer'){
        layer.setSource(new XYZ({
          url: `https://api.maptiler.com/maps/${darkOrWhiteMap}/{z}/{x}/{y}.png?key=h0XJNXXoyzrwdtWPRe9B`
        }));
      }
    })
  }
}

const adjustMap = (drawedZone?:Polygon|Circle) => {
  if(drawedZone){
    const extent = drawedZone.getExtent();
    if (map.value) {
      map.value
          .getView()
          .fit(extent, {padding: [50, 50, 50, 50], maxZoom: 15,duration: 1000});
    }
  } else {
    let coordinatesExtend = [];
    map.value?.getLayers().array_.forEach((layer) =>{
      if(layer.values_.layerName == 'Layer InsideZone' || layer.values_.layerName == 'Layer dos Pontos' || layer.values_.layerName == 'Layer Stard and End' || layer.values_.layerName == undefined){
        layer.getSource().getFeatures().forEach(feature =>{
          if(feature.getGeometry()){
            coordinatesExtend.push([feature.getGeometry().getExtent()[0],feature.getGeometry().getExtent()[1]]);
            return;
          }
        });
      }

    });
    const extent = boundingExtent(coordinatesExtend);
    map.value?.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 15 ,duration: 1000});
  }
};
function toggleDrawing() {
  if (drawingActive.value) {
    stopDrawing();
  } else {
    startDrawing();
  }
  updateCursor();
}
function startDrawing() {
  if (!map.value){
    return;
  } else {

    drawingActive.value = true;
    draw.value = new Draw({
      source: source.value,
      stopClick: true,
      type: drawType.value as 'Circle' | 'Polygon',
      style: new Style({
        fill: new Fill({ color: 'rgba(110,105,105,0.52)' }),
        stroke: new Stroke({ color: '#ec3b3b', width: 4 }),
      }),
    });
  }
  draw.value.on('drawend', (event) => {
    useToast().info('Desenho finalizado!');
  });
  map.value.addInteraction(draw.value);
  updateCursor();
}
function stopDrawing() {
  if (draw.value && map.value) {
    map.value.removeInteraction(draw.value);
    draw.value = null;
    drawingActive.value = false;
  }
  map.value?.getLayers().array_.forEach((layer:VectorLayer) =>{
    if(layer.values_.layerName == 'Draw Layer'){
      source.value = new VectorSource();
      layer.setSource(source.value);
    }
  });
  updateCursor();
}
function centerMap() {
  if (map.value) {
    const defaultCenter = [-60.457873, 0.584053];
    let coordinates:Coordinate[] = [];
    coordinates.push(defaultCenter)
    const defaultZoom = 5;
    map.value?.getView().setCenter(defaultCenter);
    map.value?.getView().setZoom(defaultZoom);
      // const extent = boundingExtent(coordinates);
      // map.value?.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 15 ,duration: 1000});
    }
}

function updateCursor() {
  if (drawingActive.value) {
    document.body.style.cursor = 'crosshair';
  } else {
    document.body.style.cursor = cursorType.value;
  }
}

let showedZone :Polygon = {};
function drawZone(drawZonePolygon:typeof drawZone){
  zoneDrawd = true;
  showedZone = drawZonePolygon;
  let featureArray :Feature[] = [];
  let newFeature :Feature = makeFeature(undefined,undefined,drawZonePolygon);
  featureArray.push(newFeature);
  let newVectorLayer:VectorLayer = createNewVectorLayer(featureArray,'Layer das Zonas');
  map.value?.getLayers().array_.forEach((layer) =>{
    if(layer.values_.layerName == 'Layer das Zonas')
    map.value?.removeLayer(layer);
  });
  map.value?.addLayer(newVectorLayer);
  adjustMap(drawZonePolygon);
}
function removeZoneFilters(){
  map.value?.getLayers().array_.forEach((layer) =>{
    if(layer.values_.layerName == 'Layer das Zonas')
      map.value?.removeLayer(layer);
  });
}
onMounted(() => {
  darkOrWhiteMap = 'streets-v2';
  map.value = createMap(center, zoom, projection, darkOrWhiteMap);
  source.value = new VectorSource();
  map.value.addLayer(createNewVectorLayer(source.value,'Draw Layer',source.value));
});
</script>

<style scoped>
.map-container {
  width: 100vw;
  height: 100vh;
}

.filter-overlay {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: transparent;
  padding: 10px;
  border-radius: 8px;
  z-index: 3;
}

.playback-layer {
  width: 100%;
  height: 6.8%;
  position: absolute;
  bottom: 0px;
  z-index: 2;
  transition: bottom 0.5s ease;
  align-content: center;
  align-items: center;
}

.toggle-dark-white-mode {
  justify-content: center;
  position: absolute;
  right: 11px;
  bottom: 138px;
  z-index: 2;
}

:global(.ol-zoom-in) {
  bottom: 3.5em;
  right: 10px;
  position: fixed;
}

:global(.ol-zoom-out) {
  bottom: 1em;
  right: 10px;
  position: fixed;
}

:global(.ol-control button)  {
  color: #000000;
  display: block;
  font-weight: bold;
  font-size: inherit;
  text-align: center;
  height: 2.67em;
  width: 2.67em;
  line-height: .4em;
  border: none;
  border-radius: 2px;
}

.icon-center {
  position: absolute;
  bottom: 97.91px;
  right: 11px;
  z-index: 4;
  background-color: white;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom-left-radius: 2px;
  border-bottom-right-radius: 2px;
}

.icon-center-icon {
  font-size: 20px;
  color: #3A3A3A;
}

</style>