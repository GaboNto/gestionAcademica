import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000';

export interface EstudianteDTO {
  id: number;
  rut: string;
  nombre: string;
  nivel?: string;
  email?: string;
  telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class EstudiantesApiService {
  constructor(private http: HttpClient) {}
  list(): Observable<EstudianteDTO[]> {
    return this.http.get<EstudianteDTO[]>(`${API}/estudiante`);
  }
}
