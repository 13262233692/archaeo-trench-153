import type { Trench, Stratum, Artifact, Photo } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

export const trenchApi = {
  getAll: () => request<Trench[]>('/trenches'),
  get: (id: string) => request<Trench>(`/trenches/${id}`),
  create: (data: Partial<Trench>) => request<Trench>('/trenches', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Trench>) => request<Trench>(`/trenches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request(`/trenches/${id}`, { method: 'DELETE' }),
  getStrata: (id: string) => request<Stratum[]>(`/trenches/${id}/strata`),
  getArtifacts: (id: string) => request<Artifact[]>(`/trenches/${id}/artifacts`),
  getPhotos: (id: string) => request<Photo[]>(`/trenches/${id}/photos`),
};

export const stratumApi = {
  create: (data: any) => request<Stratum>('/strata', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => request<Stratum>(`/strata/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request(`/strata/${id}`, { method: 'DELETE' }),
};

export const artifactApi = {
  create: (data: any) => request<Artifact>('/artifacts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => request<Artifact>(`/artifacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => request(`/artifacts/${id}`, { method: 'DELETE' }),
};

export const photoApi = {
  getAll: () => request<Photo[]>('/photos'),
  upload: (formData: FormData) => fetch(`${API_BASE}/photos`, {
    method: 'POST',
    body: formData,
  }).then(res => res.json()),
  delete: (id: string) => request(`/photos/${id}`, { method: 'DELETE' }),
};
