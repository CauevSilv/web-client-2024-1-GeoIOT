<script setup lang="ts">
import type {TableProps} from "@/components/Types";
import Tab from "primevue/tab";
import {ref} from "vue";

const props = defineProps<{
  TablePropsProp: TableProps;
 }>();


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
    <tr v-on:load="console.log(props)" v-if="props" v-for="(header, index) in props.TablePropsProp.headers" :key="index">
      <td>{{ header }}</td>
      <td>
<!--        <input type="checkbox" v-model="item.selecionado" />-->
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