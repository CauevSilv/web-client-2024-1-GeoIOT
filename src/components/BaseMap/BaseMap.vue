<template>
  <div class="map-wrapper">
    <GeoFilterView class="filter-overlay"
                   @saveDraw="saveGeometry"
                   @toggleDrawing="toggleDrawing"
                   @drawZone="drawZone"
    />

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
import './BaseMap.css'
import {onMounted, ref} from 'vue';
import {Feature, Map} from 'ol';
import {Vector as VectorSource} from 'ol/source';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {type Geometry, type Polygon} from 'ol/geom';
import {Fill, Stroke, Style} from 'ol/style';
import GeoFilterView from "@/views/GeoFilterView.vue";
import type {Coordinate} from 'ol/coordinate';
import {useToast} from "vue-toastification";
import {boundingExtent} from 'ol/extent';
import {
  saveGeomData
} from "@/services/apiService";
import {createMap, createNewVectorLayer} from "@/services/mapService";
import {Draw} from "ol/interaction";
import {
  convertToDrawedGeom, drawedGeomsFromDb,
  drawingActive, drawLayer, fetchGeoms,
  makeFeature, map
} from "@/services/geomService";
import {WKT} from "ol/format";
import {forEach} from "ol/geom/flat/segments";

let center = ref([-60.457873,0.584053]);
let projection = ref("EPSG:4326");
let zoom = ref(5);
let source = ref<VectorSource>();
let draw = ref<Draw | null>(null);
let drawType = ref('Polygon');
let drawGeomName = ref<string>();

const iconOpacity = ref(1);

function saveGeometry() {
  map.value?.getAllLayers().forEach(layer => {
    if (layer.getProperties().layerName == 'Draw Layer') {
      layer.values_.source.getFeatures().forEach((feature: Feature) => {
          saveGeomData(convertToDrawedGeom(feature, drawGeomName.value!)).then( ()=> {
            fetchGeoms();
          })
      });
    }
  })
}

const adjustMap = (drawedZone?:Geometry) => {
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
}
function startDrawing() {
  if (!map.value){
    return;
  } else {
    if (!drawLayer.value){
      drawLayer.value = createNewVectorLayer(undefined, 'Draw Layer', source.value);
    }
    drawingActive.value = true;
    draw.value = new Draw({
      source: source.value,
      stopClick: true,
      type: drawType.value as 'Polygon',
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
}
function stopDrawing() {
  if (draw.value && map.value) {
    map.value.removeInteraction(draw.value);
    draw.value = null;
    drawingActive.value = false;
  }
}
function centerMap() {
  if (map.value) {
    const defaultCenter = [-60.457873, 0.584053];
    let coordinates:Coordinate[] = [];
    coordinates.push(defaultCenter)
    const defaultZoom = 5;
    map.value?.getView().setCenter(defaultCenter);
    map.value?.getView().setZoom(defaultZoom);
    }
}

function drawZone(){
  const wkt = new WKT();
  const featureArray:Feature[] = [];
  const geometries:Geometry[] = [];
  drawedGeomsFromDb.forEach(dbgeom => {
    if(dbgeom.active){
      geometries.push(wkt.readGeometry(dbgeom.geomwkt))
    }
  })
  let newFeature:Feature = makeFeature(geometries,90)!;
  featureArray.push(newFeature);
  let newVectorLayer:VectorLayer = createNewVectorLayer(featureArray,'Layer das Zonas')!;
  map.value?.getLayers().array_.forEach((layer) =>{
    if(layer.values_.layerName == 'Layer das Zonas')
    map.value?.removeLayer(layer);
  });
  map.value?.addLayer(newVectorLayer);
  adjustMap(geometries[0]);
}

onMounted(() => {
  map.value = createMap(center.value, zoom.value, projection.value);
  source.value = new VectorSource();
});
</script>