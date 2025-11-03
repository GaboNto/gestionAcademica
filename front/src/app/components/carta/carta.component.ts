import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';

import {
  CartaDataService,
  ApiCentro,
  ApiEstudiante,
  ApiSupervisor,
  CreateCartaDto,
} from '../../services/carta-data.service';

@Component({
  selector: 'app-carta',
  standalone: true,
  templateUrl: './carta.component.html',
  styleUrls: ['./carta.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
  ],
})
export class CartaComponent {
  private fb = inject(FormBuilder);
  private data = inject(CartaDataService);
  private cdr = inject(ChangeDetectorRef);

  tiposPractica: string[] = [];
  centros: ApiCentro[] = [];
  estudiantes: ApiEstudiante[] = [];
  supervisores: ApiSupervisor[] = [];

  studentFilter = '';
  supervisorFilter = '';

  filteredStudents: ApiEstudiante[] = [];
  filteredSupervisores: ApiSupervisor[] = [];

  centroSeleccionado: ApiCentro | null = null;

  form = this.fb.group(
    {
      tipoPractica: ['', Validators.required],
      centroId: [null as number | null, Validators.required],
      // IMPORTANT: RUTs = string[]
      estudiantesIds: this.fb.control<string[]>([], { nonNullable: true, validators: [Validators.required] }),
      supervisorId: [null as number | null, Validators.required],
      periodoInicio: [null, Validators.required],
      periodoFin: [null, Validators.required],
    },
    { validators: [this.periodoValidator()] }
  );

  ngOnInit(): void {
    this.data.getTiposPractica().subscribe((t) => (this.tiposPractica = t));
    this.data.getCentros('').subscribe((cs) => (this.centros = cs));

    this.data.getEstudiantes('').subscribe((es) => {
      this.estudiantes = es;
      this.filteredStudents = es;
    });

    this.data.getSupervisores('').subscribe((ss) => {
      this.supervisores = ss;
      this.filteredSupervisores = ss;
    });

    this.form.get('centroId')!.valueChanges.subscribe((id) => {
      this.centroSeleccionado = this.centros.find((c) => c.id === id) ?? null;
      this.cdr.markForCheck();
    });
  }

  // Necesario para tu HTML
  previa(): void {
    // Arma los datos de previsualización si lo necesitas
  }

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

  grabar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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

    this.data.crearCarta(dto).subscribe({
      next: () => {
        alert('Carta creada con éxito ✅');
        this.limpiar();
      },
      error: (err) => {
        console.error(err);
        alert('Error al crear la carta ❌');
      },
    });
  }

  limpiar(): void {
    this.form.reset({
      tipoPractica: '',
      centroId: null,
      estudiantesIds: [],       // string[] (no null)
      supervisorId: null,
      periodoInicio: null,
      periodoFin: null,
    });
    this.studentFilter = '';
    this.supervisorFilter = '';
    this.filteredStudents = this.estudiantes;
    this.filteredSupervisores = this.supervisores;
  }

  private periodoValidator() {
    return (group: any) => {
      const i = group.get('periodoInicio')?.value;
      const f = group.get('periodoFin')?.value;
      if (!i || !f) return null;
      return new Date(f) > new Date(i) ? null : { periodoInvalido: true };
    };
  }

  private toISO(d: any): string {
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().slice(0, 10);
  }
}
