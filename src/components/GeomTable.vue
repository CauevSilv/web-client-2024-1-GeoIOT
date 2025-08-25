<script setup lang="ts">
import { ref } from 'vue'
import {drawedGeomsFromDb, zoneOptions} from "@/services/geomService";
import type { ZoneOptions } from "@/components/Types";

const emit = defineEmits(['drawGeomFromGeomTable'])

const props = defineProps<{
  prop: ZoneOptions[];
}>();

const selectedZones = ref<{[key: string]: boolean}>({});

const toggleGeometry = (zoneId: number, isChecked: boolean) => {
  selectedZones.value[zoneId] = isChecked;
  const geometry = drawedGeomsFromDb.find(geom => geom.gid === zoneId);
  emit('drawGeomFromGeomTable', geometry);
};

props.prop.forEach(zone => {
  selectedZones.value[zone.id || zone.label] = false;
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
    <tr v-if="props.prop && props.prop.length" v-for="zone in prop" :key="zone.id || zone.label">
      <td>{{ zone.label }}</td>
      <td>
        <label class="toggle-switch">
          <input
              type="checkbox"
              @change="toggleGeometry(zone.value, ($event.target as HTMLInputElement).checked)"
          />
          <span class="slider"></span>
        </label>
      </td>
    </tr>
    </tbody>
  </table>
</template>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background-color: #f0f0f0;
  text-align: left;
}

td, th {
  padding: 10px;
  border: 1px solid #ddd;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:checked + .slider:before {
  transform: translateX(26px);
}
</style>