import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryActividadesDto, SortableField } from './dto/query-actividades.dto';

export interface ActividadCarrera {
  id: number;
  nombre: string;
  tipo: string;
  estado: 'PENDIENTE' | 'EN_CURSO' | 'FINALIZADA';
  responsable: string;
  fechaInicio: Date;
  fechaFin?: Date;
  descripcion?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}

@Injectable()
export class ActividadesService {
  /** Datos simulados para la vista de jefatura (solo lectura) */
  private readonly actividades: ActividadCarrera[] = [
    {
      id: 1,
      nombre: 'Plan de trabajo primer semestre',
      tipo: 'Planificación',
      estado: 'PENDIENTE',
      responsable: 'María Rivas',
      fechaInicio: new Date('2025-03-03'),
      fechaFin: new Date('2025-03-10'),
      descripcion: 'Definir calendario de talleres y evaluaciones del semestre.',
    },
    {
      id: 2,
      nombre: 'Taller de habilidades blandas',
      tipo: 'Taller',
      estado: 'EN_CURSO',
      responsable: 'Jorge Pérez',
      fechaInicio: new Date('2025-03-12'),
      fechaFin: new Date('2025-03-12'),
      descripcion: 'Sesión presencial para estudiantes en práctica.',
    },
    {
      id: 3,
      nombre: 'Entrega de informe intermedio',
      tipo: 'Reporte',
      estado: 'FINALIZADA',
      responsable: 'Ana Castillo',
      fechaInicio: new Date('2025-02-20'),
      fechaFin: new Date('2025-02-25'),
      descripcion: 'Recopilación y revisión de avances de prácticas.',
    },
    {
      id: 4,
      nombre: 'Visita a centro educativo',
      tipo: 'Visita',
      estado: 'EN_CURSO',
      responsable: 'Luis Méndez',
      fechaInicio: new Date('2025-03-08'),
      fechaFin: new Date('2025-03-09'),
      descripcion: 'Supervisión en terreno de actividades de práctica.',
    },
    {
      id: 5,
      nombre: 'Cierre de acta de supervisión',
      tipo: 'Administrativo',
      estado: 'PENDIENTE',
      responsable: 'Carla Soto',
      fechaInicio: new Date('2025-03-15'),
      fechaFin: new Date('2025-03-18'),
      descripcion: 'Consolidar observaciones y acuerdos de la supervisión.',
    },
    {
      id: 6,
      nombre: 'Reunión con tutores',
      tipo: 'Reunión',
      estado: 'FINALIZADA',
      responsable: 'María Rivas',
      fechaInicio: new Date('2025-02-10'),
      fechaFin: new Date('2025-02-10'),
      descripcion: 'Coordinación mensual con tutores de centros asociados.',
    },
    {
      id: 7,
      nombre: 'Actualización de convenios',
      tipo: 'Administrativo',
      estado: 'EN_CURSO',
      responsable: 'Jorge Pérez',
      fechaInicio: new Date('2025-03-01'),
      fechaFin: new Date('2025-03-20'),
      descripcion: 'Revisión y actualización de convenios vigentes.',
    },
    {
      id: 8,
      nombre: 'Diseño de rúbrica de evaluación',
      tipo: 'Evaluación',
      estado: 'PENDIENTE',
      responsable: 'Ana Castillo',
      fechaInicio: new Date('2025-03-05'),
      fechaFin: new Date('2025-03-11'),
      descripcion: 'Crear rúbrica para evaluar desempeño en prácticas.',
    },
    {
      id: 9,
      nombre: 'Entrega de informe final',
      tipo: 'Reporte',
      estado: 'PENDIENTE',
      responsable: 'Luis Méndez',
      fechaInicio: new Date('2025-04-05'),
      fechaFin: new Date('2025-04-10'),
      descripcion: 'Informe final consolidado de las prácticas profesionales.',
    },
    {
      id: 10,
      nombre: 'Capacitación plataforma',
      tipo: 'Capacitación',
      estado: 'FINALIZADA',
      responsable: 'Carla Soto',
      fechaInicio: new Date('2025-01-20'),
      fechaFin: new Date('2025-01-21'),
      descripcion: 'Capacitación para uso de la plataforma de seguimiento.',
    },
  ];

  list(query: QueryActividadesDto): PagedResult<ActividadCarrera> {
    const {
      search,
      tipo,
      estado,
      responsable,
      fechaInicio,
      fechaFin,
      sortBy = 'fechaInicio',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = query;

    let items = [...this.actividades];

    if (search?.trim()) {
      const term = search.trim().toLowerCase();
      items = items.filter(a =>
        a.nombre.toLowerCase().includes(term) ||
        a.descripcion?.toLowerCase().includes(term),
      );
    }

    if (tipo?.trim()) {
      items = items.filter(a => a.tipo.toLowerCase() === tipo.toLowerCase());
    }

    if (estado?.trim()) {
      items = items.filter(a => a.estado.toLowerCase() === estado.toLowerCase());
    }

    if (responsable?.trim()) {
      items = items.filter(a =>
        a.responsable.toLowerCase().includes(responsable.trim().toLowerCase()),
      );
    }

    if (fechaInicio) {
      const start = new Date(fechaInicio);
      if (!isNaN(start.getTime())) {
        items = items.filter(a => a.fechaFin ? a.fechaFin >= start : a.fechaInicio >= start);
      }
    }

    if (fechaFin) {
      const end = new Date(fechaFin);
      if (!isNaN(end.getTime())) {
        items = items.filter(a => a.fechaInicio <= end);
      }
    }

    items.sort((a, b) => this.compare(a, b, sortBy as SortableField, sortOrder));

    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + limit);

    return { items: paginated, page, limit, total, pages };
  }

  findById(id: number): ActividadCarrera {
    const actividad = this.actividades.find(a => a.id === id);
    if (!actividad) throw new NotFoundException('Actividad no encontrada');
    return actividad;
  }

  private compare(a: ActividadCarrera, b: ActividadCarrera, field: SortableField, order: 'asc' | 'desc') {
    const factor = order === 'asc' ? 1 : -1;
    const getValue = (item: ActividadCarrera) => {
      switch (field) {
        case 'nombre': return item.nombre.toLowerCase();
        case 'tipo': return item.tipo.toLowerCase();
        case 'estado': return item.estado.toLowerCase();
        case 'responsable': return item.responsable.toLowerCase();
        case 'fechaFin': return item.fechaFin ? item.fechaFin.getTime() : item.fechaInicio.getTime();
        case 'fechaInicio':
        default: return item.fechaInicio.getTime();
      }
    };

    const va = getValue(a);
    const vb = getValue(b);

    if (va < vb) return -1 * factor;
    if (va > vb) return 1 * factor;
    return 0;
  }
}
