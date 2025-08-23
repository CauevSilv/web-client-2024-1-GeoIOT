import { defineStore } from 'pinia';
import { ref } from 'vue';

interface User {
    email: string;
    role: string;
    token: string;
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const isAuthenticated = ref(false);
    const isLoading = ref(false);

    const getUserRole = () => user.value?.role || '';
    const getToken = () => user.value?.token || '';

    const setUser = (userData: User) => {
        user.value = userData;
        isAuthenticated.value = true;
    };

    const clearUser = () => {
        user.value = null;
        isAuthenticated.value = false;
        localStorage.clear();
    };

    const checkAuthStatus = () => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');

        if (token && role) {
            user.value = {
                token,
                role,
                email: ''
            };
            isAuthenticated.value = true;
        }
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        getUserRole,
        getToken,
        setUser,
        clearUser,
        checkAuthStatus
    };
});