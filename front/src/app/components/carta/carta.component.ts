// carta.component.ts
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
// --- LÍNEA CORREGIDA ---
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
// -------------------------

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Servicios y Tipos de Datos
import {
  CartaDataService,
  ApiCentro,
  ApiEstudiante,
  ApiSupervisor,
  CreateCartaDto,
} from '../../services/carta-data.service';

// PDF
import { jsPDF } from 'jspdf';
import { PdfDialogComponent } from './pdf-dialog.component'; // Asegúrate que la ruta sea correcta

interface PdfAsset {
  dataUrl: string;
  width: number;
  height: number;
}

@Component({
  selector: 'app-carta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Material
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss'],
})
export class CartaComponent {
  private fb = inject(FormBuilder);
  private data = inject(CartaDataService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private logosCargados = false;
  private logoUtaImg: PdfAsset | null = null;
  private logoFehImg: PdfAsset | null = null;

  private readonly TIPOS_PRACTICA_FALLBACK = [
    'Apoyo a la Docencia I',
    'Apoyo a la Docencia II',
    'Apoyo a la Docencia III',
    'Practica Profesional',
  ];

  // --- Catálogos ---
  tiposPractica: string[] = [...this.TIPOS_PRACTICA_FALLBACK];
  centros: ApiCentro[] = [];
  estudiantes: ApiEstudiante[] = [];
  supervisores: ApiSupervisor[] = [];

  // --- Filtros ---
  studentFilter = '';
  supervisorFilter = '';
  filteredStudents: ApiEstudiante[] = [];
  filteredSupervisores: ApiSupervisor[] = [];

  // --- Estado ---
  centroSeleccionado: ApiCentro | null = null;

  // ==========================
  //  FORMULARIO REACTIVO
  // ==========================

  // --- Formulario ---
  form = this.fb.group(
    {
      tipoPractica: ['', Validators.required],
      centroId: [null as number | null, Validators.required],

      // Se guardan los RUTs (string[])
      estudiantesIds: this.fb.control<string[]>([], {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(1)],
      }),

      supervisorId: [null as number | null, Validators.required],
      periodoInicio: [null as Date | null, Validators.required],
      periodoFin: [null as Date | null, Validators.required],

      // 🔹 Campos de configuración de la carta
      referencia: ['', [Validators.required, Validators.maxLength(150)]],
      jefaturaNombre: ['', Validators.required],
      jefaturaCargo: ['', Validators.required],
      folioManual: [''],
    },
    { validators: [this.periodoValidator] }
  );

  // ==========================
  //  CONSTANTES DE JEFATURA
  // ==========================
  private readonly JEFATURA_NOMBRE = 'Dr. IGNACIO JARA PARRA';
  private readonly JEFATURA_CARGO = 'Jefe de Carrera';

  get minFechaFin(): Date | null {
    return this.form.value.periodoInicio ?? null;
  }

  // --- Helpers de selección (para evitar casts repetidos) ---
  get alumnosSeleccionados(): ApiEstudiante[] {
    const ids = this.form.value.estudiantesIds ?? [];
    return this.estudiantes.filter((e) => ids.includes(e.rut));
  }

  get supervisorSeleccionado(): ApiSupervisor | null {
    const id = this.form.value.supervisorId;
    return this.supervisores.find((s) => s.id === id) ?? null;
  }

  get plural(): boolean {
    return (this.form.value.estudiantesIds?.length ?? 0) > 1;
  }

  // ===========================================
  // ===== Helpers para el destino de carta ====
  // ===========================================

  destinatario(): { linea: string; cargo: string } {
    const c = this.centroSeleccionado;
    if (!c) return { linea: 'Señor(a)', cargo: '' };

    // Usamos el nombre del centro
    return { linea: `Director(a) ${c.nombre}`, cargo: 'Director(a)' };
  }

  // Texto de referencia por tipo de práctica
  private referenciaPorTipo(tipo?: string | null): string {
    switch (tipo) {
      case 'Apoyo a la Docencia I':
        return 'SOLICITUD DE AUTORIZACIÓN PARA APOYO A LA DOCENCIA I';
      case 'Apoyo a la Docencia II':
        return 'SOLICITUD DE AUTORIZACIÓN PARA APOYO A LA DOCENCIA II';
      case 'Apoyo a la Docencia III':
        return 'SOLICITUD DE AUTORIZACIÓN PARA APOYO A LA DOCENCIA III';
      case 'Práctica Profesional':
        return 'SOLICITUD DE AUTORIZACIÓN PARA PRÁCTICA PROFESIONAL';
      default:
        return 'SOLICITUD DE AUTORIZACIÓN PARA PRÁCTICA';
    }
  }

