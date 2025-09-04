<script setup lang="ts">
import './GeomTable.css'
import { ref } from 'vue'
import {drawedGeomsFromDb, zoneOptions} from "@/services/geomService";
import type { ZoneOptions } from "@/components/Types";

const emit = defineEmits(['drawGeomFromGeomTable'])

const props = defineProps<{
  prop: ZoneOptions[];
}>();

const selectedZones = ref<{[key: string]: boolean}>({});

const toggleGeometry = (zoneId: number) => {
  let geometryIndex = drawedGeomsFromDb.findIndex(geom => geom.gid === zoneId);
  console.log(zoneId);
  if (geometryIndex !== -1) {
    const geometry = drawedGeomsFromDb[geometryIndex];
    if (geometry.active === undefined || !geometry.active) {
      drawedGeomsFromDb.splice(geometryIndex, 1);
      geometry.active = true;
      drawedGeomsFromDb.push(geometry);
    } else {
      drawedGeomsFromDb.splice(geometryIndex, 1);
      geometry.active = false;
      drawedGeomsFromDb.push(geometry);
    }
  }
  emit('drawGeomFromGeomTable');
};

props.prop.forEach(zone => {
  selectedZones.value[zone.value || zone.label] = false;
});
</script>

<template>
  <table border="1" cellspacing="0" cellpadding="8">
    <thead>
    <tr>
      <th>Nome</th>
      <th>Selecionado</th>
    </tr>
    </thead>
    <tbody>
    <tr v-if="props.prop && props.prop.length" v-for="zone in prop" :key="zone.value">
      <td>{{ zone.label }}</td>
      <td>
        <label class="toggle-switch">
          <input
              type="checkbox"
              @change="toggleGeometry(zone.value)"
          />
          <span class="slider"></span>
        </label>
      </td>
    </tr>
    </tbody>
  </table>
</template>