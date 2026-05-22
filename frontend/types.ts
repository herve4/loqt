
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  EVENTS = 'EVENTS',
  INVENTORY = 'INVENTORY',
  MAP = 'MAP',
  CHURCHES = 'CHURCHES',
  SETTINGS = 'SETTINGS'
}

export type PermissionStatus = 'none' | 'en_attente' | 'approuvee' | 'refusee';

export interface UserPermissions {
  groups: string[];
  permissions: string[];
  can_add_material: boolean;
  material_permission_status: PermissionStatus | null;
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  eglise?: number;
  role?: string;
  groups: string[];
  permissions: string[];
  can_add_material: boolean;
  material_permission_status: PermissionStatus | null;
}

export interface Categorie {
  id: number;
  nom: string;
  description?: string;
}

export interface SousCategorie {
  id: number;
  nom: string;
}

export interface Eglise {
  id: number;
  nom: string;
  ville?: string;
  region?: string;
}

export interface Logistique {
  id: number;
  responsable: string;
}

export interface MaterialImage {
  id: number;
  image: string;
  description?: string;
}

export interface Material {
  id: number;
  nom: string;
  categorie: Categorie;
  sous_categorie?: SousCategorie;
  quantite: number;
  eglise: Eglise;
  logistique?: Logistique;
  description?: string;
  images_materiel: MaterialImage[];
  qr_code?: string;
  code_barre?: string;
  is_deleted: boolean;
  deletedAt?: string;
  created_at: string;
  updated_at: string;
}

export interface EventLogistics {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location: string;
  status: 'planned' | 'ongoing' | 'completed' | 'cancelled';
  materials: string[]; 
  attendees: number;
  description: string;
}

export interface Church {
  id: string;
  name: string;
  city: string;
  region: string;
  pastor: string;
  memberCount: number;
  logisticsLead: string;
}

export interface City {
  name: string;
  region: string;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  time: string;
  read: boolean;
}
