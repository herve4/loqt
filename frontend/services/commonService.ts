
import { Material, Categorie, SousCategorie, Eglise } from '../types';

const BASE_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Token ${token}` } : {})
    };
};

export const commonService = {
    async getCategories(): Promise<Categorie[]> {
        const response = await fetch(`${BASE_URL}/categories/`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Erreur lors de la récupération des catégories");
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || [];
    },

    async getSousCategories(): Promise<SousCategorie[]> {
        const response = await fetch(`${BASE_URL}/sous-categories/`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Erreur lors de la récupération des sous-catégories");
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || [];
    },

    async getEglises(): Promise<Eglise[]> {
        const response = await fetch(`${BASE_URL}/eglises/`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Erreur lors de la récupération des églises");
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || [];
    },

    async getVilles(): Promise<any[]> {
        const response = await fetch(`${BASE_URL}/villes/`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Erreur lors de la récupération des villes");
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || [];
    },

    async getRegions(): Promise<any[]> {
        const response = await fetch(`${BASE_URL}/regions/`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Erreur lors de la récupération des régions");
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || [];
    }
};
