import { Component, Inject, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
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

// jsPDF
import { jsPDF } from 'jspdf';

// Tipos
type TipoPractica =
  | 'Apoyo a la Docencia I'
  | 'Apoyo a la Docencia II'
  | 'Apoyo a la Docencia III'
  | 'Práctica Profesional';

interface Estudiante { id: number; nombre: string; rut: string; }
interface ContactoCentro { nombre: string; correo?: string; }
interface Centro {
  id: number; nombre: string; region: string; comuna: string;
  convenio: 'Marco SLEP' | 'Solicitud directa' | 'ADEP';
  direccion?: string; director?: ContactoCentro; utp?: ContactoCentro;
}

type Trato = 'Srta.' | 'Sra.' | 'Sr.';
interface Supervisor { id: number; nombre: string; trato?: Trato; correo?: string }

@Component({
  standalone: true,
  selector: 'app-carta',
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss'],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatIconModule, MatButtonModule, MatDividerModule,
    MatDatepickerModule, MatNativeDateModule, MatDialogModule, MatSnackBarModule,
  ],
})
export class CartaComponent {
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  // ===== Mock de datos =====
  estudiantes: Estudiante[] = [
    { id: 1, nombre: 'Almendra Rojas Quiroga', rut: '21.879.810-1' },
    { id: 2, nombre: 'Pedro Caquisane Calle',  rut: '22.111.989-4' },
    { id: 3, nombre: 'Daniel Soto Pérez',      rut: '19.555.666-7' },
  ];

  centros: Centro[] = [
    {
      id: 10, nombre: 'Escuela Rómulo Peña Maturana',
      region: 'Arica y Parinacota', comuna: 'Arica',
      convenio: 'Marco SLEP', direccion: 'Las Acacias 2283',
      director: { nombre: 'Gabriela Martínez Loreto' }, utp: { nombre: 'Ana Rojas' }
    },
    {
      id: 11, nombre: 'Liceo Bicentenario Santiago',
      region: 'Región Metropolitana', comuna: 'Santiago',
      convenio: 'Solicitud directa', director: { nombre: 'Carlos Pérez' }, utp: { nombre: 'Ana Rojas' }
    },
  ];

  // Nueva lista de personas tutoras (mock)
  supervisores: Supervisor[] = [
    { id: 101, nombre: 'Carolina Quintana Talvac', trato: 'Srta.' },
    { id: 102, nombre: 'María José Fuentes', trato: 'Sra.' },
    { id: 103, nombre: 'Ignacio Rojas', trato: 'Sr.' },
  ];

  tiposPractica: TipoPractica[] = [
    'Apoyo a la Docencia I', 'Apoyo a la Docencia II',
    'Apoyo a la Docencia III', 'Práctica Profesional',
  ];

  // ===== Form =====
  form = this.fb.group(
    {
      tipoPractica: ['Apoyo a la Docencia I' as TipoPractica, Validators.required],
      centroId: [null as number | null, Validators.required],
      estudiantesIds: [[] as number[], [Validators.required, Validators.minLength(1)]],
      supervisorId: [null as number | null, Validators.required],     // NUEVO
      periodoInicio: [null as Date | null, Validators.required],
      periodoFin: [null as Date | null, Validators.required],
    },
    { validators: [periodoValidator] }
  );

  // ===== Filtros de select con buscador =====
  studentFilter = '';
  supervisorFilter = ''; // NUEVO

  get filteredStudents(): Estudiante[] {
    const t = this.studentFilter.trim().toLowerCase();
    if (!t) return this.estudiantes;
    return this.estudiantes.filter(e => e.nombre.toLowerCase().includes(t) || e.rut.toLowerCase().includes(t));
  }
  get filteredSupervisores(): Supervisor[] {
    const t = this.supervisorFilter.trim().toLowerCase();
    if (!t) return this.supervisores;
    return this.supervisores.filter(s => s.nombre.toLowerCase().includes(t));
  }

  _markForCheck(){ this.cdr.markForCheck(); }

