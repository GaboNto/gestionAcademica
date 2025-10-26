import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatCardModule }   from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }  from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// APIs
import { CentrosApiService, CentroEducativoDTO, TrabajadorDTO } from '../../services/centros-api.service';
import { TrabajadoresApiService } from '../../services/trabajadores-api.service';

// === tipos compatibles con tu enum Prisma ===
type TipoCentro = 'PARTICULAR' | 'PARTICULAR_SUBVENCIONADO' | 'SLEP';
type Convenio   = 'Marco SLEP' | 'Solicitud directa' | 'ADEP' | string;

interface CentroEducativo {
  id: number;
  nombre: string;
  tipo: TipoCentro;
  region: string;
  comuna: string;
  convenio?: Convenio;
  direccion?: string;
  url_rrss?: string;
  calle?: string | null;
  numero?: number | string | null;
  telefono?: number | string | null;
  correo?: string | null;
}

type CentroDetalle = CentroEducativo & {
  trabajadores?: TrabajadorDTO[];
};

@Component({
  standalone: true,
  selector: 'app-centros-educativos',
  templateUrl: './centros-educativos.component.html',
  styleUrls: ['./centros-educativos.component.scss'],
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule
  ]
})
export class CentrosEducativosComponent {
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  // APIs
  private centrosApi = inject(CentrosApiService);
  private trabajadoresApi = inject(TrabajadoresApiService);

  // ===== UI =====
  showForm = false;
  isEditing = false;
  sortAZ = true;

  // ===== filtros (lista) =====
  searchTerm = '';
  selectedTipo: 'all' | TipoCentro = 'all';

