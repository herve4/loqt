
const BASE_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Token ${token}` } : {})
    };
};

export const eventService = {
    async getEvents(filters: any = {}): Promise<any> {
        const params = new URLSearchParams();
        if (filters.type_evenement) params.append('type_evenement', filters.type_evenement);
        if (filters.statut) params.append('statut', filters.statut);

        const response = await fetch(`${BASE_URL}/events/?${params.toString()}`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Erreur lors de la récupération des événements");
        return response.json();
    },

    async getUpcomingEvents(): Promise<any[]> {
        const response = await fetch(`${BASE_URL}/events/upcoming/`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Erreur lors de la récupération des événements à venir");
        const data = await response.json();
        return Array.isArray(data) ? data : data.results || [];
    },

    async getEventDetail(id: number): Promise<any> {
        const response = await fetch(`${BASE_URL}/events/${id}/`, { headers: getHeaders() });
        if (!response.ok) throw new Error("Événement non trouvé");
        return response.json();
    },

    async createEvent(data: any): Promise<any> {
        const response = await fetch(`${BASE_URL}/events/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Erreur lors de la création de l'événement");
        return response.json();
    },

    async updateEvent(id: number, data: any): Promise<any> {
        const response = await fetch(`${BASE_URL}/events/${id}/`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Erreur lors de la mise à jour");
        return response.json();
    },

    async deleteEvent(id: number): Promise<boolean> {
        const response = await fetch(`${BASE_URL}/events/${id}/`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        return response.ok;
    }
};
