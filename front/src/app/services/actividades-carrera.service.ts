import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/actividades';

export type EstadoActividad = 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADA';

export interface ActividadCarrera {
  id: number;
  nombre: string;
  tipo: string;
  estado: EstadoActividad;
  responsable: string;
  fechaInicio: string;
  fechaFin?: string;
  descripcion?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface FiltrosActividades {
  search?: string;
  tipo?: string;
  estado?: EstadoActividad | '';
  responsable?: string;
  fechaInicio?: string;
  fechaFin?: string;
  sortBy?: 'nombre' | 'tipo' | 'estado' | 'responsable' | 'fechaInicio' | 'fechaFin';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class ActividadesCarreraService {
  constructor(private http: HttpClient) {}

  list(query: FiltrosActividades = {}): Observable<PagedResult<ActividadCarrera>> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PagedResult<ActividadCarrera>>(API, { params });
  }

  detail(id: number): Observable<ActividadCarrera> {
    return this.http.get<ActividadCarrera>(`${API}/${id}`);
  }
}
