import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-actividades-estudiantes',
  templateUrl: './actividades-estudiantes.component.html',
  styleUrls: ['./actividades-estudiantes.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ]
})
export class ActividadesEstudiantesComponent {
}

