import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface Estudiante {
  id: number;
  name: string;
  rut: string;
  code: string;
  level: string;
  cohort: string;
  email: string;
  phone: string;
}

@Component({
  standalone: true,
  selector: 'app-estudiantes',
  templateUrl: './estudiante.component.html',
  styleUrls: ['./estudiante.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule
  ]
})
export class EstudiantesComponent {
  estudiantes: Estudiante[] = [
    { id: 1, name: 'GARCÍA ARANCIBIA BRAYAN IGNACIO', rut: '21.278.881-3', code: 'EST001', level: '1er año', cohort: '2021', email: 'brayan.garcia.arancibia@alumnos.uta.cl', phone: '+56 9 8616 0619' },
    { id: 2, name: 'PAILAMILLA PÉREZ GABRIEL ANTONIO', rut: '21.073.336-1', code: 'EST002', level: '1er año', cohort: '2021', email: 'gabriel.pailamilla.perez@alumnos.uta.cl', phone: '+56 9 9706 1651' },
    { id: 3, name: 'SANTIAGO YOVICH VRANIKA FERNANDA', rut: '21.231.344-0', code: 'EST003', level: '1er año', cohort: '2021', email: 'vranika.santiago.yovich@alumnos.uta.cl', phone: '+56 9 6230 8315' },
    { id: 4, name: 'VARAS BURGOS PABLO IGNACIO', rut: '20.968.184-6', code: 'EST004', level: '1er año', cohort: '2021', email: 'pablo.varas.burgos@alumnos.uta.cl', phone: '+56 9 4022 4149' },
    { id: 5, name: 'VENTURA BRICEÑO FERNANDA JAVIERA', rut: '21.201.516-4', code: 'EST005', level: '1er año', cohort: '2021', email: 'fernanda.ventura.briceno@alumnos.uta.cl', phone: '+56 9 6577 3347' }
  ];

  searchTerm: string = '';

  filtered() {
    if (!this.searchTerm) return this.estudiantes;
    const term = this.searchTerm.toLowerCase();
    return this.estudiantes.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.rut.toLowerCase().includes(term) ||
      s.code.toLowerCase().includes(term)
    );
  }

  delete(id: number) {
    this.estudiantes = this.estudiantes.filter(s => s.id !== id);
  }
}
