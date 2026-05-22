
import { Material, PermissionStatus } from '../types';
import { MOCK_MATERIALS } from '../constants';

// Simulation de la Base URL de l'API
const BASE_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Token ${token}` } : {})
    };
};

export const materialService = {
  /**
   * GET /materiels/
   * Liste les matériels avec filtres
   */
  async getMateriels(filters: any = {}): Promise<{ results: Material[], count: number }> {
    const params = new URLSearchParams();
    if (filters.searchInput) params.append('q', filters.searchInput);
    if (filters.categorie && filters.categorie !== 'All') params.append('categorie', filters.categorie);

    const response = await fetch(`${BASE_URL}/materiels/?${params.toString()}`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Erreur lors de la récupération des matériels");
    return response.json();
  },

  async getMaterielDetail(id: number): Promise<Material> {
    const response = await fetch(`${BASE_URL}/materiels/${id}/`, { headers: getHeaders() });
    if (!response.ok) throw new Error("Matériel non trouvé");
    return response.json();
  },

  async createMateriel(data: Partial<Material>): Promise<Material> {
    const response = await fetch(`${BASE_URL}/materiels/ajouter/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erreur lors de l'ajout du matériel");
    return response.json();
  },

  async updateMateriel(id: number, data: Partial<Material>): Promise<Material> {
    const response = await fetch(`${BASE_URL}/materiels/${id}/update/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Erreur lors de la mise à jour");
    return response.json();
  },

  async softDelete(id: number): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/materiels/${id}/delete/`, { method: 'DELETE', headers: getHeaders() });
    return response.ok;
  },

  async restore(id: number): Promise<boolean> {
    const response = await fetch(`${BASE_URL}/materiels/${id}/restore/`, { method: 'POST', headers: getHeaders() });
    return response.ok;
  },

  async exportExcel(data: any[]): Promise<void> {
    const response = await fetch(`${BASE_URL}/materiels/export-excel/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'materiels.xlsx';
      a.click();
    }
  },

  async requestPermission(reason: string): Promise<{ success: boolean }> {
    const response = await fetch(`${BASE_URL}/materiels/demande-permission/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raison: reason }),
    });
    return response.json();
  }
};
