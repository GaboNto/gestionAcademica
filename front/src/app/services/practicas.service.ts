import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_URL = 'http://localhost:3000/practicas';

export interface Estudiante {
  rut: string;
  nombre: string;
  nivel?: string;
  email?: string;
  telefono?: string;
}

export interface CentroEducativo {
  id: number;
  nombre: string;
  direccion?: string;
  tipo?: string;
  region?: string;
  comuna?: string;
  convenio?: string;
}

export interface Colaborador {
  id: number;
  nombre: string;
  correo?: string;
  tipo?: string;
  cargo?: string;
  telefono?: number;
}

export type EstadoPractica = 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADA' | 'RECHAZADA';

export interface Practica {
  id: number;
  estado: EstadoPractica;
  fecha_inicio: string;
  fecha_termino?: string;
  tipo?: string;
  estudiante?: Estudiante;
  centro?: CentroEducativo;
  colaborador?: Colaborador;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePracticaDto {
  estudianteRut: string;
  centroId: number;
  colaboradorId: number;
  fecha_inicio: string;
  fecha_termino?: string;
  tipo?: string;
  estado?: EstadoPractica;
}

export interface QueryPracticasParams {
  estado?: EstadoPractica;
  estudianteRut?: string;
}

export interface PracticasResponse {
  items: Practica[];
  meta?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PracticasService {
  constructor(private http: HttpClient) {}

  /**
   * Listar prácticas con filtros opcionales
   */
  listar(params?: QueryPracticasParams): Observable<Practica[]> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key as keyof QueryPracticasParams];
        if (value !== undefined && value !== null) {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<Practica[]>(API_URL, { params: httpParams });
  }

  /**
   * Crear una nueva práctica
   */
  crear(practica: CreatePracticaDto): Observable<{ message: string; data: Practica }> {
    return this.http.post<{ message: string; data: Practica }>(API_URL, practica);
  }

  /**
   * Obtener una práctica por ID
   */
  obtenerPorId(id: number): Observable<Practica> {
    return this.http.get<Practica>(`${API_URL}/${id}`);
  }

  /**
   * Listar para jefatura con filtros avanzados
   */
  listarParaJefatura(params: any): Observable<PracticasResponse> {
    let httpParams = new HttpParams();
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }

    return this.http.get<PracticasResponse>(`${API_URL}/jefatura`, { params: httpParams });
  }
}

