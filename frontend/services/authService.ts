
const BASE_URL = '/api';

export interface AuthUser {
    token: string;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    is_staff: boolean;
    eglise?: number;
    role?: string;
    user_id?: number;
    groups?: string[];
    permissions?: string[];
    can_add_material?: boolean;
    material_permission_status?: string | null;
}

export const authService = {
    async login(credentials: { username: string; password: string }): Promise<AuthUser> {
        const response = await fetch(`${BASE_URL}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.non_field_errors?.[0] || 'Erreur d\'authentification');
        }

        const data = await response.json();
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        return data;
    },

    async register(data: any): Promise<AuthUser> {
        const response = await fetch(`${BASE_URL}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(JSON.stringify(errorData) || 'Erreur lors de l\'inscription');
        }

        const userData = await response.json();
        localStorage.setItem('auth_token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
    },

    async logout(): Promise<void> {
        const token = this.getToken();
        if (token) {
            try {
                await fetch(`${BASE_URL}/user/logout/`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                });
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
            }
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },

    async getCurrentUserProfile(): Promise<AuthUser | null> {
        const token = this.getToken();
        if (!token) return null;
        
        try {
            const response = await fetch(`${BASE_URL}/user/profile/`, {
                method: 'GET',
                headers: this.getAuthHeaders(),
            });
            
            if (!response.ok) {
                return null;
            }
            
            return response.json();
        } catch {
            return null;
        }
    },

    getCurrentUser(): AuthUser | null {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    },

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    },

    getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Token ${token}` } : {};
    },

    async syncUserPermissions(): Promise<AuthUser | null> {
        const user = this.getCurrentUser();
        if (!user) return null;

        try {
            const profile = await this.getCurrentUserProfile();
            if (profile) {
                // Update user in localStorage with latest permissions
                localStorage.setItem('user', JSON.stringify(profile));
                return profile;
            }
        } catch (error) {
            console.error('Error syncing permissions:', error);
        }
        return user;
    }
};
