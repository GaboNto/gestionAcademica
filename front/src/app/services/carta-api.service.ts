import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class CartaApiService {
  constructor(private http: HttpClient) {}
  generar(params: {
    studentRut: string;
    centerId: number;
    supervisorId: number;
    inicio: string;
    fin: string;
  }): Observable<Blob> {
    const q = new HttpParams()
      .set('studentRut', params.studentRut)
      .set('centerId', params.centerId)
      .set('supervisorId', params.supervisorId)
      .set('inicio', params.inicio)
      .set('fin', params.fin);
    return this.http.get(`${API}/carta`, { params: q, responseType: 'blob' });
  }
}
