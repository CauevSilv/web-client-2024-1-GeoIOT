import { useAuthStore } from '@/stores/authStore';
import {login} from "@/services/api/auth";

export const useAuth = () => {
    const authStore = useAuthStore();

    return {
        user: authStore.user,
        isAuthenticated: authStore.isAuthenticated,
        isLoading: authStore.isLoading,

        getUserRole: authStore.getUserRole,
        getToken: authStore.getToken,

        login,
        logout: authStore.clearUser,
        checkAuthStatus: authStore.checkAuthStatus
    };
};