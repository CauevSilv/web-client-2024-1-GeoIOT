<template>
  <div class="container">
    <div class="central">
      <img :src="Logo" class="logo"/>
      <div class="login">
        <div for="email">Email:</div>
        <input
            id="email"
            v-model="emailUser"
            class="text-box"
            placeholder="Digite seu email"
            required
            type="email"
        />
      </div>
      <div class="login">
        <div for="password">Senha:</div>
        <input
            id="password"
            v-model="passwordUser"
            class="text-box"
            placeholder="Digite sua senha"
            required
            type="password"
        />
      </div>
      <div class="login">
        <button class="login_btn" type="submit" @click="loginValidate">Entrar</button>
      </div>
      <footer>
        <div v-if="!loading" class="copyright">
          <p>© 2024 Manolito. Todos os direitos reservados.</p>
        </div>
        <div>
          <Loading v-if="loading"></Loading>
        </div>
      </footer>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {login} from "@/services/api/auth";
import Logo from "@/assets/Logo.png";
import {ref} from "vue";
import router from '@/router'
import Loading from "@/components/Loading.vue";

const emailUser = ref<string>("");
const passwordUser = ref<string>("");
const loading = ref<boolean>(false);
let response;

const loginValidate = async () => {
  loading.value = true;
  await login(emailUser.value, passwordUser.value).then(responsea => {
    response = responsea;
  });
  loading.value = false;
  if (response) {
    router.replace("/home");
  }
}


</script>
<style lang="css" scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

.container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("../assets/MapaBackground.png");
  background-size: cover;
  background-repeat: no-repeat;
  filter: blur(15px);
  z-index: 0;
}

.central {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 480px;
  transform: translate(-50%, -50%);
  z-index: 1;
  background: rgba(0, 0, 0, 0.6);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logo {
  width: 100%;
  height: 10%;
}

.cadastro_btn,
.login_btn {
  font-family: 'Poppins', sans-serif;
  font-size: 15px;
  width: 100%;
  padding: 0.5em 1em;
  background-color: #000059;
  color: white;
  height: 36px;
  border: none;
  border-radius: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-box {
  font-family: 'Poppins', sans-serif;
  width: 100%;
  height: 36px;
  border: none;
  border-radius: 10px;
  padding: 0.5em 1em;
  gap: 0.5em;
}

.login {
  font-family: 'Poppins', sans-serif;
  padding: 0.5em 0;
  font-size: 12px;
  color: white;
  border: none;
  cursor: pointer;
}

.copyright {
  font-family: 'Poppins', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #000059;
  font-size: 13px;
  margin-bottom: 30px;
}
</style>
