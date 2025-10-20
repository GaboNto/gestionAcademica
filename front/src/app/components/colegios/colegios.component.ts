import { Component, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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
  email?: string;
  telefono?: string;
}

interface Colegio {
  nombre: string;
  tipo: TipoCentro;
  region: string;
  comuna: string;
  direccion: string;
  convenio: Convenio;

  // Opcionales
  rbd?: string;
  sitioWeb?: string;

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
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // UI
  showForm = false;
  searchTerm = '';
  sortAZ = true;

  // Estados de detalles / edición
  selectedColegio: Colegio | null = null;
  editingIndex: number | null = null;
  editColegio: Partial<Colegio> = {};
  editComunasDisponibles: string[] = [];

  // Formulario (alta)
  newColegio: Partial<Colegio> = {
    tipo: 'Público',
    convenio: 'Marco SLEP',
  };

  // Regiones y comunas
  regionesComunas: Record<string, string[]> = {
    'Región de Arica y Parinacota': ['Arica','Camarones','Putre','General Lagos'],
    'Región de Tarapacá': ['Iquique','Alto Hospicio','Pozo Almonte','Camiña','Colchane','Huara','Pica'],
    'Región de Antofagasta': ['Antofagasta','Mejillones','Sierra Gorda','Taltal','Calama','Ollagüe','San Pedro de Atacama','Tocopilla','María Elena'],
    'Región de Atacama': ['Copiapó','Caldera','Tierra Amarilla','Chañaral','Diego de Almagro','Vallenar','Alto del Carmen','Freirina','Huasco'],
    'Región de Coquimbo': ['La Serena','Coquimbo','Andacollo','La Higuera','Paihuano','Vicuña','Illapel','Canela','Los Vilos','Salamanca','Ovalle','Combarbalá','Monte Patria','Punitaqui','Río Hurtado'],
    'Región de Valparaíso': [
      'Valparaíso','Viña del Mar','Concón','Quintero','Puchuncaví','Casablanca','Quilpué','Villa Alemana','Limache','Olmué',
      'Quillota','La Calera','La Cruz','Nogales','Hijuelas','San Antonio','Cartagena','El Tabo','El Quisco','Algarrobo','Santo Domingo',
      'San Felipe','Llaillay','Catemu','Panquehue','Putaendo','Santa María','Los Andes','Calle Larga','Rinconada','San Esteban','Isla de Pascua','Juan Fernández'
    ],
    'Región Metropolitana de Santiago': [
      'Santiago','Cerrillos','Cerro Navia','Conchalí','El Bosque','Estación Central','Huechuraba','Independencia','La Cisterna','La Florida','La Granja','La Pintana','La Reina','Las Condes','Lo Barnechea','Lo Espejo','Lo Prado','Macul','Maipú','Ñuñoa','Pedro Aguirre Cerda','Peñalolén','Providencia','Pudahuel','Quilicura','Quinta Normal','Recoleta','Renca','San Joaquín','San Miguel','San Ramón','Vitacura',
      'Puente Alto','Pirque','San José de Maipo','San Bernardo','Buin','Calera de Tango','Paine','Colina','Lampa','Tiltil','Melipilla','Curacaví','María Pinto','San Pedro','Talagante','El Monte','Isla de Maipo','Padre Hurtado','Peñaflor'
    ],
    'Región del Libertador B. O’Higgins': [],
    'Región del Maule': [],
    'Región de Ñuble': [],
    'Región del Biobío': [],
    'Región de La Araucanía': [],
    'Región de Los Ríos': [],
    'Región de Los Lagos': [],
    'Región de Aysén del G. Carlos Ibáñez del Campo': [],
    'Región de Magallanes y de la Antártica Chilena': [],
  };

  regiones: string[] = Object.keys(this.regionesComunas).sort();
  comunasDisponibles: string[] = [];

  // Datos demo
  colegios: Colegio[] = [
    {
      nombre: 'Liceo Bicentenario Santiago',
      tipo: 'Público',
      region: 'Región Metropolitana de Santiago',
      comuna: 'Santiago',
      direccion: 'Av. Ejemplo 123',
      convenio: 'Marco SLEP',
      rbd: '12345-6',
      sitioWeb: 'https://www.liceobicentenario.cl',
      director: { nombre: 'Carlos Pérez', email: 'c.perez@liceo.cl', telefono: '+56 2 2345 6789' },
      utp:      { nombre: 'Ana Rojas',    email: 'a.rojas@liceo.cl', telefono: '+56 2 2987 6543' }
    }
  ];

  constructor() {
    if (this.newColegio.region) this.onRegionChange(this.newColegio.region);
  }

  // --- Navegación
  goBack() { this.router.navigate(['/dashboard']); }

  // --- Helpers para [(ngModel)] seguro en objetos anidados (alta)
  ensureDirector() {
    if (!this.newColegio.director) this.newColegio.director = { nombre: '' };
  }
  ensureUtp() {
    if (!this.newColegio.utp) this.newColegio.utp = { nombre: '' };
  }

  // --- Helpers para edición
  ensureDirectorEdit() {
    if (!this.editColegio.director) this.editColegio.director = { nombre: '' };
  }
  ensureUtpEdit() {
    if (!this.editColegio.utp) this.editColegio.utp = { nombre: '' };
  }

  // --- Filtro y orden
  filtered(): Colegio[] {
    const t = this.searchTerm.trim().toLowerCase();
    let list = this.colegios.filter(c =>
      !t ||
      c.nombre.toLowerCase().includes(t) ||
      c.region.toLowerCase().includes(t) ||
      c.comuna.toLowerCase().includes(t) ||
      c.tipo.toLowerCase().includes(t)
    );
    if (this.sortAZ) list = [...list].sort((a,b) => a.nombre.localeCompare(b.nombre));
    return list;
  }

