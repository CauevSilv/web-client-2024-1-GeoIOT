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

    <div v-if="showPlayback" class="playback-layer">
      <PlaybackControl
        v-model:rota="route" 
        v-model:iconMap="startPointIconMap"
        v-model:allCoordinatesAnimation="allCoordinatesAnimation"
        v-model:anguloInicial="anguloInicial"
      />
    </div>
    <DarkOrLight class="toggle-dark-white-mode" @toggle-dark-white-mode="toggleTheme"/> 
    <div id="map" class="map-container"></div>
    <div
        class="icon-center"
        @click="centerMap"
        :style="{ cursor: 'pointer', opacity: iconOpacity }"
    >
      <i class="fa-solid fa-location-crosshairs icon-center-icon"></i>
    </div>
    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-content"></div>
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
let pointFeatures = ref<Feature[]>([]);
let routeLine = ref<Feature[]>([]);
let pointFinalStar = ref<Feature[]>([]);
let lineLayer = ref<VectorLayer<VectorSource> | null>(null);
let anguloInicial = 0;


const route = ref<LineString>();
const allCoordinatesAnimation = ref<Coordinate[]>([]);
const showPlayback = ref(false);

let popup = ref<Overlay | null>(null);
let popupContent = ref<HTMLElement | null>(null);
let popupCloser = ref<HTMLElement | null>(null);

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
function toggledUserHandler(buttonObject){
    if(showPlayback.value && buttonObject.active){
      showPlayback.value = false;
      loadedRoutes.value.forEach((routeObj)=>{
        if(routeObj.pessoaId  == buttonObject.id){
          route.value = routeObj.linestringObj;
          allCoordinatesAnimation.value = routeObj.linestringObj.getCoordinates();
          map.value?.getLayers().array_.forEach((layer) =>{
            startPointIconMap?.value?.setStyle(undefined)
            if(layer.values_.layerName == 'Layer Stard and End'){
              if(startPointIconMap.value){
                if(layer.getProperties().personId == startPointIconMap.value.getProperties().personId){
                  startPointIconMap.value = layer.getSource().getFeatures()[2];
                  startPointIconMap?.value?.setProperties({personId: buttonObject.id})
                  let extent = route?.value?.getExtent();
                  map.value?.getView().fit(extent, { padding: [50, 50, 50, 50],duration: 1000});
                }
              }
            }
           })
          showPlayback.value = true;
        }
      })
    } else if(!buttonObject.active){
      showPlayback.value = false;
      startPointIconMap?.value?.setStyle(undefined)
    } else if(buttonObject.active){
      showPlayback.value = false;
      startPointIconMap?.value == undefined;
      loadedRoutes.value.forEach((routeObj)=>{
        if(routeObj.pessoaId  == buttonObject.id){
          route.value = routeObj.linestringObj;
          allCoordinatesAnimation.value = routeObj.linestringObj.getCoordinates();
          map.value?.getLayers().array_.forEach((layer) =>{
            startPointIconMap?.value == undefined;
            if(layer.values_.layerName == 'Layer Stard and End'){
              if(startPointIconMap.value){
                if(layer.getProperties().personId == startPointIconMap.value.getProperties().personId){
                  startPointIconMap.value = layer.getSource().getFeatures()[2];
                  startPointIconMap?.value?.setProperties({personId: buttonObject.id})
                  startPointIconMap?.value?.setStyle(new Style({
                    image: new Icon({
                      src: IconPositionMap,
                      anchor: [0.5, 0.5],
                      scale: 0.2
                    }),
                  }))
                  let extent = route?.value?.getExtent();
                  map.value?.getView().fit(extent, { padding: [50, 50, 50, 50] ,duration: 1000});
                }
              }
            }
          })
          showPlayback.value = true;
        }
      })
    }
  // route.value =
  // const allCoordinatesAnimation = ref<Coordinate[]>([]);
  // const showPlayback = ref(false);
}
function removedUserHandler(buttonRemoved){
  buttonsList.value.forEach(button => {
    if(button.id == buttonRemoved.id){
      switch(button.active){
        case true:
          loadedRoutes.value.forEach(routeObj=>{
            if(routeObj.pessoaId == button.id){
              loadedRoutes.value = loadedRoutes.value.filter((routeObj)=>routeObj.pessoaId != button.id);
            }
          })
          toggledUserHandler(buttonRemoved);
          buttonsList.value = buttonsList.value.filter((b) => b.id !== buttonRemoved.id);
          break;
        case false:
          loadedRoutes.value.forEach(routeObj=>{
            if(routeObj.pessoaId == button.id){
              loadedRoutes.value = loadedRoutes.value.filter((routeObj)=>routeObj.pessoaId != button.id);
            }
          })
          buttonsList.value = buttonsList.value.filter((b) => b.id !== buttonRemoved.id);
          break;
      }

    }
  })
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
function initializePopup() {
  popupContent.value = document.getElementById('popup-content');
  popupCloser.value = document.getElementById('popup-closer');

  popup.value = new Overlay({
    element: document.getElementById('popup')!,
    autoPan: true,
    autoPanAnimation: { duration: 250 },
  });

  popupCloser.value.onclick = function () {
    popup.value?.setPosition(undefined);
    popupCloser.value?.blur();
    return false;
  };

  map.value?.addOverlay(popup.value);
}

function handleMapClick(event) {
  if (popupContent.value) {
    popupContent.value.innerHTML = null;
    popup.value?.setPosition(null);
  }
  map.value?.forEachFeatureAtPixel(event.pixel, function (feature) {
    let coordinates = (feature.getGeometry() as Point).getCoordinates();
    let name = feature.values_.person.fullName
    if (popupContent.value) {
      popupContent.value.innerHTML = `<p><b>${name}</b></p><p>Coordenadas: ${coordinates}</p>`;
      popup.value?.setPosition(coordinates);
    }
  });
}


function getInitialRotation() {
  const [lon1, lat1] = allCoordinatesAnimation.value;
  const [lon2, lat2] = allCoordinatesAnimation.value;

  const deltaLon = lon2 - lon1;
  const deltaLat = lat2 - lat1;

  anguloInicial = Math.atan2(deltaLat, deltaLon)*-1;
}

function convertToGeometryPoints(data: any[]): GeometryPoint[] | null {
  let geometryPoints:GeometryPoint[]= [];
  data.forEach(d => {
    let newGeometryPoint: GeometryPoint = {};
    newGeometryPoint.id = d.id;
    newGeometryPoint.idText = d.itoId;
    newGeometryPoint.createdAt = d.createdAt;
    newGeometryPoint.coordinates = [d.longitude, d.latitude];
    geometryPoints.push(newGeometryPoint);
  })
  return geometryPoints;
}
let selectedPessoa:Pessoa;
function handleFilterData(filterData:{person: number | undefined, startDate:string | null, endDate:string | null, selectedZone:number | null}){
  fetchPersonById(filterData.person).then((pessoa)=>{
    selectedPessoa = pessoa;
  });
  if(zoneDrawd) {
    fetchGeomDataWithinZone(filterData.startDate, filterData.endDate, filterData.selectedZone).then((points: []) => {
      if (!points) {
        toast.info("Nenhum ponto encontrado para o filtro selecionado.");
        if (showPlayback.value) {
          showPlayback.value = false;
        }
      }
      let convertedPoints: GeometryPoint[]|null= convertToGeometryPoints(points);
      plotAllOnMap(convertedPoints);
    })
  }else{
    let startAndEndPoints :GeometryPoint[] = plotStartAndEndPoints(filterData.person, filterData.startDate, filterData.endDate,0)
    plotStopPoints(filterData.person, filterData.startDate, filterData.endDate);
  }
}
function plotAllOnMap(points:StopPoint[]|GeometryPoint[], hasRoute?:Boolean, personId?:number){
  let newLayer = ref<VectorLayer>({});
    if(hasRoute){
      newLayer.value = createNewVectorLayer(createStartAndEndPoint(points,anguloInicial),'Layer Stard and End',undefined,4)
      newLayer.value.setProperties({personId: personId})
      map.value?.addLayer(newLayer.value);
      pointFeatures.value = makeMultiplePointsLegacy(points);
      map.value.addLayer(makeLineFromPoints(pointFeatures,personId));
    } else {
      let insidePointStyle  :Style = new Style({
        image: new Icon({
          src: IconEndPin,
          scale: 0.7,
          anchor: [0.5, 1],
        }),
      })
      newLayer.value = createNewVectorLayer(makePointsFromArray(points,insidePointStyle),'Layer InsideZone',undefined,4)
    map.value?.addLayer(newLayer.value);
    if (showPlayback.value) {
      showPlayback.value = false;
    }
  }
  buttonsList.value.forEach(botao =>{
    if(botao.id == selectedPessoa.idPerson){
      botao.layer == newLayer.value;
      toggledUserHandler(botao)
    }
  })
  initializePopup();
  adjustMap();
}
function plotStartAndEndPoints(personId:number, startDate:string, endDate:string, page:number):GeometryPoint[]{
  fetchGeomData(personId,startDate,endDate,page).then((points:GeometryPoint[]) => {
    if (!points) {
      toast.info("Nenhum ponto encontrado para o filtro selecionado.");
      if (showPlayback.value) {
        showPlayback.value = false;
      }
    } else {
      plotAllOnMap(points,true,personId);
      return points
    }

  });
}
function plotStopPoints(person: number , startDate:string, endDate:string, selectedZone?:number) :StopPoint[]{
  fetchStopPoints(person, startDate, endDate, 0).then((points:StopPoint[]) => {
    if (!points) {
      toast.info("Nenhum ponto encontrado para o filtro selecionado.");
      if (showPlayback.value) {
        showPlayback.value = false;
      }
    } else {
      let stopPointStyle:Style = new Style({
        image: new Icon({
          src: IconStopPoint,
          scale: 0.6,
          anchor: [0.5, 1],
        }),
      });
      map.value?.addLayer(createNewVectorLayer(makePointsFromArray(points,stopPointStyle)));
      return points
    }
  });
}

function clearPoints() {
  if (map.value) {
    map.value?.getLayers().array_.forEach(layer => {
      while (map.value?.getLayers().array_[map.value?.getLayers().array_.length-1].values_.layerName != 'TileLayer'){
        map.value?.removeLayer(map.value?.getLayers().array_[map.value?.getLayers().array_.length-1]);
      }
    })
    selectedHotzone.value = 0;
    showPlayback.value = false;
    route.value = [];
    pointFeatures.value = [];
    routeLine.value = [];
    pointFinalStar.value = [];
    buttonsList.value = [];
    zoneDrawd = false;
    if (popupContent.value) {
      popupContent.value.innerHTML = null;
      popup.value?.setPosition(null);
    }
    map.value.addLayer(createNewVectorLayer(source.value,'Draw Layer',source.value));
    adjustMap();
    showPlayback.value = false;
  }
}
function makeLineFromPoints(featureList:Feature[], person:number) {
  if (!featureList) {
    toast.info("Nenhum ponto disponível para criar linhas.");
    return null;
  }
  let featureArray :Feature[] = [];
  let newLineString: LineString = makeLineString(featureList);
  featureArray.push(new Feature({geometry: newLineString,properties: {personId: person}}));
  featureArray[0].setStyle(new Style({
    stroke: new Stroke({
      color: '#000000',
      width: 4
    }),
    zIndex: 4
  }));
  route.value = newLineString;
  loadedRoutes.value.push({pessoaId: person, linestringObj: newLineString});
  map.value?.getLayers().array_.forEach(layer =>{
    if(layer.values_.layerName == 'Layer Stard and End'){
      startPointIconMap.value = layer.getSource().getFeatures()[2];
      startPointIconMap?.value?.setProperties({personId: person});
    }
  });
  allCoordinatesAnimation.value = makeLineString(featureList).getCoordinates();

  let lineLayer :VectorLayer = createNewVectorLayer(featureArray,'Layer das Rotas');
  return lineLayer
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
function drawZone(drawZonePolygon:drawZone){
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
  initializePopup()
});
</script>

<style scoped>
.ol-popup {
  position: absolute;
  background-color: black;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #c1060a;
  min-width: 200px;
  z-index: 10;
  bottom: 12px;
  left: 50px;
  transform: translate(-50%, -100%);
}

.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
  font-size: 1.2em;
}

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