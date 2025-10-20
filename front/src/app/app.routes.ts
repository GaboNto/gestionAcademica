import { Routes } from '@angular/router';

export const routes: Routes = [
  // Página inicial: selección de rol
  {
    path: '',
    loadComponent: () =>
      import('./components/home/home.component').then(m => m.HomeComponent),
  },

  // Dashboard
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },

  // Gestión de colaboradores
  {
    path: 'colaboradores',
    loadComponent: () =>
      import('./components/colaboradores/colaboradores.component').then(m => m.ColaboradoresComponent),
  },

  // Gestión de usuarios
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./components/usuarios/usuarios.component').then(m => m.UsuariosComponent),
  },

  // Gestión de estudiantes
  {
    path: 'estudiantes',
    loadComponent: () =>
      import('./components/estudiante/estudiante.component').then(m => m.EstudiantesComponent),
  },

  // Registro de encuestas
  {
    path: 'encuestas',
    loadComponent: () =>
      import('./components/encuestas/encuestas.component').then(m => m.EncuestasComponent),
  },

  // Supervisión general
  {
    path: 'supervision',
    loadComponent: () =>
      import('./components/supervision/supervision.component').then(m => m.SupervisionComponent),
  },

   // Gestión de centros educativos
  {
    path: 'colegios',
    loadComponent: () =>
      import('./components/colegios/colegios.component').then(m => m.ColegiosComponent),
  },

  // Ruta por defecto → redirige a inicio
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