  private readonly JEFATURA_NOMBRE = 'Dr. IGNACIO JARA PARRA';
  private readonly JEFATURA_CARGO  = 'Jefe de Carrera';

  // ===== Helpers selección =====
  get centroSeleccionado(): Centro | undefined {
    const id = this.form.value.centroId ?? null;
    return this.centros.find(c => c.id === id!);
  }
  get alumnosSeleccionados(): Estudiante[] {
    const ids = this.form.value.estudiantesIds ?? [];
    return this.estudiantes.filter(e => ids.includes(e.id));
  }
  get supervisorSeleccionado(): Supervisor | undefined {
    const id = this.form.value.supervisorId ?? null;
    return this.supervisores.find(s => s.id === id!);
  }
  get plural(): boolean { return this.alumnosSeleccionados.length > 1; }

  // ===== Fechas =====
  private fechaLarga(d: Date | null): string {
    if (!d) return '';
    const f = new Date(d);
    return f.toLocaleDateString('es-CL', { year:'numeric', month:'long', day:'numeric' });
  }
  private fechaHoy(): string { return this.fechaLarga(new Date()); }

  // ===== Texto carta =====
  private listaEstudiantes(): string {
    return this.alumnosSeleccionados.map(s => `• ${s.nombre}, Rut ${s.rut}`).join('\n');
  }
  private destinatario(): { linea: string; cargo: string } {
    const c = this.centroSeleccionado;
    if (!c) return { linea: 'Señor(a)', cargo: '' };
    if (c.director?.nombre) return { linea: c.director.nombre, cargo: 'Director(a)' };
    if (c.utp?.nombre) return { linea: c.utp.nombre, cargo: 'UTP' };
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
    const centro = c?.nombre || '';
    const direccion = c?.direccion || '';
    const cargoLinea = cargo ? `\n${cargo}` : '';
    return `Señor(a)\n${linea}${cargoLinea}\n${centro}\n${direccion}\nPresente\n\nDe mi consideración:\n`;
  }

  private cuerpoSegunPDF(): string {
    const tipo = this.form.value.tipoPractica;
    const pi = this.form.value.periodoInicio ? this.fechaLarga(this.form.value.periodoInicio) : '';
    const pf = this.form.value.periodoFin ? this.fechaLarga(this.form.value.periodoFin) : '';
    const periodoTxt = (pi && pf) ? `, entre el ${pi} y el ${pf}` : '';

    const intro =
      `Conforme a lo establecido en el currículo de la Carrera de Pedagogía en Historia y Geografía, ` +
      `solicitamos su autorización para que ${this.plural ? 'los siguientes estudiantes realicen' : 'el siguiente estudiante realice'} ` +
      `${this.plural ? 'sus' : 'su'} práctica ${tipo} en ese establecimiento${periodoTxt}:`;

    // Supervisor dinámico
    const sup = this.supervisorSeleccionado;
    const supLinea = sup
      ? `La tutora de práctica responsable es la ${sup.trato ?? ''} ${sup.nombre}.`.replace(/\s+/g, ' ').trim()
      : 'La tutora de práctica responsable es la Srta. Carolina Quintana Talvac.'; // fallback

    const adjuntos = `${supLinea}

Adjuntamos el detalle de la estructura de la práctica solicitada, junto con los siguientes documentos:
• Credencial del profesor en práctica.
• Perfiles de egreso.
• Ficha de seguro escolar (Decreto Ley N.º 16.774) de cada estudiante.
• Responsabilidades del docente colaborador en el aula.

Agradecemos de antemano las facilidades y quedamos atentos a su respuesta.
`;

    const firma = `Se despide atentamente,

${this.JEFATURA_NOMBRE}
${this.JEFATURA_CARGO}
Facultad de Educación y Humanidades
Universidad de Tarapacá`;

    return `${intro}\n\n${this.listaEstudiantes()}\n\n${adjuntos}\n${firma}`;
  }

  private documentoPlano(refConFolio: boolean, folio?: string): string {
    return `${this.encabezado(refConFolio, folio)}\n${this.saludo()}${this.cuerpoSegunPDF()}\n\nAdj.: Lo indicado.\nc.c.: Archivo`;
  }

