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

type TipoCentro = 'Particular' | 'Particular subvencionado' | 'Público';
type Convenio   = 'Marco SLEP' | 'Solicitud directa' | 'ADEP';

interface ContactoCentro {
  nombre: string;
  correo?: string;
  telefono?: string;
}

interface Colegio {
  id: number;
  nombre: string;
  tipo: TipoCentro;
  region: string;
  comuna: string;
  convenio: Convenio;
  direccion?: string;
  url_rrss?: string;
  director?: ContactoCentro;
  utp?: ContactoCentro;
}

@Component({
  standalone: true,
  selector: 'app-colegios',
  templateUrl: './colegios.component.html',
  styleUrls: ['./colegios.component.scss'],
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule
  ]
})
export class ColegiosComponent {
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  // ===== UI =====
  showForm = false;
  isEditing = false;
  sortAZ = true;

  // ===== filtros (lista) =====
  searchTerm = '';
  selectedTipo: 'all' | TipoCentro = 'all';

  // ===== regiones y comunas =====
  // (puedes ampliar el catálogo sin tocar el resto del código)
  readonly REGIONES: { nombre: string; comunas: string[] }[] = [
    { nombre: 'Región de Arica y Parinacota', comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos'] },
    { nombre: 'Región de Tarapacá',           comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte'] },
    { nombre: 'Región Metropolitana de Santiago', comunas: ['Santiago', 'Providencia', 'Las Condes', 'La Florida', 'Puente Alto', 'Maipú'] },
  ];
  comunasFiltradas: string[] = [];

  // ===== formulario =====
  private idCounter = 1;
  editId: number | null = null;

  newColegio: Partial<Colegio> = {
    nombre: '',
    tipo: 'Público',
    region: '',
    comuna: '',
    convenio: 'Marco SLEP',
    direccion: '',
    url_rrss: '',
    director: { nombre: '', correo: '', telefono: '' },
    utp:      { nombre: '', correo: '', telefono: '' },
  };

  // ===== datos (mock + persistencia local) =====
  colegios: Colegio[] = [
    {
      id: this.idCounter++,
      nombre: 'Liceo Bicentenario Santiago',
      tipo: 'Público',
      region: 'Región Metropolitana de Santiago',
      comuna: 'Santiago',
      convenio: 'Marco SLEP',
      director: { nombre: 'Carlos Pérez' },
      utp: { nombre: 'Ana Rojas' }
    },
    {
      id: this.idCounter++,
      nombre: 'Colegio Saucache',
      tipo: 'Particular subvencionado',
      region: 'Región de Arica y Parinacota',
      comuna: 'Arica',
      convenio: 'Solicitud directa',
      director: { nombre: 'Guillermo Quintanilla' },
      utp: { nombre: 'Nora Pizarro' }
    }
  ];

  selectedColegio: Colegio | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('app.colegios');
      if (saved) {
        try {
          const list = JSON.parse(saved) as Colegio[];
          if (Array.isArray(list) && list.length) {
            this.colegios = list;
            // recalcular idCounter
            this.idCounter = Math.max(...this.colegios.map(c => c.id)) + 1;
          }
        } catch {}
      }
    }
  }

  // ===== helpers UI =====
  toggleForm() {
    this.showForm = !this.showForm;
    if (!this.showForm) this.resetForm();
  }

  onRegionChange() {
    const region = this.newColegio.region || '';
    const reg = this.REGIONES.find(r => r.nombre === region);
    this.comunasFiltradas = reg ? reg.comunas : [];
    // reset comuna si no pertenece a la lista filtrada
    if (!this.comunasFiltradas.includes(this.newColegio.comuna || '')) {
      this.newColegio.comuna = '';
    }
  }

