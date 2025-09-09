import axios from "axios";
import { useAuthStore } from '@/stores/authStore';
import {useToast} from "vue-toastification";
const toast = useToast();


const BASE_URL_LOGIN = "http://server_4sem:8080/auth/login";

export const login = async (emailUser: string, passwordUser: string) => {
    const authStore = useAuthStore();

    try {
        authStore.isLoading = true;

        const body = {
            email: emailUser,
            password: passwordUser
        };

        const request = await axios.post(BASE_URL_LOGIN, body);

        if (request.data.token) {
            localStorage.clear();

            localStorage.setItem("token", request.data.token);

            const decodedToken = JSON.parse(atob(request.data.token.split(".")[1]));
            localStorage.setItem("role", decodedToken.role);

            authStore.setUser({
                email: emailUser,
                role: decodedToken.role,
                token: request.data.token
            });

            authStore.isLoading = false;
            return true;
        }

        authStore.isLoading = false;
        return false;

    } catch (error) {
        authStore.isLoading = false;

        if (axios.isAxiosError(error) && error.response) {
            toast.error("email ou senha inválidos");
            return false;
        }

        return false;
    }
};