  // ===== Folio =====
  private nextFolio(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    const key = 'app.carta.folio';
    const y = new Date().getFullYear();
    const raw = localStorage.getItem(key);
    let n = 0, lastYear = y;
    if (raw) { try { const p = JSON.parse(raw) as {year:number;n:number}; lastYear=p.year; n=p.n; } catch {} }
    if (lastYear !== y) n = 0;
    n++;
    localStorage.setItem(key, JSON.stringify({year:y, n}));
    return `${String(n).padStart(3,'0')}/${y}`;
  }

  // ===== Acciones =====
  previa() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Completa los campos requeridos (centro, estudiantes, supervisor y periodo).', 'OK', { duration: 2200 });
      return;
    }
    this.crearYMostrarPDF(this.documentoPlano(false), 'Vista previa de carta');
  }

  grabar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Completa los campos requeridos (centro, estudiantes, supervisor y periodo).', 'OK', { duration: 2200 });
      return;
    }
    const folio = this.nextFolio();
    this.crearYMostrarPDF(this.documentoPlano(true, folio), `Carta folio ${folio}`);
    this.snack.open(`Carta generada con folio ${folio}.`, 'OK', { duration: 2400 });
  }

  limpiar() {
    this.form.reset({
      tipoPractica: 'Apoyo a la Docencia I',
      centroId: null,
      estudiantesIds: [],
      supervisorId: null,
      periodoInicio: null,
      periodoFin: null,
    });
    this.studentFilter = '';
    this.supervisorFilter = '';
  }

  // ====== Generación PDF con jsPDF ======
  private crearYMostrarPDF(texto: string, titulo: string) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' }); // 612 x 792 pt
    const margin = { left: 56, top: 64, right: 56, bottom: 64 };
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin.left - margin.right;
    let y = margin.top;

    // Encabezado
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Carrera de Pedagogía en Historia y Geografía', margin.left, y); y += 14;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text('Facultad de Educación y Humanidades — Universidad de Tarapacá', margin.left, y); y += 12;
    doc.setTextColor(100);
    doc.text('Av. 18 de Septiembre N°2222 · Arica · pedhg@gestion.uta.cl · +56 58 2205253', margin.left, y);
    doc.setTextColor(0);
    y += 14;
    // Separador
    doc.setDrawColor(180); doc.setLineWidth(0.5);
    doc.line(margin.left, y, pageWidth - margin.right, y);
    y += 16;

    // Cuerpo (párrafos)
    const paragraphs = texto.split('\n\n');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setLineHeightFactor(1.25);

    for (const p of paragraphs) {
      const lines = doc.splitTextToSize(p, contentWidth);
      const height = lines.length * 14;
      if (y + height > pageHeight - margin.bottom) {
        doc.addPage(); y = margin.top;
      }
      doc.text(lines, margin.left, y);
      y += height + 8;
    }

    const dataUrl = doc.output('datauristring');
    this.dialog.open(PdfDialogComponent, {
      data: { dataUrl, title: titulo },
      width: '980px',
      maxHeight: '95vh',
    });
  }
}

/* ========= Visor PDF ========= */
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  standalone: true,
  selector: 'app-pdf-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <iframe
        [src]="safeUrl"
        style="width:100%;height:75vh;border:1px solid #e5e7eb;border-radius:8px"
      ></iframe>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule, MatButtonModule],
})
export class PdfDialogComponent {
  safeUrl: SafeResourceUrl;
  constructor(
    private sanitizer: DomSanitizer,
    @Inject(MAT_DIALOG_DATA) public data: { dataUrl: string; title: string }
  ) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.data.dataUrl);
  }
}

/* ========= Validator de periodo ========= */
function periodoValidator(group: AbstractControl): ValidationErrors | null {
  const ini = group.get('periodoInicio')?.value as Date | null;
  const fin = group.get('periodoFin')?.value as Date | null;
  if (ini && fin && new Date(fin).getTime() <= new Date(ini).getTime()) {
    return { periodoInvalido: true };
  }
  return null;
}