  private persist() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('app.colegios', JSON.stringify(this.colegios));
    }
  }

  private resetForm() {
    this.isEditing = false;
    this.editId = null;
    this.newColegio = {
      nombre: '',
      tipo: 'Público',
      region: '',
      comuna: '',
      convenio: 'Marco SLEP',
      direccion: '',
      url_rrss: '',
      director: { nombre: '', correo: '', telefono: '' },
      utp:      { nombre: '', correo: '', telefono: '' },
    };
    this.comunasFiltradas = [];
  }

  // ===== CRUD =====
  addOrUpdateColegio() {
    const c = this.newColegio;

    // validaciones mínimas
    if (!c.nombre?.trim() || !c.tipo || !c.region || !c.comuna || !c.convenio) {
      this.snack.open('Debe completar todos los campos requeridos.', 'Cerrar', { duration: 2500 });
      return;
    }

    // evitar duplicados (nombre + comuna)
    const dup = this.colegios.some(x =>
      x.nombre.trim().toLowerCase() === c.nombre!.trim().toLowerCase() &&
      x.comuna === c.comuna &&
      (!this.isEditing || x.id !== this.editId)
    );
    if (dup) {
      this.snack.open('Ya existe un centro educativo con ese nombre en la misma comuna.', 'Cerrar', { duration: 2500 });
      return;
    }

    if (this.isEditing && this.editId != null) {
      const idx = this.colegios.findIndex(x => x.id === this.editId);
      if (idx > -1) {
        this.colegios[idx] = {
          id: this.editId,
          nombre: c.nombre!.trim(),
          tipo: c.tipo as TipoCentro,
          region: c.region!,
          comuna: c.comuna!,
          convenio: c.convenio as Convenio,
          direccion: c.direccion?.trim(),
          url_rrss: c.url_rrss?.trim(),
          director: { ...(c.director || { nombre: '' }) },
          utp:      { ...(c.utp || { nombre: '' }) },
        };
        this.snack.open('Centro actualizado.', 'OK', { duration: 2000 });
      }
    } else {
      const nuevo: Colegio = {
        id: this.idCounter++,
        nombre: c.nombre!.trim(),
        tipo: c.tipo as TipoCentro,
        region: c.region!,
        comuna: c.comuna!,
        convenio: c.convenio as Convenio,
        direccion: c.direccion?.trim(),
        url_rrss: c.url_rrss?.trim(),
        director: { ...(c.director || { nombre: '' }) },
        utp:      { ...(c.utp || { nombre: '' }) },
      };
      this.colegios.unshift(nuevo);
      this.snack.open('Centro agregado.', 'OK', { duration: 2000 });
    }

    this.persist();
    this.toggleForm();
  }

  edit(c: Colegio) {
    this.isEditing = true;
    this.editId = c.id;
    this.showForm = true;
    this.newColegio = {
      ...c,
      director: { ...(c.director || { nombre: '', correo: '', telefono: '' }) },
      utp:      { ...(c.utp || { nombre: '', correo: '', telefono: '' }) },
    };
    this.onRegionChange();
  }

  remove(c: Colegio) {
    if (isPlatformBrowser(this.platformId)) {
      const ok = window.confirm(`¿Eliminar “${c.nombre}” de ${c.comuna}?`);
      if (!ok) return;
    }
    this.colegios = this.colegios.filter(x => x.id !== c.id);
    this.persist();
    this.snack.open('Centro eliminado.', 'OK', { duration: 2000 });
  }

  view(c: Colegio) {
    this.selectedColegio = c;
  }
  closeDetails() { this.selectedColegio = null; }

  // ordenar por nombre
  toggleSort() { this.sortAZ = !this.sortAZ; }

  // ===== filtro listado =====
  filtered(): Colegio[] {
    const t = this.searchTerm.trim().toLowerCase();

    let list = this.colegios.filter(c => {
      const matchSearch =
        !t ||
        c.nombre.toLowerCase().includes(t) ||
        c.region.toLowerCase().includes(t) ||
        c.comuna.toLowerCase().includes(t) ||
        c.tipo.toLowerCase().includes(t);

      const matchTipo = this.selectedTipo === 'all' || c.tipo === this.selectedTipo;

      return matchSearch && matchTipo;
    });

    list = [...list].sort((a, b) =>
      this.sortAZ
        ? a.nombre.localeCompare(b.nombre)
        : b.nombre.localeCompare(a.nombre)
    );

    return list;
  }
}
