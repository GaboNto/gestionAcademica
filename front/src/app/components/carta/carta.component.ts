import { Component, Inject, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { PLATFORM_ID } from '@angular/core';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

type TipoPractica =
  | 'Apoyo a la Docencia I'
  | 'Apoyo a la Docencia II'
  | 'Apoyo a la Docencia III'
  | 'Práctica Profesional';

interface Estudiante {
  id: number;
  nombre: string;
  rut: string;
}

interface ContactoCentro {
  nombre: string;
  correo?: string;
}

interface Centro {
  id: number;
  nombre: string;
  region: string;
  comuna: string;
  convenio: 'Marco SLEP' | 'Solicitud directa' | 'ADEP';
  direccion?: string;
  director?: ContactoCentro;
  utp?: ContactoCentro;
}

@Component({
  standalone: true,
  selector: 'app-carta',
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatDatepickerModule, MatNativeDateModule, MatDialogModule, MatSnackBarModule
  ]
})
export class CartaComponent {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);

  // ===== Datos mock (reemplazar con servicios luego) =====
  estudiantes: Estudiante[] = [
    { id: 1, nombre: 'Almendra Rojas Quiroga', rut: '21.879.810-1' },
    { id: 2, nombre: 'Pedro Caquisane Calle',   rut: '22.111.989-4' },
    { id: 3, nombre: 'Daniel Soto Pérez',       rut: '19.555.666-7' },
  ];

  centros: Centro[] = [
    {
      id: 10, nombre: 'Escuela Rómulo Peña Maturana',
      region: 'Arica y Parinacota', comuna: 'Arica',
      convenio: 'Marco SLEP', direccion: 'Las Acacias 2283',
      director: { nombre: 'Gabriela Martínez Loreto' },
      utp: { nombre: 'Ana Rojas' }
    },
    {
      id: 11, nombre: 'Liceo Bicentenario Santiago',
      region: 'Región Metropolitana', comuna: 'Santiago',
      convenio: 'Solicitud directa', director: { nombre: 'Carlos Pérez' },
      utp: { nombre: 'Ana Rojas' }
    }
  ];

  tiposPractica: TipoPractica[] = [
    'Apoyo a la Docencia I',
    'Apoyo a la Docencia II',
    'Apoyo a la Docencia III',
    'Práctica Profesional'
  ];

  // ===== Form principal (sin fecha ni folio visibles; se calculan) =====
  form = this.fb.group({
    tipoPractica:   ['Apoyo a la Docencia I' as TipoPractica, Validators.required],
    centroId:       [null as number | null, Validators.required],
    estudiantesIds: [[] as number[], [Validators.required, Validators.minLength(1)]],
    periodoInicio:  [null as Date | null, Validators.required],
    periodoFin:     [null as Date | null, Validators.required],
  });

  // ===== Filtros de select (buscador de estudiantes) =====
  studentFilter = '';
  get filteredStudents(): Estudiante[] {
    const term = this.studentFilter.trim().toLowerCase();
    if (!term) return this.estudiantes;
    return this.estudiantes.filter(e =>
      e.nombre.toLowerCase().includes(term) ||
      e.rut.toLowerCase().includes(term)
    );
  }

  // ===== Constantes de Jefatura (no se preguntan) =====
  private readonly JEFATURA_NOMBRE = 'Dr. IGNACIO JARA PARRA';
  private readonly JEFATURA_CARGO  = 'Jefe de Carrera';

  // ===== Helpers UI =====
  get centroSeleccionado(): Centro | undefined {
    const id = this.form.value.centroId ?? null;
    return this.centros.find(c => c.id === id!);
  }
  get alumnosSeleccionados(): Estudiante[] {
    const ids = this.form.value.estudiantesIds ?? [];
    return this.estudiantes.filter(e => ids.includes(e.id));
  }
  get plural(): boolean { return this.alumnosSeleccionados.length > 1; }

  // ===== Generación de texto (fecha/folio internos) =====
  private fechaLarga(d: Date | null): string {
    if (!d) return '';
    const f = new Date(d);
    return f.toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  private fechaHoy(): string {
    const f = new Date();
    return this.fechaLarga(f);
  }

  private listaEstudiantes(): string {
    return this.alumnosSeleccionados
      .map(s => `• ${s.nombre}, Rut ${s.rut}`)
      .join('\n');
  }

  private destinatario(): { linea: string; cargo: string } {
    const c = this.centroSeleccionado;
    if (!c) return { linea: 'Señor(a)', cargo: '' };
    if (c.director?.nombre) return { linea: c.director.nombre, cargo: 'Director(a)' };
    if (c.utp?.nombre)      return { linea: c.utp.nombre,      cargo: 'UTP' };
    return { linea: 'Señor(a)', cargo: '' };
  }

  private encabezado(refConFolio: boolean, folio?: string): string {
    const ciudad = this.centroSeleccionado?.comuna || 'Arica';
    const fecha  = this.fechaHoy();
    const refLabel = 'SOLICITUD DE AUTORIZACIÓN PARA PRÁCTICA';
    const folioTxt = refConFolio && folio ? `\n\nPHG N° ${folio}.-\n` : '\n\n';
    return `REF.: ${refLabel}\n\n${ciudad.toUpperCase()}, ${fecha}.-${folioTxt}`;
  }

  private saludo(): string {
    const c = this.centroSeleccionado;
    const { linea, cargo } = this.destinatario();
    const centro    = c?.nombre || '';
    const direccion = c?.direccion || '';
    const cargoLinea = cargo ? `\n${cargo}` : '';
    return `Señor(a)\n${linea}${cargoLinea}\n${centro}\n${direccion}\nPresente\n\nDe mi consideración:\n`;
  }

  /** Cuerpo basado en tu PDF, adaptado a singular/plural y datos dinámicos */
  private cuerpoSegunPDF(): string {
    const tipo = this.form.value.tipoPractica;
    const periodoIni = this.form.value.periodoInicio ? this.fechaLarga(this.form.value.periodoInicio) : '';
    const periodoFin = this.form.value.periodoFin    ? this.fechaLarga(this.form.value.periodoFin)    : '';
    const periodoTxt = (periodoIni && periodoFin) ? `, entre el ${periodoIni} y el ${periodoFin}` : '';

    const intro =
      `Conforme a lo establecido en el currículo de la Carrera de Pedagogía en Historia y Geografía, ` +
      `solicitamos su autorización para que ${this.plural ? 'los siguientes estudiantes realicen' : 'el siguiente estudiante realice'} ` +
      `${this.plural ? 'sus' : 'su'} práctica **${tipo}** en ese establecimiento${periodoTxt}:`;

    const adjuntos =
`La tutora de práctica responsable es la Srta. Carolina Quintana Talvac.

Adjuntamos el detalle de la estructura de la práctica solicitada, junto con los siguientes documentos:
• Credencial del profesor en práctica.
• Perfiles de egreso.
• Ficha de seguro escolar (Decreto Ley N.º 16.774) de cada estudiante.
• Responsabilidades del docente colaborador en el aula.

Agradecemos de antemano las facilidades y quedamos atentos a su respuesta.\n`;

    const firma =
`Se despide atentamente,

${this.JEFATURA_NOMBRE}
${this.JEFATURA_CARGO}
Facultad de Educación y Humanidades
Universidad de Tarapacá`;

    return `${intro}\n\n${this.listaEstudiantes()}\n\n${adjuntos}\n${firma}`;
  }

  private documentoPlano(refConFolio: boolean, folio?: string): string {
    const encabezado = this.encabezado(refConFolio, folio);
    const saludo     = this.saludo();
    const cuerpo     = this.cuerpoSegunPDF();
    return `${encabezado}\n${saludo}${cuerpo}\n\nAdj.: Lo indicado.\nc.c.: Archivo`;
  }

  // ===== Folio: solo se asigna al "Grabar" =====
  private nextFolio(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    const key = 'app.carta.folio';
    const y = new Date().getFullYear();
    const raw = localStorage.getItem(key);
    let n = 0; let lastYear = y;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { year: number; n: number };
        lastYear = parsed.year; n = parsed.n;
      } catch {}
    }
    if (lastYear !== y) n = 0;
    n++;
    localStorage.setItem(key, JSON.stringify({ year: y, n }));
    // Formato sugerido: 028/2025 (3 dígitos + año)
    return `${String(n).padStart(3, '0')}/${y}`;
  }

  // ===== Acciones =====
  previa() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Completa los campos requeridos (centro, estudiantes, periodo).', 'OK', { duration: 2000 });
      return;
    }
    // Previa SIN folio
    const html = this.htmlCarta(this.documentoPlano(false), false);
    this.dialog.open(PreviaDialogComponent, {
      data: { html },
      width: '900px',
      maxHeight: '90vh'
    });
  }

  grabar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Completa los campos requeridos (centro, estudiantes, periodo).', 'OK', { duration: 2000 });
      return;
    }
    // Asigna folio y abre vista "definitiva"
    const folio = this.nextFolio();
    const html = this.htmlCarta(this.documentoPlano(true, folio), true);
    if (isPlatformBrowser(this.platformId)) {
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      }
    }
    this.snack.open(`Carta generada con folio ${folio}.`, 'OK', { duration: 2200 });
  }

  limpiar() {
    this.form.reset({
      tipoPractica: 'Apoyo a la Docencia I',
      centroId: null,
      estudiantesIds: [],
      periodoInicio: null,
      periodoFin: null
    });
    this.studentFilter = '';
  }

  // ===== Render HTML imprimible =====
  private htmlCarta(texto: string, definitiva = false): string {
    return `
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Carta</title>
<style>
  body{font-family:ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans"; margin:40px;}
  .doc{white-space:pre-wrap; line-height:1.35; font-size:14px;}
  header{display:flex; align-items:center; gap:12px; margin-bottom:16px;}
  header img{height:40px}
  .meta{color:#64748b; font-size:12px; margin-bottom:16px}
  .acciones{display:flex; gap:8px; margin-top:16px}
  hr{border:none; border-top:1px solid #e5e7eb; margin:16px 0}
</style>
</head>
<body>
  <header>
    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Universidad_de_Tarapac%C3%A1_Logo.png" alt="UTA">
    <div><b>Carrera de Pedagogía en Historia y Geografía</b><div class="meta">Av. 18 de Septiembre N°2222 · Arica · pedhg@gestion.uta.cl · +56 58 2205253</div></div>
  </header>
  <hr/>
  <div class="doc">${texto.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}</div>
  ${definitiva ? '' : '<hr/><div class="meta">Vista previa (no definitiva)</div>'}
</body>
</html>`;
  }
}

/** Dialog para la vista previa */
@Component({
  standalone: true,
  selector: 'app-previa-dialog',
  template: `
    <h2 mat-dialog-title>Vista previa</h2>
    <mat-dialog-content>
      <iframe [srcdoc]="data.html" style="width:100%;height:70vh;border:1px solid #e5e7eb;border-radius:8px"></iframe>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule, MatButtonModule]
})
export class PreviaDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { html: string }) {}
}
