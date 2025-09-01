<template>
  <div class="mapWrapper">
    <div id="formsBackground" class="formsBackground">
      <img :src="Logo"/>
      <div class="login">
        <label for="email">Email:</label>
        <input id="email" v-model="email" class="input" placeholder="Digite seu email" required type="email">
        <p v-show="errorEmail" style="color:red;margin: 0;padding: 0;">{{ "Por favor, coloque um e-mail válido." }}</p>
      </div>

      <div class="login">
        <label for="senha">Senha:</label>
        <input id="senha" v-model="password" class="input" placeholder="Digite sua senha" required type="password">
        <p v-show="errorPassword" style="color:red;margin: 0;padding: 0;">{{ "Por favor, coloque uma senha." }}</p>
      </div>

      <div class="login">
        <label for="confirmar_senha">Confirme sua senha:</label>
        <input id="confirmar_senha" v-model="confirmPassword" class="input" placeholder="Confirme sua senha" required
               type="password">
        <p v-show="errorConfirmPassword" style="color:red;margin: 0;padding: 0;">{{
            "Por favor, confirme a senha."
          }}</p>
      </div>

      <div class="groupBtns">
        <div class="adminBtn">
          <input v-model="option" type="radio" value="ADMIN">
          <label>Administrador</label>
        </div>

        <div class="commonBtn">
          <input v-model="option" type="radio" value="USER">
          <label>Comum</label>
        </div>

        <p v-show="errorOption" style="color:red;margin: 0;padding: 0;">{{
            "Por favor, selecione o nível de acesso."
          }}</p>

      </div>
      <div class="submitGroup">
        <button id="backBtn" class="backBtn" @click="returnHome"> <</button>

        <button id="submitBtn" class="submitBtn" type="submit" @click="submitUser"> Cadastrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import router from '@/router'
import {ref} from 'vue';
import Logo from "@/assets/Logo.png";
import {useToast} from "vue-toastification";
import {darkModeClick} from '@/components/stores/StoreDarkModeGetClick.js';
import {registerUser} from "@/services/apiService.ts";

const toast = useToast();
const email = ref("");
const password = ref("");
const confirmPassword = ref("")
const option = ref("");
const errorEmail = ref(false);
const errorPassword = ref(false);
const errorConfirmPassword = ref(false);
const errorOption = ref(false);
const store = darkModeClick();

const returnHome = () => {
  router.push("/home");
}

async function submitUser() {
  const response = await verifyIfHaveTwoEmails(email.value);

  errorEmail.value = false;
  errorPassword.value = false;
  errorConfirmPassword.value = false;
  errorOption.value = false;

  if (!email.value) {
    errorEmail.value = true;
  }
  if (!password.value) {
    errorPassword.value = true;
  }
  if (!confirmPassword.value) {
    errorConfirmPassword.value = true;
  }
  if (!option.value) {
    errorOption.value = true;
  } else if (!(email.value.match("@"))) {
    toast.error("Coloque um e-mail válido!")
  } else if (password.value != confirmPassword.value) {
    toast.error("As senhas não conferem.");
  } else if (response.emailExist) {
    toast.error("O usuário já está cadastrado.");
  } else {
    await registerUser(email.value,
        password.value,
        option.value
    )
    toast.success("Usuário Cadastrado!");

    email.value = "";
    password.value = "";
    confirmPassword.value = "";
    option.value = "";
  }
}

</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

.mapWrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.login {
  font-family: 'Poppins', sans-serif;
  padding: 0.5em 0;
  font-size: 12px;
  color: white;
  border: none;
  cursor: pointer;
}

.mapWrapper::before {
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

.formsBackground {
  font-family: 'Poppins', sans-serif;
  position: absolute;
  color: white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 480px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1;
  font-size: 12px;
  padding: 2em;
}


.input {
  width: 100%;
  height: 36px;
  border: none;
  border-radius: 10px;
  padding: 0.5em 1em;
}

.adminBtn,
.commonBtn {
  display: flex;
  gap: 0.5em;
}

.backBtn,
.submitBtn {
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Poppins', sans-serif;
  font-size: 15px;
  color: white;
  background-color: #000059;
  border: none;
  border-radius: 10px;
  height: 36px;
  padding: 0.5em 1em;
  cursor: pointer;
}

.submitBtn {
  width: 100%;
  height: 2.6em;
}

.backBtn {
  width: 4.5em;
  height: 2.6em;
}

.groupBtns {
  display: flex;
  gap: 1em;
  margin-top: 1em;
  font-weight: bold;
  font-family: 'Poppins', sans-serif;
  color: white;
  justify-content: left;
  align-items: center;
}

.submitGroup {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

input[type="radio"] {
  accent-color: #000059;
}
</style>


  