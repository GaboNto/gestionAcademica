import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface Estudiante {
  rut: string;
  nombre: string;
  nivel: string;
}

interface CentroEducativo {
  id: number;
  nombre: string;
  direccion?: string;
  tipo?: string;
}

interface Colaborador {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  especialidad?: string;
}

interface Actividad {
  id: number;
  titulo: string;
  descripcion?: string;
  fecha: string;
  completada: boolean;
}

interface Practica {
  id: number;
  estado: 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADA' | 'RECHAZADA';
  fechaInicio: string;
  fechaTermino?: string;
  tipo?: string;
  estudiante: Estudiante;
  centro: CentroEducativo;
  colaborador: Colaborador;
  actividades?: Actividad[];
}

@Component({
  standalone: true,
  selector: 'app-practicas',
  templateUrl: './practicas.component.html',
  styleUrls: ['./practicas.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ]
})
export class PracticasComponent {
  // Filtros
  terminoBusqueda = '';
  nivelSeleccionado: 'all' | 'Basica' | 'Media' = 'all';
  colegioSeleccionado: 'all' | 'Colegio San José' | 'Liceo Técnico' | 'Escuela Municipal' = 'all';

  // Estado para modal de detalles
  practicaSeleccionada: Practica | null = null;
  mostrarModalDetalles = false;

  constructor() {
    // Asegurar que los datos estén inicializados
    if (!this.practicas || this.practicas.length === 0) {
      this.practicas = [];
    }
  }

  // Datos de prácticas
  practicas: Practica[] = [
    {
      id: 1,
      estado: 'EN_CURSO',
      fechaInicio: '2024-03-15',
      fechaTermino: '2024-07-15',
      tipo: 'Práctica Profesional',
      estudiante: {
        rut: '12.345.678-9',
        nombre: 'María González',
        nivel: 'Basica'
      },
      centro: {
        id: 1,
        nombre: 'Colegio San José',
        direccion: 'Av. Principal 123, Santiago',
        tipo: 'Colegio Particular'
      },
      colaborador: {
        id: 1,
        nombre: 'Ana Martínez',
        email: 'ana.martinez@colegio.com',
        rol: 'Supervisor',
        especialidad: 'Educación Básica'
      },
      actividades: [
        { id: 1, titulo: 'Observación de clases', descripcion: 'Observar metodologías de enseñanza', fecha: '2024-03-20', completada: true },
        { id: 2, titulo: 'Planificación de actividades', descripcion: 'Diseñar actividades pedagógicas', fecha: '2024-04-01', completada: false }
      ]
    },
    {
      id: 2,
      estado: 'PENDIENTE',
      fechaInicio: '2024-03-20',
      fechaTermino: '2024-07-20',
      tipo: 'Práctica Inicial',
      estudiante: {
        rut: '98.765.432-1',
        nombre: 'Carlos Rodríguez',
        nivel: 'Media'
      },
      centro: {
        id: 2,
        nombre: 'Liceo Técnico',
        direccion: 'Calle Industrial 456, Valparaíso',
        tipo: 'Liceo Técnico Profesional'
      },
      colaborador: {
        id: 2,
        nombre: 'Pedro Silva',
        email: 'pedro.silva@liceo.com',
        rol: 'Supervisor',
        especialidad: 'Educación Técnica'
      }
    },
    {
      id: 3,
      estado: 'FINALIZADA',
      fechaInicio: '2024-04-01',
      fechaTermino: '2024-08-01',
      tipo: 'Práctica Final',
      estudiante: {
        rut: '11.222.333-4',
        nombre: 'Ana López',
        nivel: 'Basica'
      },
      centro: {
        id: 2,
        nombre: 'Liceo Técnico',
        direccion: 'Calle Industrial 456, Valparaíso',
        tipo: 'Liceo Técnico Profesional'
      },
      colaborador: {
        id: 3,
        nombre: 'Carmen Torres',
        email: 'carmen.torres@liceo.com',
        rol: 'Supervisor',
        especialidad: 'Educación Básica'
      },
      actividades: [
        { id: 3, titulo: 'Evaluación final', descripcion: 'Presentación de portafolio', fecha: '2024-07-25', completada: true }
      ]
    },
    {
      id: 4,
      estado: 'EN_CURSO',
      fechaInicio: '2024-04-10',
      fechaTermino: '2024-08-10',
      tipo: 'Práctica Profesional',
      estudiante: {
        rut: '15.678.901-2',
        nombre: 'Fernanda Vásquez',
        nivel: 'Media'
      },
      centro: {
        id: 3,
        nombre: 'Escuela Municipal',
        direccion: 'Plaza Central 789, Concepción',
        tipo: 'Escuela Municipal'
      },
      colaborador: {
        id: 4,
        nombre: 'Luis Herrera',
        email: 'luis.herrera@municipal.com',
        rol: 'Supervisor',
        especialidad: 'Educación Media'
      },
      actividades: [
        { id: 4, titulo: 'Aplicación de estrategias', descripcion: 'Implementar técnicas aprendidas', fecha: '2024-05-15', completada: false }
      ]
    },
    {
      id: 5,
      estado: 'PENDIENTE',
      fechaInicio: '2024-04-15',
      fechaTermino: '2024-08-15',
      tipo: 'Práctica Inicial',
      estudiante: {
        rut: '19.345.678-5',
        nombre: 'Diego Morales',
        nivel: 'Basica'
      },
      centro: {
        id: 1,
        nombre: 'Colegio San José',
        direccion: 'Av. Principal 123, Santiago',
        tipo: 'Colegio Particular'
      },
      colaborador: {
        id: 5,
        nombre: 'Patricia Ruiz',
        email: 'patricia.ruiz@colegio.com',
        rol: 'Supervisor',
        especialidad: 'Educación Básica'
      }
    },
    {
      id: 6,
      estado: 'RECHAZADA',
      fechaInicio: '2024-03-01',
      fechaTermino: '2024-06-01',
      tipo: 'Práctica Profesional',
      estudiante: {
        rut: '17.234.567-8',
        nombre: 'Luis Pérez',
        nivel: 'Media'
      },
      centro: {
        id: 3,
        nombre: 'Escuela Municipal',
        direccion: 'Plaza Central 789, Concepción',
        tipo: 'Escuela Municipal'
      },
      colaborador: {
        id: 6,
        nombre: 'María González',
        email: 'maria.gonzalez@municipal.com',
        rol: 'Supervisor',
        especialidad: 'Educación Media'
      }
    }
  ];

  // Funciones
  asignacionesFiltradas(): Practica[] {
    const termino = this.terminoBusqueda.toLowerCase().trim();

    return this.practicas.filter(practica => {
      // Verificar que practica y sus propiedades existan
      if (!practica || !practica.estudiante || !practica.centro || !practica.colaborador) {
        return false;
      }

      // Filtro de búsqueda
      const coincideBusqueda = !termino ||
        practica.estudiante.nombre?.toLowerCase().includes(termino) ||
        practica.estudiante.rut?.toLowerCase().includes(termino) ||
        practica.centro.nombre?.toLowerCase().includes(termino) ||
        practica.colaborador.nombre?.toLowerCase().includes(termino);

      // Filtro de nivel
      const coincideNivel = this.nivelSeleccionado === 'all' || practica.estudiante.nivel === this.nivelSeleccionado;

      // Filtro de colegio
      const coincideColegio = this.colegioSeleccionado === 'all' || practica.centro.nombre === this.colegioSeleccionado;

      return coincideBusqueda && coincideNivel && coincideColegio;
    });
  }

  abrirNuevaAsignacion() {
    // TODO: Implementar modal para nueva asignación
    console.log('Abrir modal de nueva asignación');
  }

  verDetalles(practica: Practica) {
    this.practicaSeleccionada = practica;
    this.mostrarModalDetalles = true;
  }

  cerrarDetalles() {
    this.practicaSeleccionada = null;
    this.mostrarModalDetalles = false;
  }
}