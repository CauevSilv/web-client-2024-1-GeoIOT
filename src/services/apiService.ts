import axios from 'axios';
import type {DrawedGeom} from "@/components/Types";
import {useToast} from "vue-toastification";
import router from '@/router';
import { ref } from 'vue';

const toast = useToast();
const BASE_URL_GEOM = 'http://localhost:8080/location';
const BASE_URL_REGISTER_USER = "http://localhost:8080/auth/signup";

const configHeader =ref<object>( {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

export const registerUser = async(emailUser:string, passwordUser:string, roleUser:string) => {
    try {
        const body = {
            email: emailUser,
            password: passwordUser,
            role: roleUser
        }
        await axios.post(BASE_URL_REGISTER_USER, body, configHeader.value);
    } catch(error) {
        console.log(error);
    }
}

export const saveGeomData = async (drawedGeom : DrawedGeom)=>{
    let postUrl = BASE_URL_GEOM + '/save-shape'
    try{
        const response  = await axios.post(postUrl, drawedGeom, configHeader.value);
        toast.success('Zona de interesse salva!')
        return response.data.content
    } catch (error:any){
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
            throw error;
        }
        if (axios.isAxiosError(error) && error.response) {
            const errorMessage = error.response.data?.message ||
                "Erro ao salvar geometrias.";
        } if(error.code == 'ERR_BAD_RESPONSE'){
            toast.info("BAD_RESPONSE.");
        }
        else {
            toast.error("Erro na conexão. Tente novamente mais tarde.");
        }
        return null;
    }
}

export const fetchAllZones = async ()=>{
    let getUrl = BASE_URL_GEOM+`/get-all-shapes`
    try{
        const response = await axios.get(getUrl, configHeader.value);
        return response.data;
    } catch (error) {
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
            throw error;
        }
        if(error.status == 404){
            console.error("Nenhuma geometria encontrada:", error);
            throw error;

        }
        if (axios.isAxiosError(error) && error.response) {
            const errorMessage = error.response.data?.message ||
                "Erro desconhecido ao buscar pontos.";
        } if(error.code == 'ERR_BAD_RESPONSE'){
            toast.info("Nenhum ponto encontrado para o filtro selecionado.");
        }
        else {
            toast.error("Erro na conexão. Tente novamente mais tarde.");
        }
        return [];
    }
}
