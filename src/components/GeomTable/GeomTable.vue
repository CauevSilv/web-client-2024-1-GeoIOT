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
  const geometry = drawedGeomsFromDb.find(geom => geom.gid === zoneId);
  if (geometry?.active) {
    geometry!.active = true;
  } else {
    geometry!.active = false;
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