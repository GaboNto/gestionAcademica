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
    // Ejemplo de datos iniciales
    { id: 1, name: 'Ana Soto', rut: '12.345.678-9', code: 'EST001', level: '4to año', cohort: '2024', email: 'ana@uta.cl', phone: '+56 9 1234 5678' },
    { id: 2, name: 'Pedro Ramírez', rut: '98.765.432-1', code: 'EST002', level: '5to año', cohort: '2023', email: 'pedro@uta.cl', phone: '+56 9 8765 4321' }
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