  toggleSort() { this.sortAZ = !this.sortAZ; }

  // --- Región -> Comunas (alta)
  onRegionChange(region: string | undefined) {
    if (!region) {
      this.comunasDisponibles = [];
      this.newColegio.comuna = '';
      return;
    }
    this.comunasDisponibles = this.regionesComunas[region] ?? [];
    if (!this.comunasDisponibles.includes(this.newColegio.comuna || '')) {
      this.newColegio.comuna = '';
    }
  }

  // --- Región -> Comunas (edición)
  onRegionChangeEdit(region: string | undefined) {
    if (!region) {
      this.editComunasDisponibles = [];
      this.editColegio.comuna = '';
      return;
    }
    this.editComunasDisponibles = this.regionesComunas[region] ?? [];
    if (!this.editComunasDisponibles.includes(this.editColegio.comuna || '')) {
      this.editColegio.comuna = '';
    }
  }

  // --- Alta
  addColegio() {
    const c = this.newColegio;

    if (!c?.nombre || !c?.tipo || !c?.region || !c?.comuna || !c?.direccion || !c?.convenio) {
      this.snack.open('Debe completar todos los campos requeridos.', 'Cerrar', { duration: 2500 });
      return;
    }

    const exists = this.colegios.some(x =>
      x.nombre.trim().toLowerCase() === c.nombre!.trim().toLowerCase() &&
      x.comuna.trim().toLowerCase() === c.comuna!.trim().toLowerCase()
    );
    if (exists) {
      this.snack.open('Ya existe un centro con ese nombre en la misma comuna.', 'Cerrar', { duration: 2500 });
      return;
    }

    const nuevo: Colegio = {
      nombre: c.nombre!.trim(),
      tipo: c.tipo as TipoCentro,
      region: c.region!,
      comuna: c.comuna!,
      direccion: c.direccion!.trim(),
      convenio: c.convenio as Convenio,
      rbd: c.rbd?.trim() || undefined,
      sitioWeb: c.sitioWeb?.trim() || undefined,
      director: c.director?.nombre
        ? { nombre: c.director.nombre.trim(), email: c.director.email?.trim(), telefono: c.director.telefono?.trim() }
        : undefined,
      utp: c.utp?.nombre
        ? { nombre: c.utp.nombre.trim(), email: c.utp.email?.trim(), telefono: c.utp.telefono?.trim() }
        : undefined
    };

    this.colegios.unshift(nuevo);
    this.snack.open('Centro educativo agregado.', 'OK', { duration: 1800 });

    this.newColegio = { tipo: 'Público', convenio: 'Marco SLEP' };
    this.comunasDisponibles = [];
    this.showForm = false;
  }

  // --- Detalles
  viewDetails(c: Colegio) { this.selectedColegio = c; }
  closeDetails() { this.selectedColegio = null; }

  // --- Edición
  startEdit(c: Colegio, index: number) {
    this.editingIndex = index;
    // Clonar objeto para edición
    this.editColegio = JSON.parse(JSON.stringify(c));
    this.onRegionChangeEdit(this.editColegio.region);
  }

  cancelEdit() {
    this.editingIndex = null;
    this.editColegio = {};
    this.editComunasDisponibles = [];
  }

  saveEdit() {
    const e = this.editColegio;
    if (!e?.nombre || !e?.tipo || !e?.region || !e?.comuna || !e?.direccion || !e?.convenio) {
      this.snack.open('Debe completar todos los campos requeridos.', 'Cerrar', { duration: 2500 });
      return;
    }

    // Duplicados (ignorando el registro actual)
    const dup = this.colegios.some((x, i) =>
      i !== this.editingIndex &&
      x.nombre.trim().toLowerCase() === e.nombre!.trim().toLowerCase() &&
      x.comuna.trim().toLowerCase() === e.comuna!.trim().toLowerCase()
    );
    if (dup) {
      this.snack.open('Ya existe un centro con ese nombre en la misma comuna.', 'Cerrar', { duration: 2500 });
      return;
    }

    const final: Colegio = {
      nombre: e.nombre!.trim(),
      tipo: e.tipo as TipoCentro,
      region: e.region!,
      comuna: e.comuna!,
      direccion: e.direccion!.trim(),
      convenio: e.convenio as Convenio,
      rbd: e.rbd?.trim() || undefined,
      sitioWeb: e.sitioWeb?.trim() || undefined,
      director: e.director?.nombre
        ? { nombre: e.director.nombre.trim(), email: e.director.email?.trim(), telefono: e.director.telefono?.trim() }
        : undefined,
      utp: e.utp?.nombre
        ? { nombre: e.utp.nombre.trim(), email: e.utp.email?.trim(), telefono: e.utp.telefono?.trim() }
        : undefined
    };

    if (this.editingIndex !== null) {
      this.colegios[this.editingIndex] = final;
    }
    this.snack.open('Centro actualizado.', 'OK', { duration: 1800 });
    this.cancelEdit();
  }

  // --- Eliminar
  remove(colegio: Colegio) {
    if (isPlatformBrowser(this.platformId)) {
      const ok = window.confirm(`¿Eliminar "${colegio.nombre}"?`);
      if (!ok) return;
    }
    this.colegios = this.colegios.filter(x => !(x.nombre === colegio.nombre && x.comuna === colegio.comuna));
    this.snack.open('Centro eliminado.', 'OK', { duration: 1800 });
  }
}
