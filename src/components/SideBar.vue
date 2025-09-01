<template>
  <div class="sidebar">
    <button v-if="roleValue == EnumRole.ADMIN" class="int-btn" @click="onToggleZone">
      <IconAlert />
    </button>
    <button v-if="roleValue == EnumRole.ADMIN" class="int-btn" @click="onRegisterUser">
      <IconRegistrationUser />
    </button>
    <button  class="int-btn" @click="logout">
      <IconLogout />
    </button>
  </div>
</template>

<script setup lang="ts">
import router from '@/router'
import { getClick } from '@/components/stores/StoreGetClick.js'
import IconAlert from './icons/IconInterestZone.vue';
import { onMounted, ref } from 'vue';
import { EnumRole } from '@/utils/EnumRole';
import IconLogout from './icons/IconLogout.vue';
import IconRegistrationUser from './icons/IconRegistrationUser.vue';
const roleValue = ref<string>("");

const storeFilters = getClick();

const emit = defineEmits(['toggle-filters', 'toggle-zone', 'logout']);
const props = defineProps({
  showFilters: Boolean,
  showZone: Boolean
});

function onToggleFilters() {
  emit('toggle-filters')
}

function onToggleZone() {
  emit('toggle-zone');
}

function onRegisterUser() {
  router.replace("/cadastro")
}

const logout = () => {
  emit('logout');
}

onMounted(()=>{
  const roleInMemory = localStorage.getItem("role");
  if(roleInMemory){
    roleValue.value = roleInMemory;
  }
})
</script>

<style scoped>
.sidebar {
  display: grid;
  grid-template-rows: repeat(auto, 100%);
}

.toggle-btn, .int-btn {
  background-color: transparent;
  padding: 0;
  border-color: transparent;
}

.int-btn:hover, .toggle-btn:hover {
  transform: scale(1.1);
  transition: transform 0.3s ease-in-out;
}
</style>
