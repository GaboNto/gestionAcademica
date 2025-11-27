import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { jsPDF } from 'jspdf';
import {
  EstudiantesService,
  EstudianteResumen,
  EstudianteDetalle,
  EstadoPractica,
} from '../../services/estudiantes.service';

@Component({
  standalone: true,
  selector: 'app-estudiantes',
  templateUrl: './estudiante.component.html',
  styleUrls: ['./estudiante.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
  ],
})
export class EstudiantesComponent implements OnInit {
  private service = inject(EstudiantesService);

  searchTerm = '';
  carreraSeleccionada: 'all' | string = 'all';
  estadoSeleccionado: 'all' | EstadoPractica = 'all';
  carreras: string[] = [];

  estudiantes: EstudianteResumen[] = [];
  seleccionado: EstudianteResumen | null = null;
  detalle: EstudianteDetalle | null = null;

  cargandoLista = false;
  cargandoDetalle = false;
  mensajeError: string | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  private filtros() {
    return {
      nombre: this.searchTerm || undefined,
      carrera: this.carreraSeleccionada !== 'all' ? this.carreraSeleccionada : undefined,
      estadoPractica: this.estadoSeleccionado !== 'all' ? this.estadoSeleccionado : undefined,
    };
  }

  cargar(): void {
    this.cargandoLista = true;
    this.mensajeError = null;
    this.service.listar(this.filtros()).subscribe({
      next: (items) => {
        this.estudiantes = items;
        this.carreras = Array.from(
          new Set(
            items
              .map((e) => (e.plan || '').trim())
              .filter((carrera) => carrera && carrera.length > 0),
          ),
        ).sort((a, b) => a.localeCompare(b, 'es'));

        if (this.seleccionado) {
          this.seleccionado = items.find((e) => e.rut === this.seleccionado!.rut) || null;
        }
        if (this.seleccionado) {
          this.obtenerDetalle(this.seleccionado.rut, false);
        } else {
          this.detalle = null;
        }

        this.cargandoLista = false;
      },
      error: () => {
        this.cargandoLista = false;
        this.mensajeError = 'No se pudo cargar la lista de estudiantes';
      },
    });
  }

  aplicarFiltros(): void {
    this.cargar();
  }

  seleccionar(estudiante: EstudianteResumen): void {
    this.seleccionado = estudiante;
    this.obtenerDetalle(estudiante.rut, true);
  }

  obtenerDetalle(rut: string, resetDetalle = true): void {
    this.cargandoDetalle = true;
    if (resetDetalle) {
      this.detalle = null;
    }
    this.service.obtenerDetalle(rut).subscribe({
      next: (detalle) => {
        this.detalle = detalle;
        this.cargandoDetalle = false;
      },
      error: () => {
        this.cargandoDetalle = false;
        this.mensajeError = 'No se pudo cargar el detalle del estudiante';
      },
    });
  }

  estadoLabel(estado?: EstadoPractica | null): string {
    const map: Record<EstadoPractica, string> = {
      EN_CURSO: 'En curso',
      APROBADO: 'Aprobado',
      REPROBADO: 'Reprobado',
    };
    return estado ? map[estado] : 'Sin práctica';
  }

  formatearFecha(value?: string | null): string {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleDateString('es-CL');
  }

  exportarPdf(): void {
    if (!this.detalle) return;

    const doc = new jsPDF();
    const { detalle } = this;
    let y = 14;

    doc.setFontSize(16);
    doc.text('Ficha de estudiante', 10, y);
    y += 8;

    doc.setFontSize(11);
    doc.text(`Nombre: ${detalle.nombre}`, 10, y);
    y += 6;
    doc.text(`RUT: ${detalle.rut}`, 10, y);
    y += 6;
    doc.text(`Carrera/Plan: ${detalle.plan || '-'}`, 10, y);
    y += 6;
    doc.text(`Correo: ${detalle.email || '-'}`, 10, y);
    y += 6;
    doc.text(`Teléfono: ${detalle.fono || '-'}`, 10, y);
    y += 8;

    doc.text('Historial de prácticas:', 10, y);
    y += 6;
    if (detalle.practicas && detalle.practicas.length) {
      detalle.practicas.forEach((p) => {
        if (y > 270) {
          doc.addPage();
          y = 14;
        }
        doc.text(
          `#${p.id} - ${this.estadoLabel(p.estado)} (${this.formatearFecha(p.fecha_inicio)} - ${this.formatearFecha(p.fecha_termino)})`,
          12,
          y,
        );
        y += 6;
        if (p.centro) {
          doc.text(`Centro: ${p.centro.nombre}`, 14, y);
          y += 6;
        }
      });
    } else {
      doc.text('Sin prácticas registradas', 12, y);
      y += 6;
    }

    y += 4;
    doc.text('Actividades asociadas:', 10, y);
    y += 6;
    if (detalle.actividades && detalle.actividades.length) {
      detalle.actividades.slice(0, 10).forEach((a) => {
        if (y > 270) {
          doc.addPage();
          y = 14;
        }
        doc.text(`- ${a.nombre_actividad} (${this.formatearFecha(a.fecha)})`, 12, y);
        y += 6;
      });
      if (detalle.actividades.length > 10) {
        doc.text(`... ${detalle.actividades.length - 10} más`, 12, y);
        y += 6;
      }
    } else {
      doc.text('Sin actividades asociadas', 12, y);
      y += 6;
    }

    doc.save(`estudiante_${detalle.rut}.pdf`);
  }
}