  // ===== regiones y comunas ===== (ejemplo; tú ya pegaste todas)
  readonly REGIONES: { nombre: string; comunas: string[] }[] = [
    { nombre: 'Región de Arica y Parinacota', comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos'] },
    { nombre: 'Región de Tarapacá',           comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte'] },
    { nombre: 'Región Metropolitana de Santiago', comunas: ['Santiago', 'Providencia', 'Las Condes', 'La Florida', 'Puente Alto', 'Maipú'] },
  ];
  comunasFiltradas: string[] = [];

  // ===== formulario =====
  editId: number | null = null;
  newCentroEducativo: Partial<CentroEducativo> = {
    nombre: '',
    // por compatibilidad con Prisma enum
    tipo: 'SLEP',
    region: '',
    comuna: '',
    convenio: 'Marco SLEP',
    direccion: '',
    url_rrss: '',
    calle: '',
    numero: '',
    telefono: '',
    correo: '',
  };

  // ===== contactos (SOLO edición) =====
  contactosForm = {
    directorNombre: '', directorCorreo: '', directorTelefono: '',
    utpNombre: '',      utpCorreo: '',      utpTelefono: '',
  };
  private contactoDirectorId: number | null = null;
  private contactoUtpId: number | null = null;

  // ===== datos (lista) =====
  centrosEducativos: CentroEducativo[] = [];

  // dialog detalles
  selectedCentroEducativo: CentroDetalle | null = null;
  detalleCargando = false;

  constructor() {
    this.load();
  }

  // ===== carga lista desde backend =====
  load() {
    this.centrosApi.list({ page: 1, limit: 1000 }).subscribe({
      next: (r) => {
        this.centrosEducativos = (r.items ?? []).map(this.mapDTOtoUI);
      },
      error: () => this.snack.open('No se pudieron cargar los centros', 'Cerrar', { duration: 2500 })
    });
  }

  // mapea DTO del back a UI del front
  private mapDTOtoUI = (dto: CentroEducativoDTO): CentroEducativo => ({
    id: dto.id,
    nombre: dto.nombre,
    tipo: (dto.tipo as TipoCentro) ?? 'SLEP',
    region: dto.region,
    comuna: dto.comuna,
    convenio: dto.convenio ?? undefined,
    direccion: dto.direccion ?? undefined,
    url_rrss: dto.url_rrss ?? undefined,
    calle: dto.nombre_calle ?? undefined,
    numero: dto.numero_calle ?? undefined,
    telefono: dto.telefono ?? undefined,
    correo: dto.correo ?? undefined,
  });

  // ===== helpers UI =====
  toggleForm() { this.showForm = !this.showForm; if (!this.showForm) this.resetForm(); }

  onRegionChange() {
    const region = this.newCentroEducativo.region || '';
    const reg = this.REGIONES.find(r => r.nombre === region);
    this.comunasFiltradas = reg ? reg.comunas : [];
    if (!this.comunasFiltradas.includes(this.newCentroEducativo.comuna || '')) {
      this.newCentroEducativo.comuna = '';
    }
  }

  private resetForm() {
    this.isEditing = false;
    this.editId = null;
    this.newCentroEducativo = {
      nombre: '',
      tipo: 'SLEP',
      region: '',
      comuna: '',
      convenio: 'Marco SLEP',
      direccion: '',
      url_rrss: '',
      calle: '',
      numero: '',
      telefono: '',
      correo: '',
    };
    this.comunasFiltradas = [];
    // reset contactos
    this.contactosForm = {
      directorNombre: '', directorCorreo: '', directorTelefono: '',
      utpNombre: '', utpCorreo: '', utpTelefono: '',
    };
    this.contactoDirectorId = null;
    this.contactoUtpId = null;
    this.selectedCentroEducativo = null;
  }

  // ===== CRUD centro =====
  addOrUpdateCentro() {
    const c = this.newCentroEducativo;

    if (!c.nombre?.trim() || !c.tipo || !c.region || !c.comuna || !c.convenio) {
      this.snack.open('Debe completar todos los campos requeridos.', 'Cerrar', { duration: 2500 });
      return;
    }

    const payloadCentro = {
      nombre: c.nombre!.trim(),
      // ¡IMPORTANTE! debe ser el string del enum de Prisma
      tipo: c.tipo as TipoCentro,
      region: c.region!,
      comuna: c.comuna!,
      convenio: c.convenio as string,
      direccion: c.direccion?.trim(),
      url_rrss: c.url_rrss?.trim(),
      calle: c.calle?.toString().trim() ?? '',
      numero: c.numero ?? '',
      telefono: c.telefono ?? '',
      correo: c.correo?.toString().trim() ?? '',
    };

    const req$ = (this.isEditing && this.editId != null)
      ? this.centrosApi.update(this.editId, payloadCentro)
      : this.centrosApi.create(payloadCentro);

    req$.subscribe({
      next: () => {
        // En edición, además guardamos Director/UTP
        if (this.isEditing && this.editId != null) {
          const centroId = this.editId;
          const toNum = (v?: string | number | null) => {
            const s = (v ?? '').toString().trim();
            return s !== '' ? Number(s) : null;
          };
          const ops: Promise<any>[] = [];

          // DIRECTOR
          if ((this.contactosForm.directorNombre || '').trim() !== '') {
            if (this.contactoDirectorId) {
              ops.push(this.trabajadoresApi.update(this.contactoDirectorId, {
                nombre: this.contactosForm.directorNombre.trim(),
                correo: this.contactosForm.directorCorreo?.trim() || undefined,
                telefono: toNum(this.contactosForm.directorTelefono) ?? undefined,
                rol: 'Director',
                centroId,
              }).toPromise());
            } else {
              ops.push(this.trabajadoresApi.create({
                rut: `TEMP-Director-${centroId}-${Date.now()}`,
                nombre: this.contactosForm.directorNombre.trim(),
                correo: this.contactosForm.directorCorreo?.trim() || undefined,
                telefono: toNum(this.contactosForm.directorTelefono),
                rol: 'Director',
                centroId,
              }).toPromise());
            }
          }

          // UTP
          if ((this.contactosForm.utpNombre || '').trim() !== '') {
            if (this.contactoUtpId) {
              ops.push(this.trabajadoresApi.update(this.contactoUtpId, {
                nombre: this.contactosForm.utpNombre.trim(),
                correo: this.contactosForm.utpCorreo?.trim() || undefined,
                telefono: toNum(this.contactosForm.utpTelefono) ?? undefined,
                rol: 'UTP',
                centroId,
              }).toPromise());
            } else {
              ops.push(this.trabajadoresApi.create({
                rut: `TEMP-UTP-${centroId}-${Date.now()}`,
                nombre: this.contactosForm.utpNombre.trim(),
                correo: this.contactosForm.utpCorreo?.trim() || undefined,
                telefono: toNum(this.contactosForm.utpTelefono),
                rol: 'UTP',
                centroId,
              }).toPromise());
            }
          }

          Promise.all(ops).then(() => {
            this.snack.open('Centro y contactos guardados.', 'OK', { duration: 2000 });
            this.toggleForm(); this.resetForm(); this.load();
          }).catch(() => {
            this.snack.open('Centro guardado, pero falló guardar contactos.', 'Cerrar', { duration: 3000 });
            this.toggleForm(); this.resetForm(); this.load();
          });
        } else {
          // Creación de centro (no toca contactos)
          this.snack.open('Centro agregado.', 'OK', { duration: 2000 });
          this.toggleForm(); this.resetForm(); this.load();
        }
      },
      error: () => this.snack.open('No se pudo guardar el centro.', 'Cerrar', { duration: 2500 })
    });
  }

  editCentro(c: CentroEducativo) {
    this.isEditing = true;
    this.editId = c.id;
    this.showForm = true;
    this.newCentroEducativo = { ...c };
    this.onRegionChange();

    // reiniciar ids
    this.contactoDirectorId = null;
    this.contactoUtpId = null;

    // cargar DIRECTOR
    this.trabajadoresApi.list({ centroId: c.id, rol: 'Director', page: 1, limit: 1 }).subscribe({
      next: r => {
        const d = r.items?.[0];
        if (d) {
          this.contactoDirectorId = d.id;
          this.contactosForm.directorNombre = d.nombre || '';
          this.contactosForm.directorCorreo = d.correo || '';
          this.contactosForm.directorTelefono = d.telefono != null ? String(d.telefono) : '';
        } else {
          this.contactosForm.directorNombre = '';
          this.contactosForm.directorCorreo = '';
          this.contactosForm.directorTelefono = '';
        }
      }
    });

    // cargar UTP
    this.trabajadoresApi.list({ centroId: c.id, rol: 'UTP', page: 1, limit: 1 }).subscribe({
      next: r => {
        const u = r.items?.[0];
        if (u) {
          this.contactoUtpId = u.id;
          this.contactosForm.utpNombre = u.nombre || '';
          this.contactosForm.utpCorreo = u.correo || '';
          this.contactosForm.utpTelefono = u.telefono != null ? String(u.telefono) : '';
        } else {
          this.contactosForm.utpNombre = '';
          this.contactosForm.utpCorreo = '';
          this.contactosForm.utpTelefono = '';
        }
      }
    });
  }

  removeCentro(c: CentroEducativo) {
    if (isPlatformBrowser(this.platformId)) {
      const ok = window.confirm(`¿Eliminar “${c.nombre}” de ${c.comuna}?`);
      if (!ok) return;
    }
    this.centrosApi.delete(c.id).subscribe({
      next: () => { this.snack.open('Centro eliminado.', 'OK', { duration: 2000 }); this.load(); },
      error: () => { this.snack.open('No se pudo eliminar.', 'Cerrar', { duration: 2500 }); }
    });
  }

  // Detalles (dialog) — ahora pide el detalle con trabajadores
  viewCentro(c: CentroEducativo) {
    this.detalleCargando = true;
    this.selectedCentroEducativo = null;

    this.centrosApi.getById(c.id).subscribe({
      next: (full) => {
        // mapeamos a nuestro tipo de UI y preservamos trabajadores
        const base = this.mapDTOtoUI(full);
        this.selectedCentroEducativo = {
          ...base,
          trabajadores: full.trabajadores ?? []
        };
        this.detalleCargando = false;
      },
      error: () => {
        this.detalleCargando = false;
        this.snack.open('No se pudo cargar el detalle.', 'Cerrar', { duration: 2500 });
      }
    });
  }

  closeDetails() { this.selectedCentroEducativo = null; }

  toggleSort() { this.sortAZ = !this.sortAZ; }

  filteredCentros(): CentroEducativo[] {
    const t = this.searchTerm.trim().toLowerCase();
    let list = this.centrosEducativos.filter(c => {
      const matchSearch =
        !t ||
        c.nombre.toLowerCase().includes(t) ||
        c.region.toLowerCase().includes(t) ||
        c.comuna.toLowerCase().includes(t) ||
        (c.tipo || '').toString().toLowerCase().includes(t);

      const matchTipo = this.selectedTipo === 'all' || c.tipo === this.selectedTipo;
      return matchSearch && matchTipo;
    });

    list = [...list].sort((a, b) =>
      this.sortAZ ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)
    );

    return list;
  }
}
