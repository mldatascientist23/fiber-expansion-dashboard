/**
 * API client for the GVTC Fiber Expansion Platform
 */
import axios from 'axios';
import type {
  User,
  AuthToken,
  LoginRequest,
  Property,
  PropertyListItem,
  PropertyCreate,
  PropertyUpdate,
  PropertyStats,
  Organization,
  OrganizationCreate,
  Contact,
  ContactCreate,
  PropertyContact,
  PropertyOrganization,
  Document,
  PropertyCost,
  PropertyCostUpdate,
  ImportJob,
  PropertyFilter,
} from './types';

const API_BASE = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ Auth ============

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthToken> => {
    const response = await api.post<AuthToken>('/auth/login', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  initAdmin: async (): Promise<{ message: string; email: string }> => {
    const response = await api.post('/auth/init-admin');
    return response.data;
  },
};

// ============ Properties ============

export const propertiesApi = {
  list: async (filter?: PropertyFilter): Promise<PropertyListItem[]> => {
    const response = await api.get<PropertyListItem[]>('/properties', { params: filter });
    return response.data;
  },

  get: async (id: number): Promise<Property> => {
    const response = await api.get<Property>(`/properties/${id}`);
    return response.data;
  },

  create: async (data: PropertyCreate): Promise<Property> => {
    const response = await api.post<Property>('/properties', data);
    return response.data;
  },

  update: async (id: number, data: PropertyUpdate): Promise<Property> => {
    const response = await api.patch<Property>(`/properties/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/properties/${id}`);
  },

  getStats: async (): Promise<PropertyStats> => {
    const response = await api.get<PropertyStats>('/properties/stats');
    return response.data;
  },

  getCounties: async (): Promise<{ county: string; count: number }[]> => {
    const response = await api.get('/properties/counties');
    return response.data;
  },

  recalculateScore: async (id: number): Promise<Property> => {
    const response = await api.post<Property>(`/properties/${id}/recalculate-score`);
    return response.data;
  },

  getScoreBreakdown: async (id: number): Promise<any> => {
    const response = await api.get(`/properties/${id}/score-breakdown`);
    return response.data;
  },

  recalculateAll: async (): Promise<{ message: string }> => {
    const response = await api.post('/properties/recalculate-all');
    return response.data;
  },
};

// ============ Organizations ============

export const organizationsApi = {
  list: async (params?: { org_type?: string; search?: string }): Promise<Organization[]> => {
    const response = await api.get<Organization[]>('/organizations', { params });
    return response.data;
  },

  get: async (id: number): Promise<Organization> => {
    const response = await api.get<Organization>(`/organizations/${id}`);
    return response.data;
  },

  create: async (data: OrganizationCreate): Promise<Organization> => {
    const response = await api.post<Organization>('/organizations', data);
    return response.data;
  },

  update: async (id: number, data: Partial<OrganizationCreate>): Promise<Organization> => {
    const response = await api.patch<Organization>(`/organizations/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/organizations/${id}`);
  },
};

// ============ Contacts ============

export const contactsApi = {
  list: async (params?: { organization_id?: number; search?: string }): Promise<Contact[]> => {
    const response = await api.get<Contact[]>('/contacts', { params });
    return response.data;
  },

  get: async (id: number): Promise<Contact> => {
    const response = await api.get<Contact>(`/contacts/${id}`);
    return response.data;
  },

  create: async (data: ContactCreate): Promise<Contact> => {
    const response = await api.post<Contact>('/contacts', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ContactCreate>): Promise<Contact> => {
    const response = await api.patch<Contact>(`/contacts/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/contacts/${id}`);
  },

  // Property-Contact links
  getPropertyContacts: async (propertyId: number): Promise<PropertyContact[]> => {
    const response = await api.get<PropertyContact[]>(`/properties/${propertyId}/contacts`);
    return response.data;
  },

  linkToProperty: async (
    propertyId: number,
    contactId: number,
    role?: string,
    strength?: number
  ): Promise<void> => {
    await api.post(`/properties/${propertyId}/contacts/${contactId}`, null, {
      params: { relationship_role: role, relationship_strength: strength },
    });
  },

  unlinkFromProperty: async (propertyId: number, contactId: number): Promise<void> => {
    await api.delete(`/properties/${propertyId}/contacts/${contactId}`);
  },

  // Property-Organization links
  getPropertyOrganizations: async (propertyId: number): Promise<PropertyOrganization[]> => {
    const response = await api.get<PropertyOrganization[]>(`/properties/${propertyId}/organizations`);
    return response.data;
  },

  linkOrgToProperty: async (
    propertyId: number,
    orgId: number,
    role?: string,
    isPrimary?: boolean
  ): Promise<void> => {
    await api.post(`/properties/${propertyId}/organizations/${orgId}`, null, {
      params: { role, is_primary: isPrimary },
    });
  },

  unlinkOrgFromProperty: async (propertyId: number, orgId: number): Promise<void> => {
    await api.delete(`/properties/${propertyId}/organizations/${orgId}`);
  },
};

// ============ Documents ============

export const documentsApi = {
  list: async (params?: {
    property_id?: number;
    document_type?: string;
    search?: string;
  }): Promise<Document[]> => {
    const response = await api.get<Document[]>('/documents', { params });
    return response.data;
  },

  getPropertyDocuments: async (propertyId: number): Promise<Document[]> => {
    const response = await api.get<Document[]>(`/documents/property/${propertyId}`);
    return response.data;
  },

  upload: async (
    propertyId: number,
    file: File,
    documentType?: string,
    description?: string
  ): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('property_id', propertyId.toString());
    if (documentType) formData.append('document_type', documentType);
    if (description) formData.append('description', description);

    const response = await api.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  download: async (id: number): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  getTypes: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/documents/types');
    return response.data;
  },
};

// ============ Costs ============

export const costsApi = {
  get: async (propertyId: number): Promise<PropertyCost> => {
    const response = await api.get<PropertyCost>(`/costs/property/${propertyId}`);
    return response.data;
  },

  update: async (propertyId: number, data: PropertyCostUpdate): Promise<PropertyCost> => {
    const response = await api.put<PropertyCost>(`/costs/property/${propertyId}`, data);
    return response.data;
  },
};

// ============ Imports ============

export const importsApi = {
  list: async (): Promise<ImportJob[]> => {
    const response = await api.get<ImportJob[]>('/imports');
    return response.data;
  },

  upload: async (file: File, propertyType: 'MDU' | 'Subdivision'): Promise<ImportJob> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('property_type', propertyType);

    const response = await api.post<ImportJob>('/imports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  get: async (id: number): Promise<ImportJob> => {
    const response = await api.get<ImportJob>(`/imports/${id}`);
    return response.data;
  },
};

// ============ Health Check ============

export const healthApi = {
  check: async (): Promise<{ status: string; app: string; version: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  getCounties: async (): Promise<{ counties: string[]; state: string }> => {
    const response = await api.get('/counties');
    return response.data;
  },
};

export default api;
