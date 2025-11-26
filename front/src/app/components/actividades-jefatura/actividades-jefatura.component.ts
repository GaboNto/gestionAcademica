import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ActividadesCarreraService,
  ActividadCarrera,
  FiltrosActividades,
} from '../../services/actividades-carrera.service';

@Component({
  standalone: true,
  selector: 'app-actividades-jefatura',
  templateUrl: './actividades-jefatura.component.html',
  styleUrls: ['./actividades-jefatura.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class ActividadesJefaturaComponent implements OnInit {
  private api = inject(ActividadesCarreraService);

  displayedColumns = ['nombre', 'tipo', 'fechas', 'estado', 'responsable', 'acciones'];
  actividades: ActividadCarrera[] = [];
  total = 0;

  filtros: FiltrosActividades = {
    search: '',
    tipo: '',
    estado: '',
    fechaInicio: '',
    fechaFin: '',
    sortBy: 'fechaInicio',
    sortOrder: 'desc',
  };

  tipos = ['Planificación', 'Taller', 'Reporte', 'Visita', 'Administrativo', 'Reunión', 'Evaluación', 'Capacitación'];
  estados = [
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_CURSO', label: 'En curso' },
    { value: 'FINALIZADA', label: 'Finalizada' },
  ];

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20];

  cargando = false;
  seleccionada: ActividadCarrera | null = null;

  ngOnInit(): void {
    this.cargarActividades();
  }

  cargarActividades(resetPage = false): void {
    if (resetPage) this.pageIndex = 0;
    this.cargando = true;

    this.api
      .list({
        ...this.filtros,
        page: this.pageIndex + 1,
        limit: this.pageSize,
      })
      .subscribe({
        next: (resp) => {
          this.actividades = resp.items;
          this.total = resp.total;
          this.cargando = false;
          if (this.seleccionada) {
            this.seleccionada = resp.items.find(a => a.id === this.seleccionada?.id) ?? null;
          }
        },
        error: () => {
          this.cargando = false;
        },
      });
  }

  onSearchChange(): void {
    this.cargarActividades(true);
  }

  onFiltroChange(): void {
    this.cargarActividades(true);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargarActividades();
  }

  toggleSort(column: FiltrosActividades['sortBy']): void {
    if (this.filtros.sortBy === column) {
      this.filtros.sortOrder = this.filtros.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.filtros.sortBy = column;
      this.filtros.sortOrder = 'asc';
    }
    this.cargarActividades(true);
  }

  verDetalle(actividad: ActividadCarrera): void {
    this.seleccionada = actividad;
  }

  limpiarFiltros(): void {
    this.filtros = {
      search: '',
      tipo: '',
      estado: '',
      fechaInicio: '',
      fechaFin: '',
      sortBy: 'fechaInicio',
      sortOrder: 'desc',
    };
    this.cargarActividades(true);
  }

  estadoClase(estado: string): string {
    switch (estado) {
      case 'FINALIZADA':
        return 'estado-pill estado-exito';
      case 'EN_CURSO':
        return 'estado-pill estado-curso';
      default:
        return 'estado-pill estado-pendiente';
    }
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }
}
