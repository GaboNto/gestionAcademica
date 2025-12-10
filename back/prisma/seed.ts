import { PrismaClient, TipoPregunta } from '@prisma/client';
import * as bcrypt from 'bcrypt'; // 👈 NUEVO

const prisma = new PrismaClient();

async function ensureEstudiante(rut: string, nombre: string) {
  return prisma.estudiante.upsert({
    where: { rut },
    update: { nombre },
    create: { rut, nombre },
  });
}

async function ensureCentro(nombre: string, comuna?: string, region?: string) {
  const existing = await prisma.centroEducativo.findFirst({
    where: { nombre },
  });
  if (existing) return existing;
  return prisma.centroEducativo.create({
    data: { nombre, comuna, region },
  });
}

async function ensureTutor(rut: string, nombre: string) {
  return prisma.tutor.upsert({
    where: { rut },
    update: { nombre },
    create: { rut, nombre },
  });
}

async function ensureColaborador(rut: string, nombre: string) {
  return prisma.colaborador.upsert({
    where: { rut },
    update: { nombre },
    create: { rut, nombre },
  });
}

async function ensurePregunta(
  descripcion: string,
  tipo: TipoPregunta,
  alternativas?: { descripcion: string; puntaje: number }[],
) {
  let pregunta = await prisma.pregunta.findFirst({ where: { descripcion } });
  if (!pregunta) {
    pregunta = await prisma.pregunta.create({
      data: { descripcion, tipo },
    });
  }

  if (tipo === 'CERRADA' && alternativas?.length) {
    for (const alt of alternativas) {
      const existingAlt = await prisma.alternativa.findFirst({
        where: { preguntaId: pregunta.id, descripcion: alt.descripcion },
      });
      if (!existingAlt) {
        await prisma.alternativa.create({
          data: {
            descripcion: alt.descripcion,
            puntaje: alt.puntaje,
            preguntaId: pregunta.id,
          },
        });
      }
    }
  }

  return pregunta;
}

/** usuarios del sistema (login) */
async function ensureUsuario(
  email: string,
  hashedPassword: string,
  nombre: string,
  role: 'jefatura' | 'vinculacion' | 'practicas',
) {
  return prisma.usuario.upsert({
    where: { email },
    update: {
      nombre,
      role,
      activo: true,
    },
    create: {
      email,
      password: hashedPassword,
      nombre,
      role,
      activo: true,
    },
  });
}

async function main() {
  // ====== USUARIOS PARA LOGIN ======
  const plainPassword = '123456';
  const hashed = await bcrypt.hash(plainPassword, 10);

  await Promise.all([
    ensureUsuario(
      'jefatura@uta.cl',
      hashed,
      'Jefatura de Carrera',
      'jefatura',
    ),
    ensureUsuario(
      'vinculacion@uta.cl',
      hashed,
      'Coordinación de Vinculación',
      'vinculacion',
    ),
    ensureUsuario(
      'practicas@uta.cl',
      hashed,
      'Coordinación de Prácticas',
      'practicas',
    ),
  ]);

  console.log('Usuarios para login creados/actualizados');

  // ====== (encuestas demo, etc.) ======
  const [est1] = await Promise.all([
    ensureEstudiante('12.345.678-9', 'Ana Estudiante'),
    ensureEstudiante('98.765.432-1', 'Bruno Practicante'),
  ]);

  const centro = await ensureCentro(
    'Liceo Bicentenario Arica',
    'Arica',
    'Arica y Parinacota',
  );

  const tutor = await ensureTutor('11.111.111-1', 'Profa. Teresa Tallerista');
  await ensureColaborador('22.222.222-2', 'Prof. Carlos Colaborador');

  const escala5 = [
    { descripcion: '1', puntaje: 1 },
    { descripcion: '2', puntaje: 2 },
    { descripcion: '3', puntaje: 3 },
    { descripcion: '4', puntaje: 4 },
    { descripcion: '5', puntaje: 5 },
  ];

  const preguntasCerradas = await Promise.all([
    ensurePregunta('secI.objetivos', 'CERRADA', escala5),
    ensurePregunta('secI.accionesEstablecimiento', 'CERRADA', escala5),
    ensurePregunta('secI.accionesTaller', 'CERRADA', escala5),
    ensurePregunta('secI.satisfaccionGeneral', 'CERRADA', escala5),
  ]);

  const preguntaAbierta = await ensurePregunta(
    'comentariosAdicionales',
    'ABIERTA',
  );

  const encuesta = await prisma.encuestaEstudiante.create({
    data: {
      nombre_estudiante: est1.rut,
      nombre_tallerista: tutor.nombre,
      nombre_colaborador: 'Docente Colaborador Demo',
      nombre_centro: centro.nombre,
      fecha: new Date('2024-10-15'),
      observacion: 'Observación general de la práctica.',
    },
  });

  const alternativas = await prisma.alternativa.findMany({
    where: { preguntaId: { in: preguntasCerradas.map((p) => p.id) } },
  });

  const pickAlt = (preguntaId: number, descripcion: string) =>
    alternativas.find(
      (a) => a.preguntaId === preguntaId && a.descripcion === descripcion,
    )!;

  await prisma.respuestaSeleccionada.createMany({
    data: [
      {
        encuestaEstudianteId: encuesta.id,
        preguntaId: preguntasCerradas[0].id,
        alternativaId: pickAlt(preguntasCerradas[0].id, '4').id,
      },
      {
        encuestaEstudianteId: encuesta.id,
        preguntaId: preguntasCerradas[1].id,
        alternativaId: pickAlt(preguntasCerradas[1].id, '5').id,
      },
      {
        encuestaEstudianteId: encuesta.id,
        preguntaId: preguntasCerradas[2].id,
        alternativaId: pickAlt(preguntasCerradas[2].id, '4').id,
      },
      {
        encuestaEstudianteId: encuesta.id,
        preguntaId: preguntasCerradas[3].id,
        alternativaId: pickAlt(preguntasCerradas[3].id, '5').id,
      },
      {
        encuestaEstudianteId: encuesta.id,
        preguntaId: preguntaAbierta.id,
        respuestaAbierta:
          'Comentarios de ejemplo sobre la experiencia de la práctica.',
      },
    ],
  });

  console.log('Semilla creada: encuesta de estudiante con respuestas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
