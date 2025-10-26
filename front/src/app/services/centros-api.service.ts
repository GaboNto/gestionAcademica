import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000';

export interface TrabajadorDTO {
  id: number;
  rut: string;
  nombre: string;
  rol?: string | null;
  correo?: string | null;
  telefono?: number | null;
  centroId?: number;
}

export interface CentroEducativoDTO {
  id: number;
  nombre: string;
  // enum del back (Prisma)
  tipo: 'PARTICULAR' | 'PARTICULAR_SUBVENCIONADO' | 'SLEP' | string;
  region: string;
  comuna: string;
  convenio?: string | null;
  direccion?: string | null;
  nombre_calle?: string | null;
  numero_calle?: number | null;
  telefono?: number | null;
  correo?: string | null;
  url_rrss?: string | null;
  // cuando pedimos detalle:
  trabajadores?: TrabajadorDTO[];
}

export interface PagedResult<T> {
  items: T[]; page: number; limit: number; total: number; pages: number;
}

@Injectable({ providedIn: 'root' })
export class CentrosApiService {
  private http = inject(HttpClient);

  list(params?: { page?: number; limit?: number; search?: string; tipo?: string; }): Observable<PagedResult<CentroEducativoDTO>> {
    let p = new HttpParams();
    if (params?.page)  p = p.set('page', params.page);
    if (params?.limit) p = p.set('limit', params.limit);
    if (params?.search) p = p.set('search', params.search);
    if (params?.tipo) p = p.set('tipo', params.tipo);
    return this.http.get<PagedResult<CentroEducativoDTO>>(`${API}/centros`, { params: p });
  }

  getById(id: number): Observable<CentroEducativoDTO> {
    // El back devuelve { ...centro, trabajadores: [...] }
    return this.http.get<CentroEducativoDTO>(`${API}/centros/${id}`);
  }

  create(body: {
    nombre: string;
    // debe llegar como enum del back
    tipo: 'PARTICULAR' | 'PARTICULAR_SUBVENCIONADO' | 'SLEP' | string;
    region: string;
    comuna: string;
    convenio?: string;
    direccion?: string;
    calle?: string;
    numero?: number | string | null;
    telefono?: number | string | null;
    correo?: string;
    url_rrss?: string;
  }) {
    const payload = {
      nombre: body.nombre,
      tipo: body.tipo, // enum del back
      region: body.region,
      comuna: body.comuna,
      convenio: body.convenio ?? null,
      direccion: body.direccion ?? null,
      nombre_calle: body.calle ?? null,
      numero_calle: body.numero != null && body.numero !== '' ? Number(body.numero) : null,
      telefono: body.telefono != null && body.telefono !== '' ? Number(body.telefono) : null,
      correo: body.correo ?? null,
      url_rrss: body.url_rrss ?? null,
    };
    return this.http.post<CentroEducativoDTO>(`${API}/centros`, payload);
  }

  update(id: number, body: Partial<{
    nombre: string;
    tipo: 'PARTICULAR' | 'PARTICULAR_SUBVENCIONADO' | 'SLEP' | string;
    region: string;
    comuna: string;
    convenio?: string;
    direccion?: string;
    calle?: string;
    numero?: number | string | null;
    telefono?: number | string | null;
    correo?: string;
    url_rrss?: string;
  }>) {
    const payload: any = {};
    if (body.nombre !== undefined) payload.nombre = body.nombre;
    if (body.tipo !== undefined) payload.tipo = body.tipo;
    if (body.region !== undefined) payload.region = body.region;
    if (body.comuna !== undefined) payload.comuna = body.comuna;
    if (body.convenio !== undefined) payload.convenio = body.convenio ?? null;
    if (body.direccion !== undefined) payload.direccion = body.direccion ?? null;
    if (body.calle !== undefined) payload.nombre_calle = body.calle ?? null;
    if (body.numero !== undefined) payload.numero_calle = (body.numero != null && body.numero !== '') ? Number(body.numero) : null;
    if (body.telefono !== undefined) payload.telefono = (body.telefono != null && body.telefono !== '') ? Number(body.telefono) : null;
    if (body.correo !== undefined) payload.correo = body.correo ?? null;
    if (body.url_rrss !== undefined) payload.url_rrss = body.url_rrss ?? null;

    return this.http.patch<CentroEducativoDTO>(`${API}/centros/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete<void>(`${API}/centros/${id}`);
  }
}