  private encabezado(refConFolio: boolean, folioBack?: string): string {
    const ciudad = this.centroSeleccionado?.comuna || 'Arica';
    const fecha = this.fechaHoy();

    const folioManual = this.form.value.folioManual?.trim();
    const folioUsado = folioManual || folioBack || '';

    const folioTxt =
      refConFolio && folioUsado
        ? `\n\nPHG N° ${folioUsado}.-\n`
        : '\n\n';

    return `${ciudad.toUpperCase()}, ${fecha}.-${folioTxt}`;
  }

  private saludo(): string {
    const c = this.centroSeleccionado;
    const { linea, cargo } = this.destinatario();
    const centro = c?.nombre || '';
    // ApiCentro no tiene 'direccion', así que la omitimos

    const cargoLinea = cargo ? `\n${cargo}` : '';
    return `Señor(a)\n${linea}${cargoLinea}\n${centro}\nPresente\n\nDe mi consideración:\n`;
  }

  private cuerpoSegunPDF(): string {
    const tipo = this.form.value.tipoPractica;
    const pi = this.fechaLarga(this.form.value.periodoInicio);
    const pf = this.fechaLarga(this.form.value.periodoFin);
    const periodoTxt = pi && pf ? `, entre el ${pi} y el ${pf}` : '';

    const intro =
      `Conforme a lo establecido en el currículo de la Carrera de Pedagogía en Historia y Geografía, ` +
      `solicitamos su autorización para que ${this.plural ? 'los...s estudiantes realicen' : 'el siguiente estudiante realice'} ` +
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

    const nombreJefatura =
      this.form.value.jefaturaNombre?.trim() || this.JEFATURA_NOMBRE;
    const cargoJefatura =
      this.form.value.jefaturaCargo?.trim() || this.JEFATURA_CARGO;

    const firma = `Se despide atentamente,

${nombreJefatura}
${cargoJefatura}
Facultad de Educación y Humanidades
Universidad de Tarapacá`;

    return `${intro}\n\n${this.listaEstudiantes()}\n\n${adjuntos}\n${firma}`;
  }

  private documentoPlano(refConFolio: boolean, folio?: string): string {
    return `${this.encabezado(refConFolio, folio)}\n${this.saludo()}\n${this.cuerpoSegunPDF()}`;
  }

  private fechaHoy(): string {
    const hoy = new Date();
    const dd = String(hoy.getDate()).padStart(2, '0');
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const yyyy = hoy.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private fechaLarga(d?: Date | null): string | null {
    if (!d) return null;
    const date = new Date(d);
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  private listaEstudiantes(): string {
    const lista = this.alumnosSeleccionados
      .map(
        (e, index) =>
          `${index + 1}. ${e.nombre} — Rut ${e.rut}`
      )
      .join('\n');
    return `Detalle de estudiante(s):\n${lista}`;
  }

  // ===========================================
  //         GENERACIÓN DE PDF
  // ===========================================

  private async crearYMostrarPDF(texto: string, titulo: string, esPrevio: boolean): Promise<void> {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' }); // 612 x 792 pt (carta)
    const margin = { left: 56, top: 64, right: 56, bottom: 64 };
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - margin.left - margin.right;

    // ==========================
    //  LOGOS [UTA] ........ [FEH]
    // ==========================
    const utaWidth = 90;
    const fehWidth = 72; // más pequeño para que no se vea estirado
    const logoHeightFallback = 40;
    const yLogos = 32;

    await this.ensureLogos();
    const leftLogoHeight = this.drawLogo(
      doc,
      this.logoUtaImg,
      margin.left,
      yLogos,
      utaWidth
    );
    const rightLogoHeight = this.drawLogo(
      doc,
      this.logoFehImg,
      pageWidth - margin.right - fehWidth,
      yLogos,
      fehWidth
    );
    const usedLogoHeight =
      Math.max(leftLogoHeight, rightLogoHeight) || logoHeightFallback;

    let y = yLogos + usedLogoHeight + 32; // espacio en blanco bajo los logos

    // ==========================
    //  MARCA DE AGUA (solo previa)
    // ==========================
    if (esPrevio) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(60);
      doc.setTextColor(200);
      doc.text('VISTA PREVIA', pageWidth / 2, pageHeight / 2, {
        align: 'center',
        angle: 45,
      });
      doc.setTextColor(0); // volver a negro
    }

    // Encabezado textual bajo logos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Carrera de Pedagogía en Historia y Geografía', margin.left, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(
      'Facultad de Educación y Humanidades — Universidad de Tarapacá',
      margin.left,
      y
    );
    y += 12;
    doc.setTextColor(100);
    doc.text(
      'Av. 18 de Septiembre N°2222 · Arica · pedhg@gestion.uta.cl · +56 58 2205253',
      margin.left,
      y
    );
    doc.setTextColor(0);
    y += 14;

    // Separador
    doc.setDrawColor(180);
    doc.setLineWidth(0.5);
    doc.line(margin.left, y, pageWidth - margin.right, y);
    y += 16;

    // ==========================
    //  CUERPO DE LA CARTA
    // ==========================
    const paragraphs = texto.split('\n\n');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setLineHeightFactor(1.25);

    for (const p of paragraphs) {
      const lines = doc.splitTextToSize(p, contentWidth);
      const height = lines.length * 14; // 11pt * 1.25 ~ 14pt
      if (y + height > pageHeight - margin.bottom) {
        doc.addPage();
        y = margin.top;
      }
      doc.text(lines, margin.left, y);
      y += height + 8;
    }

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const ref = this.dialog.open(PdfDialogComponent, {
      data: { dataUrl: pdfUrl, title: titulo },
      width: '980px',
      maxHeight: '95vh',
    });
    ref.afterClosed().subscribe(() => URL.revokeObjectURL(pdfUrl));
  }

