import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

export interface ApiCentro { id: number; nombre: string; region?: string; comuna?: string; }
export interface ApiEstudiante { rut: string; nombre: string; }
export interface ApiSupervisor { id: number; nombre: string; correo?: string; trato?: string; }

export interface CreateCartaDto {
  tipoPractica: string;
  centroId: number;
  estudiantesIds: string[]; // RUTs del estudiante
  supervisorId: number;
  periodoInicio: string; // yyyy-mm-dd
  periodoFin: string;    // yyyy-mm-dd
}

@Injectable({ providedIn: 'root' })
export class CartaDataService {
  private http = inject(HttpClient);

  getTiposPractica(): Observable<string[]> {
    return this.http.get<string[]>(`${API}/tipos-practica`);
  }

  getCentros(q = ''): Observable<ApiCentro[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ApiCentro[]>(`${API}/centros`, { params });
  }

  getEstudiantes(q = ''): Observable<ApiEstudiante[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ApiEstudiante[]>(`${API}/estudiantes`, { params });
  }

  getSupervisores(q = ''): Observable<ApiSupervisor[]> {
    const params = q ? new HttpParams().set('q', q) : undefined;
    return this.http.get<ApiSupervisor[]>(`${API}/supervisores`, { params });
  }

  crearCarta(dto: CreateCartaDto) {
    return this.http.post(`${API}/cartas`, dto);
  }
}
