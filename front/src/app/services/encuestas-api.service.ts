import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ApiEncuesta {
  id: number | string;
  tipo?: string;
  fecha?: string;
  origenArchivo?: string;
  respuestas?: any[];
  [k: string]: any;
}

const API_URL = 'http://localhost:3000/encuestas';

@Injectable({
  providedIn: 'root'
})
export class EncuestasApiService {

  constructor(private http: HttpClient) {}

  // LISTA DE ENCUESTAS (estudiantes + colaboradores, normalizadas por el backend)
  getEncuestasRegistradas(): Observable<ApiEncuesta[]> {
    return this.http.get<ApiEncuesta[]>(API_URL);
  }

  getEncuestaById(id: number | string): Observable<any> {
    return this.http.get(`${API_URL}/${id}`);
  }

  createEncuesta(payload: any): Observable<any> {
    return this.http.post(API_URL, payload);
  }

  // Exporta Excel (blob)
  exportEncuestasExcel(): Observable<Blob> {
    return this.http.get(`${API_URL}/export/excel`, { responseType: 'blob' });
  }

  // ---------- CATÁLOGOS (para poblar selects) ----------
  // Las rutas serán:
  // GET http://localhost:3000/encuestas/estudiantes
  // GET http://localhost:3000/encuestas/centros
  // GET http://localhost:3000/encuestas/colaboradores
  // GET http://localhost:3000/encuestas/tutores

  getEstudiantes(): Observable<{ rut: string; nombre: string }[]> {
    return this.http.get<{ rut: string; nombre: string }[]>(`${API_URL}/estudiantes`);
  }

  getCentros(): Observable<{ id: number; nombre: string; comuna?: string; region?: string }[]> {
    return this.http.get<{ id: number; nombre: string; comuna?: string; region?: string }[]>(`${API_URL}/centros`);
  }

  getColaboradores(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${API_URL}/colaboradores`);
  }

  getTutores(): Observable<{ id: number; nombre: string }[]> {
    return this.http.get<{ id: number; nombre: string }[]>(`${API_URL}/tutores`);
  }
}
