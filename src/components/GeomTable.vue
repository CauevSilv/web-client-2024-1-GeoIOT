<script setup lang="ts">

import {zoneOptions} from "@/services/geomService";
import type {ZoneOptions} from "@/services/Types";

const props = defineProps<{
  prop: ZoneOptions[];
 }>();

console.log(props.prop[0])


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
    <tr v-if="props" v-for="i in prop">
      <td>{{ i.label }}</td>
      <td>
        <input type="checkbox"/>
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

td,
th {
  padding: 10px;
  border: 1px solid #ddd;
}
</style>