  // ===========================================
  // --- Ciclo de Vida y Carga de Datos ---
  // ===========================================

  ngOnInit(): void {
    // Valores por defecto de los campos de carta
    this.form.patchValue({
      referencia: 'SOLICITUD DE AUTORIZACIÓN PARA PRÁCTICA',
      jefaturaNombre: this.JEFATURA_NOMBRE,
      jefaturaCargo: this.JEFATURA_CARGO,
    });

    // Actualizamos la referencia automáticamente según el tipo de práctica,
    // siempre que el usuario no la haya modificado manualmente.
    this.form.get('tipoPractica')!.valueChanges.subscribe((tipo) => {
      if (!tipo) return;
      const refCtrl = this.form.get('referencia');
      if (refCtrl && !refCtrl.dirty) {
        refCtrl.setValue(this.referenciaPorTipo(tipo), { emitEvent: false });
      }
    });

    this.data.getTiposPractica().subscribe({
      next: (t) => {
        if (Array.isArray(t) && t.length) {
          this.tiposPractica = t;
        }
      },
      error: () => {
        this.tiposPractica = [...this.TIPOS_PRACTICA_FALLBACK];
        this.snack.open('No se pudieron cargar los tipos de práctica', 'OK', {
          duration: 3000,
        });
      },
    });
    this.data.getCentros('').subscribe((cs) => (this.centros = cs));

    this.data.getEstudiantes('').subscribe((es) => {
      this.estudiantes = es;
      this.filteredStudents = es;
    });

    this.data.getSupervisores('').subscribe((ss) => {
      this.supervisores = ss;
      this.filteredSupervisores = ss;
    });

    // Actualiza 'centroSeleccionado' cuando el ID cambia
    this.form.get('centroId')!.valueChanges.subscribe((id: number | null) => {
      this.centroSeleccionado = this.centros.find((c) => c.id === id) ?? null;
      this.cdr.markForCheck();
    });

    this.form.get('periodoInicio')!.valueChanges.subscribe((inicio: Date | null) => {
      const finCtrl = this.form.get('periodoFin');
      const finVal = finCtrl?.value as Date | null;
      if (inicio && finVal && new Date(finVal).getTime() <= new Date(inicio).getTime()) {
        finCtrl?.setValue(null);
      }
    });
  }

  // --- Filtros (UI) ---
  _markForCheck() {
    this.cdr.markForCheck();
    this.applyFilters();
  }

  applyFilters() {
    const fS = this.studentFilter.toLowerCase();
    const fP = this.supervisorFilter.toLowerCase();

    this.filteredStudents = this.estudiantes.filter((e) =>
      `${e.nombre} ${e.rut}`.toLowerCase().includes(fS)
    );
    this.filteredSupervisores = this.supervisores.filter((s) =>
      `${s.nombre} ${s.correo ?? ''}`.toLowerCase().includes(fP)
    );
  }

  // --- Acciones de Botones (Actualizadas) ---

  private async ensureLogos(): Promise<void> {
    if (this.logosCargados) {
      return;
    }
    const [uta, feh] = await Promise.all([
      this.loadAssetAsDataUrl('assets/img/uta.png'),
      this.loadAssetAsDataUrl('assets/img/feh.png'),
    ]);
    this.logoUtaImg = uta;
    this.logoFehImg = feh;
    this.logosCargados = true;
  }

