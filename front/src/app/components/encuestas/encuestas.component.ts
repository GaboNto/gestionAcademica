import {
  AfterViewInit,
  Component,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import {
  MatTableDataSource,
  MatTableModule,
} from '@angular/material/table';
import {
  MatSnackBar,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import {
  MatSort,
  MatSortModule,
} from '@angular/material/sort';
import {
  MatPaginator,
  MatPaginatorModule,
} from '@angular/material/paginator';

// Angular Material básicos
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Librerías para Excel y PDF
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type TipoEncuesta = 'ESTUDIANTIL' | 'COLABORADORES_JEFES';

/**
 * Cada archivo Excel importado se guarda como UNA encuesta agregada.
 * - respuestas: array de filas del Excel (cada fila = objeto con columnas).
 */
export interface EncuestaRegistro {
  id: string;
  tipo: TipoEncuesta;
  fecha: Date; // fecha de importación
  origenArchivo: string;
  respuestas: { [key: string]: any }[];
}

@Component({
  selector: 'app-encuestas',
  standalone: true,
  templateUrl: './encuestas.component.html',
  styleUrls: ['./encuestas.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,

    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
})
export class EncuestasComponent implements OnInit, AfterViewInit {
  // Formulario para importar encuestas
  uploadForm!: FormGroup;

  // Formulario de filtros (tipo + rango de fechas)
  filtroForm!: FormGroup;

  // Datos
  encuestas: EncuestaRegistro[] = [];
  dataSource = new MatTableDataSource<EncuestaRegistro>([]);

  // Tabla principal
  displayedColumns: string[] = ['tipo', 'fecha', 'origenArchivo', 'acciones'];

  tiposEncuesta = [
    { value: 'ESTUDIANTIL' as TipoEncuesta, label: 'Percepción estudiantil' },
    {
      value: 'COLABORADORES_JEFES' as TipoEncuesta,
      label: 'Colaboradores / Jefes UTP',
    },
  ];

  // Detalle de encuesta seleccionada
  selectedEncuesta: EncuestaRegistro | null = null;

  public isLoading: boolean = false;

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  // ----------------- Ciclo de vida -----------------

  ngOnInit(): void {
    this.buildForms();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  // ----------------- Formularios -----------------

  private buildForms(): void {
    this.uploadForm = this.fb.group({
      tipoEncuesta: [null, Validators.required],
      archivo: [null, Validators.required],
    });

    this.filtroForm = this.fb.group({
      tipo: [''],
      fechaDesde: [null],
      fechaHasta: [null],
    });

    this.filtroForm.valueChanges.subscribe(() => this.aplicarFiltros());
  }

  // ----------------- Manejo de archivos -----------------

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files[0];

    this.uploadForm.get('archivo')?.setValue(file || null);

    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      this.mostrarError('El archivo debe ser un Excel (.xlsx o .xls).');
      this.uploadForm.get('archivo')?.setValue(null);
      input.value = '';
      return;
    }
  }

  onSubmitUpload(): void {
    if (this.uploadForm.invalid) {
      this.uploadForm.markAllAsTouched();
      this.mostrarError('Debe seleccionar tipo de encuesta y un archivo Excel.');
      return;
    }

    const tipoEncuesta: TipoEncuesta = this.uploadForm.value.tipoEncuesta;
    const file: File = this.uploadForm.value.archivo;

    if (!file) {
      this.mostrarError('No se ha seleccionado un archivo.');
      return;
    }

    this.isLoading = true;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = reader.result as string | ArrayBuffer | null;
        if (!data) {
          this.mostrarError('No se pudo leer el archivo.');
          this.isLoading = false;
          return;
        }

        const workbook = XLSX.read(data as string, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: null,
        });

        if (!rows.length) {
          this.mostrarError('El archivo Excel no contiene registros.');
          this.isLoading = false;
          return;
        }

        const nuevaEncuesta: EncuestaRegistro = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
          tipo: tipoEncuesta,
          fecha: new Date(), // fecha de importación
          origenArchivo: file.name,
          respuestas: rows, // TODAS las filas del Excel
        };

        this.encuestas = [...this.encuestas, nuevaEncuesta];
        this.aplicarFiltros();

        this.mostrarOk('Encuesta registrada exitosamente');

        // limpiar form
        this.uploadForm.reset();
        const inputFile = document.getElementById(
          'fileInputEncuestas'
        ) as HTMLInputElement | null;
        if (inputFile) inputFile.value = '';
      } catch (error) {
        console.error(error);
        this.mostrarError(
          'Ocurrió un error al procesar el archivo Excel. Verifique el formato.'
        );
      } finally {
        this.isLoading = false;
      }
    };

    reader.readAsBinaryString(file);
  }

  // ----------------- Filtros y tabla principal -----------------

  aplicarFiltros(): void {
    const { tipo, fechaDesde, fechaHasta } = this.filtroForm.value;

    const tipoFiltro: TipoEncuesta | '' = tipo;
    const desde = fechaDesde ? this.sinHora(fechaDesde) : null;
    const hasta = fechaHasta ? this.sinHora(fechaHasta) : null;

    const filtradas = this.encuestas.filter((e) => {
      if (tipoFiltro && e.tipo !== tipoFiltro) return false;

      const fecha = this.sinHora(e.fecha);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;

      return true;
    });

    this.dataSource.data = filtradas;
  }

  private sinHora(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  limpiarFiltros(): void {
    this.filtroForm.reset({
      tipo: '',
      fechaDesde: null,
      fechaHasta: null,
    });
    this.aplicarFiltros();
  }

  mapTipoLabel(tipo: TipoEncuesta): string {
    const found = this.tiposEncuesta.find((t) => t.value === tipo);
    return found ? found.label : tipo;
  }

  // ----------------- Detalles: ver resultados de la encuesta -----------------

  verDetalles(encuesta: EncuestaRegistro): void {
    this.selectedEncuesta = encuesta;
  }

  cerrarDetalles(): void {
    this.selectedEncuesta = null;
  }

  /**
   * Columnas para la tabla de detalle (toma los encabezados del Excel).
   */
  getDetailColumns(encuesta: EncuestaRegistro | null): string[] {
    if (!encuesta || !encuesta.respuestas || !encuesta.respuestas.length) {
      return [];
    }
    return Object.keys(encuesta.respuestas[0]);
  }

  // ----------------- Exportar (respetando filtros) -----------------

  exportarExcel(): void {
    if (!this.dataSource.data.length) {
      this.mostrarError('No hay encuestas para exportar.');
      return;
    }

    const data = this.dataSource.data.map((e) => ({
      Tipo: this.mapTipoLabel(e.tipo),
      FechaImportacion: e.fecha.toISOString().split('T')[0],
      OrigenArchivo: e.origenArchivo,
      CantidadFilasExcel: e.respuestas.length,
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Encuestas');

    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `encuestas_filtradas_${fecha}.xlsx`);
  }

  exportarPDF(): void {
    if (!this.dataSource.data.length) {
      this.mostrarError('No hay encuestas para exportar.');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');

    const rows = this.dataSource.data.map((e) => [
      this.mapTipoLabel(e.tipo),
      e.fecha.toISOString().split('T')[0],
      e.origenArchivo,
      e.respuestas.length.toString(),
    ]);

    autoTable(doc, {
      head: [['Tipo', 'Fecha importación', 'Archivo', 'Filas Excel']],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 243] },
    });

    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`encuestas_filtradas_${fecha}.pdf`);
  }

  // ----------------- Utilidades UI -----------------

  private mostrarOk(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['snackbar-error'],
    });
  }
}
