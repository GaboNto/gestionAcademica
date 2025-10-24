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

interface CentroEducativo {
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

  // ===== UI =====
  showForm = false;
  isEditing = false;
  sortAZ = true;

  // ===== filtros (lista) =====
  searchTerm = '';
  selectedTipo: 'all' | TipoCentro = 'all';

  // ===== regiones y comunas =====
  readonly REGIONES: { nombre: string; comunas: string[] }[] = [
    { nombre: 'Región de Arica y Parinacota', comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos'] },
    { nombre: 'Región de Tarapacá',           comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte'] },
    { nombre: 'Región Metropolitana de Santiago', comunas: ['Santiago', 'Providencia', 'Las Condes', 'La Florida', 'Puente Alto', 'Maipú'] },
  ];
  comunasFiltradas: string[] = [];

  // ===== formulario =====
  private idCounter = 1;
  editId: number | null = null;

  newCentroEducativo: Partial<CentroEducativo> = {
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
  centrosEducativos: CentroEducativo[] = [
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

  selectedCentroEducativo: CentroEducativo | null = null;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('app.centrosEducativos'); // ← clave nueva
      if (saved) {
        try {
          const list = JSON.parse(saved) as CentroEducativo[];
          if (Array.isArray(list) && list.length) {
            this.centrosEducativos = list;
            this.idCounter = Math.max(...this.centrosEducativos.map(c => c.id)) + 1;
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
    const region = this.newCentroEducativo.region || '';
    const reg = this.REGIONES.find(r => r.nombre === region);
    this.comunasFiltradas = reg ? reg.comunas : [];
    if (!this.comunasFiltradas.includes(this.newCentroEducativo.comuna || '')) {
      this.newCentroEducativo.comuna = '';
    }
  }

  private persist() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('app.centrosEducativos', JSON.stringify(this.centrosEducativos));
    }
  }

  private resetForm() {
    this.isEditing = false;
    this.editId = null;
    this.newCentroEducativo = {
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
  addOrUpdateCentro() {
    const c = this.newCentroEducativo;

    if (!c.nombre?.trim() || !c.tipo || !c.region || !c.comuna || !c.convenio) {
      this.snack.open('Debe completar todos los campos requeridos.', 'Cerrar', { duration: 2500 });
      return;
    }

    const dup = this.centrosEducativos.some(x =>
      x.nombre.trim().toLowerCase() === c.nombre!.trim().toLowerCase() &&
      x.comuna === c.comuna &&
      (!this.isEditing || x.id !== this.editId)
    );
    if (dup) {
      this.snack.open('Ya existe un centro educativo con ese nombre en la misma comuna.', 'Cerrar', { duration: 2500 });
      return;
    }

    if (this.isEditing && this.editId != null) {
      const idx = this.centrosEducativos.findIndex(x => x.id === this.editId);
      if (idx > -1) {
        this.centrosEducativos[idx] = {
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
      const nuevo: CentroEducativo = {
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
      this.centrosEducativos.unshift(nuevo);
      this.snack.open('Centro agregado.', 'OK', { duration: 2000 });
    }

    this.persist();
    this.toggleForm();
  }

  editCentro(c: CentroEducativo) {
    this.isEditing = true;
    this.editId = c.id;
    this.showForm = true;
    this.newCentroEducativo = {
      ...c,
      director: { ...(c.director || { nombre: '', correo: '', telefono: '' }) },
      utp:      { ...(c.utp || { nombre: '', correo: '', telefono: '' }) },
    };
    this.onRegionChange();
  }

  removeCentro(c: CentroEducativo) {
    if (isPlatformBrowser(this.platformId)) {
      const ok = window.confirm(`¿Eliminar “${c.nombre}” de ${c.comuna}?`);
      if (!ok) return;
    }
    this.centrosEducativos = this.centrosEducativos.filter(x => x.id !== c.id);
    this.persist();
    this.snack.open('Centro eliminado.', 'OK', { duration: 2000 });
  }

  viewCentro(c: CentroEducativo) { this.selectedCentroEducativo = c; }
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
