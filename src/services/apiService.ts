import axios from 'axios';
import type {DrawedGeom, GeometryPoint, Pessoa, StopPoint} from "@/components/Types";
import {useToast} from "vue-toastification";
import router from '@/router';
import { ref } from 'vue';

const toast = useToast();
const BASE_URL_MOCKED = 'https://gist.githubusercontent.com/pauloarantesmachado/e1dae04eaf471fcf13e76488c1b9051d/raw/6addd4c29581aa372e8fa8df1670c99104816d9f/gistfile1.json';
const BASE_URL_ENDPOINT = 'http://localhost:8080';
const BASE_URL_GEOM = 'http://localhost:8080/location';
const BASE_URL_PERSON = 'http://localhost:8080/person';
const BASE_URL_LOGIN = "http://localhost:8080/auth/login";
const BASE_URL_REGISTER_USER = "http://localhost:8080/auth/signup";

const configHeader =ref<object>( {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});

interface Person {
    idPerson: number;
    fullName: string;
    codeDevice?: string;
}

interface Device {
    label: string;
    value: number;
}

export const verifyIfHaveTwoEmails = async(emailUser:string) => {
    try {
        const response = await axios.get(`http://localhost:8080/auth/get-user/${emailUser}`, configHeader.value);
        return response.data;
    } catch(error) {
        console.log(error);
    }
}

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

export const fetchPersons = async (): Promise<Person[]> => {
    try {
        const response = await axios.get<Person[]>(BASE_URL_PERSON, configHeader.value);
        return response.data.sort((a, b) => {
            if (a.fullName < b.fullName) return -1;
            if (a.fullName > b.fullName) return 1;
            return 0;
        });
    } catch (error) {
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
            throw error;
        }
        console.error("Erro ao buscar pessoas:", error);
        throw error;
    }
};

export const fetchDevices = async (): Promise<Device[]> => {
    try {
        const response = await axios.get<Person[]>(BASE_URL_ENDPOINT +'/person', configHeader.value);
        const devices: Device[] = response.data.flatMap(person => {
            return person.codeDevice
                ? [{ label: person.codeDevice, value: person.idPerson }]
                : [];
        });

        return devices.filter((device, index, self) =>
            index === self.findIndex(d => d.label === device.label)
        );
    } catch (error) {
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
            throw error;
        }
        console.error("Erro ao buscar dispositivos:", error);
        throw error;
    }
};
export const fetchStopPoints = async ( person, startDate, endDate, page: number):StopPoint[]=>{
    let getUrl = `http://localhost:8080/tracker/stop/${person}/${startDate}T00:00:00.000/${endDate}T00:00:00.000?page=${page}&size=500`;
    try {
        const response = await axios.get(getUrl, configHeader.value);
        if (response.data && response.data.content.length === 0) {
            toast.info("Nenhum ponto encontrado para o filtro selecionado.");
            return [];
        }
        return response.data.content;
    } catch (error:any) {
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
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
export const fetchHistory = async ( person:String, startDate:String, endDate:String, page:Number)=>{
    let urlHistory = `http://localhost:8080/tracker/history?page=${page}&size=${100}`
    try {
        const body = {
            personId: person,
            init: `${startDate}T23:59:59`,
            end: `${endDate}T23:59:59`
        }
        const response = await axios.post(urlHistory, body, configHeader.value);
        return response.data;
    } catch (error:any) {
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
            throw error;
        }
        console.error("Erro ao buscar dispositivos:",error);
        throw error;
    }
}

export const fetchGeomData = async ( person, startDate, endDate, page: number)=>{
    let getUrl = `http://localhost:8080/tracker/period/${person}/${startDate}T00:00:00.000/${endDate}T00:00:00.000?page=${page}&size=500`;
    try {
        const response = await axios.get(getUrl,configHeader.value);
        if (response.data && response.data.content.length === 0) {
            toast.info("Nenhum ponto encontrado para o filtro selecionado.");
            return [];
        }
        return response.data.content;
    } catch (error:any) {
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
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
export const fetchGeomInZoneByUser = async ( location, startDate, endDate, userId)=>{
    let getUrl = BASE_URL_GEOM+`/inside/${location}/${startDate}T00:00:00.000/${endDate}T00:00:00.000?userId=${userId}`;
    try {
        const response = await axios.get(getUrl, configHeader.value);
        if (response.data && response.data.content.length === 0) {
            toast.info("Nenhum ponto encontrado para o filtro selecionado.");
            return [];
        }
        return response.data.content;
    } catch (error:any) {
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
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
export const fetchGeomDataWithinZone = async (startDate, endDate, zoneId:number):[]=>{
    let getUrl = `http://localhost:8080/tracker/inside/${zoneId}/${startDate}T00:00:00.000/${endDate}T00:00:00.000`;
    try {
        const response = await axios.get(getUrl, configHeader.value);
        if (response.data && response.data.length === 0) {
            toast.info("Nenhum ponto encontrado para o filtro selecionado.");
            return [];
        }
        return response.data;
    } catch (error) {
        if(error.status == 403){
            router.replace("/login");
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
export const fetchPersonById = async(personID:number|undefined)=>{
    let getUrl = BASE_URL_PERSON + '/' +personID;
    try{
        const response = await axios.get(getUrl, configHeader.value);
        return response.data;
    }catch(error){
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
            throw error;
        }
        if (axios.isAxiosError(error) && error.response) {
            toast.error("Erro na conexão. Tente novamente mais tarde.");
        }
    }
}
export const deleteZoneByGid = async(gid:number):Pessoa=>{
    let getUrl = BASE_URL_GEOM + '/delete/' + gid;
    try{
        const response = await axios.delete(getUrl, configHeader.value);
        return response.data;
    }catch(error){
        if(error.status == 403){
            console.error("Acesso Negado:", error);
            router.replace("/login");
            throw error;
        }
        if (axios.isAxiosError(error) && error.response) {
            toast.error("Erro na conexão. Tente novamente mais tarde.");
        }
    }
}

export const login = async(emailUSer:string, passwordUser:string) => {
    try{
        const body = {
            email: emailUSer,
            password:passwordUser
        }
        const request = await axios.post(BASE_URL_LOGIN, body);
        localStorage.clear();
        localStorage.setItem("token", request.data.token);
        const valorToken = localStorage.getItem("token");
        if(valorToken != "" && valorToken != null){
            const decodedToken = JSON.parse(atob(valorToken.split(".")[1]));
            localStorage.setItem("role", decodedToken.role);
            return true;
        }
        return false;

    }catch(error){
        if (axios.isAxiosError(error) && error.response) {
            toast.error("email ou senha inválidos");
            return false;
        }}
}