  private resolveAssetPath(path: string): string {
    try {
      return new URL(path, document.baseURI).toString();
    } catch {
      return path;
    }
  }

  private drawLogo(
    doc: jsPDF,
    logo: PdfAsset | null,
    x: number,
    y: number,
    width: number
  ): number {
    if (!logo?.dataUrl) {
      return 0;
    }
    const aspect = logo.width > 0 ? logo.height / logo.width : 0.5;
    const scaledHeight = Math.max(1, width * aspect);
    doc.addImage(logo.dataUrl, 'PNG', x, y, width, scaledHeight);
    return scaledHeight;
  }

  private async loadAssetAsDataUrl(assetPath: string): Promise<PdfAsset | null> {
    const url = this.resolveAssetPath(assetPath);
    return new Promise((resolve) => {
      this.http.get(url, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const image = new Image();
            image.onload = () =>
              resolve({
                dataUrl,
                width: image.width,
                height: image.height,
              });
            image.onerror = () =>
              resolve({
                dataUrl,
                width: 0,
                height: 0,
              });
            image.src = dataUrl;
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        },
        error: (error) => {
          console.warn('Error cargando asset para PDF', url, error);
          resolve(null);
        },
      });
    });
  }

  /** Muestra una vista previa del PDF sin guardar */
  previa(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open(
        'Completa los campos requeridos (centro, estudiantes, supervisor y periodo).',
        'OK',
        { duration: 2200 }
      );
      return;
    }
    const docPlano = this.documentoPlano(false);
    this.crearYMostrarPDF(docPlano, 'Vista previa de carta', true).catch((err) => {
      console.error('No se pudo generar la vista previa', err);
      this.snack.open('No se pudo generar la vista previa', 'OK', {
        duration: 2400,
      });
    });
  }

  /** Guarda en la BD y (si es exitoso) genera el PDF con folio */
  grabar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Completa los campos requeridos.', 'OK', {
        duration: 2200,
      });
      return;
    }

    const v = this.form.value;
    const dto: CreateCartaDto = {
      tipoPractica: v.tipoPractica!,
      centroId: v.centroId!,
      estudiantesIds: v.estudiantesIds!, // string[] (RUTs)
      supervisorId: v.supervisorId!,
      periodoInicio: this.toISO(v.periodoInicio),
      periodoFin: this.toISO(v.periodoFin),
    };

    // 1. Llamar al backend para guardar
    this.data.crearCarta(dto).subscribe({
      next: (respuesta: any) => {
        // 2. Si es exitoso, usar el 'folio' devuelto para generar el PDF
        const folio = respuesta?.folio ?? 'S/F'; // Tomamos el folio del backend

        const docPlano = this.documentoPlano(true, folio);
        this.crearYMostrarPDF(docPlano, `Carta folio ${folio}`, false).catch((err) => {
          console.error('Carta guardada, pero no se pudo generar el PDF', err);
          this.snack.open('Carta guardada, pero no se pudo generar el PDF', 'OK', {
            duration: 3000,
          });
        });

        this.snack.open(`Carta guardada con folio ${folio} `, 'OK', {
          duration: 2400,
        });
        this.limpiar();
      },
      error: (err) => {
        console.error(err);
        // Usamos SnackBar en lugar de alert
        this.snack.open('Error al crear la carta ', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  /** Limpia el formulario */
  limpiar(): void {
    this.form.reset({
      tipoPractica: '',
      centroId: null,
      estudiantesIds: [],
      supervisorId: null,
      periodoInicio: null,
      periodoFin: null,
      referencia: 'SOLICITUD DE AUTORIZACIÓN PARA PRÁCTICA',
      jefaturaNombre: this.JEFATURA_NOMBRE,
      jefaturaCargo: this.JEFATURA_CARGO,
      folioManual: '',
    });
    this.studentFilter = '';
    this.supervisorFilter = '';
    this.filteredStudents = this.estudiantes;
    this.filteredSupervisores = this.supervisores;
    this.centroSeleccionado = null;
  }

  // --- Validadores ---

  private periodoValidator(group: AbstractControl): ValidationErrors | null {
    const i = group.get('periodoInicio')?.value as Date | null;
    const f = group.get('periodoFin')?.value as Date | null;
    if (i && f && new Date(f).getTime() <= new Date(i).getTime()) {
      return { periodoInvalido: true };
    }
    return null;
  }

  private toISO(d: any): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
  }
}
