import { User, UserPermissions, PermissionStatus } from '../types';

const BASE_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {})
  };
};

export const permissionService = {
  /**
   * Get current user's permission status from backend
   */
  async getPermissionStatus(): Promise<{
    has_permission: boolean;
    status: PermissionStatus | null;
    id?: number;
  }> {
    const response = await fetch(`${BASE_URL}/materiels/permission_status/`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch permission status');
    }
    return response.json();
  },

  /**
   * Submit a permission request to add materials
   */
  async requestMaterialPermission(raison: string): Promise<{
    id: number;
    status: PermissionStatus;
    message: string;
  }> {
    const response = await fetch(`${BASE_URL}/materiels/permission_request/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ raison })
    });
    if (!response.ok) {
      throw new Error('Failed to submit permission request');
    }
    return response.json();
  },

  /**
   * Get all pending permission requests (admin only)
   */
  async getPendingRequests(): Promise<Array<{
    id: number;
    user__id: number;
    user__email: string;
    user__first_name: string;
    user__last_name: string;
    raison: string;
    created_at: string;
  }>> {
    const response = await fetch(`${BASE_URL}/materiels/pending_requests/`, {
      headers: getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to fetch pending requests');
    }
    return response.json();
  },

  /**
   * Approve a permission request (admin only)
   */
  async approveMaterialPermission(demandeId: number): Promise<{
    message: string;
    id: number;
    user_id: number;
  }> {
    const response = await fetch(`${BASE_URL}/materiels/approve_request/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ demande_id: demandeId })
    });
    if (!response.ok) {
      throw new Error('Failed to approve permission request');
    }
    return response.json();
  },

  /**
   * Check if user has a specific permission
   */
  hasPermission(user: User, permission: string): boolean {
    if (!user) return false;
    if (user.is_staff) return true;
    return user.permissions.includes(permission);
  },

  /**
   * Check if user is in a specific group
   */
  isInGroup(user: User, groupName: string): boolean {
    if (!user) return false;
    return user.groups.includes(groupName);
  },

  /**
   * Check if user can add materials
   */
  canAddMaterial(user: User): boolean {
    if (!user) return false;
    return user.can_add_material || user.is_staff;
  },

  /**
   * Check if user can view/manage all users (admin)
   */
  isAdmin(user: User): boolean {
    if (!user) return false;
    return user.is_staff || user.groups.includes('Admin');
  },

  /**
   * Check if user is a logistician
   */
  isLogistician(user: User): boolean {
    if (!user) return false;
    return user.groups.includes('Responsable Logistique');
  },

  /**
   * Check if user is a pastor
   */
  isPastor(user: User): boolean {
    if (!user) return false;
    return user.groups.includes('Pasteur');
  },

  /**
   * Get permission status in human-readable format
   */
  getPermissionStatusLabel(status: PermissionStatus | null | undefined): string {
    switch (status) {
      case 'approuvee':
        return 'Approuvée';
      case 'en_attente':
        return 'En attente';
      case 'refusee':
        return 'Refusée';
      case null:
      case undefined:
      case 'none':
        return 'Non demandée';
      default:
        return 'Inconnu';
    }
  }
};
