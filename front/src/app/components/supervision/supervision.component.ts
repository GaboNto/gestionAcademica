import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-supervision',
  templateUrl: './supervision.component.html',
  styleUrls: ['./supervision.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ]
})
export class SupervisionComponent {
  supervisionData = {
    totalStudents: 120,
    activeInternships: 35,
    completedInternships: 50,
    pendingAssignments: 20,
    schools: 10,
    supervisors: 8
  };

  recentActivities = [
    { description: 'Informe de práctica recibido', date: '2025-10-01', priority: 'normal' },
    { description: 'Asignación de supervisor', date: '2025-10-05', priority: 'high' },
    { description: 'Revisión de actividades', date: '2025-10-07', priority: 'normal' }
  ];

  deadlines = [
    { task: 'Entrega de Informe Final', date: '2025-10-20', daysLeft: 9 },
    { task: 'Evaluación de supervisor', date: '2025-10-25', daysLeft: 14 }
  ];
}
