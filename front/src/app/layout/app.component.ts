import { Component, inject, OnInit, AfterViewInit, PLATFORM_ID, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';

/** IDs de rol válidos en toda la app */
type RoleId = 'jefatura' | 'vinculacion' | 'practicas';

/** Estructura que guardas en localStorage desde Home */
interface SavedRole {
  id: RoleId;
  title: string;         // Etiqueta visible del rol (p.ej., “Jefatura de Carrera”)
  name: string;          // Nombre de la persona
  icon?: string;
  permissions: string[]; // Funciones que mostraremos en el sidebar
  color?: 'blue' | 'green' | 'purple';
}

interface NavItem { label: string; icon: string; route: string; }

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    CommonModule, RouterModule,
    MatSidenavModule, MatToolbarModule, MatListModule,
    MatIconModule, MatButtonModule, MatDividerModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  @ViewChild(MatSidenav) sidenav?: MatSidenav;
  private closeSidenavListener = () => {
    this.isSidenavOpened = false;
    this.sidenav?.close();
  };

  isSidenavOpened = true;
  appTitle = 'Sistema de Prácticas';

  user = { name: 'Invitado', roleLabel: 'Sin rol', icon: 'account_circle' };
  /** Se muestra como “Funciones del rol” */
  rolePermissions: string[] = [];
  /** Items visibles en el sidebar (según rol) */
  nav: NavItem[] = [];

  /** SSR: primer render con algo neutral */
  ngOnInit(): void {
    this.applyRole('practicas'); // fallback visual para SSR
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('app:close-sidenav', this.closeSidenavListener);
      this.loadRoleFromStorage();
      // Suscribirse a cambios de navegación para detectar cuando se selecciona un nuevo rol
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.loadRoleFromStorage();
        });
    }
  }

  /** Cliente: asegura que tras la primera pintura se apliquen los items correctos */
  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      queueMicrotask(() => this.loadRoleFromStorage());
    }
  }

  // ------- Lógica de rol -------
  private loadRoleFromStorage() {
    try {
      const saved = localStorage.getItem('app.selectedRole');
      if (!saved) return;
      const r = JSON.parse(saved) as SavedRole;
      if (!r?.id) return;
      this.applyRole(r.id, r);
    } catch {}
  }

  private applyRole(id: RoleId, r?: SavedRole) {
    this.user.name = r?.name ?? this.user.name;
    this.user.roleLabel = r?.title ?? this.mapRoleLabel(id);
    this.user.icon = r?.icon ?? this.user.icon;
    this.rolePermissions = Array.isArray(r?.permissions) ? r!.permissions : [];
    this.nav = this.buildNav(id);
  }

  // ------- UI -------
  onSidenavChange(opened: boolean) { this.isSidenavOpened = opened; }
  toggleSidenav(sidenav: MatSidenav) { sidenav.toggle(); }

  logout() {
    if (isPlatformBrowser(this.platformId)) localStorage.removeItem('app.selectedRole');
    this.router.navigateByUrl('/');
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('app:close-sidenav', this.closeSidenavListener);
    }
  }

  // ------- Helpers -------
  private mapRoleLabel(id: RoleId): string {
    switch (id) {
      case 'jefatura':    return 'Jefatura de Carrera';
      case 'vinculacion': return 'Coordinador/a de Vinculación';
      case 'practicas':   return 'Coordinador/a de Prácticas';
      default:            return 'Sin rol';
    }
  }

  /** Construye el menú del sidebar según funciones reales por rol */
  private buildNav(id: RoleId): NavItem[] {
    if (id === 'jefatura') {
      // Reportes completos + Generar cartas + Supervisión general + Estudiantes en práctica + Usuarios + Tutores + Colaboradores + Actividades (solo lectura)
      return [
        { label: 'Dashboard',          icon: 'dashboard',    route: '/dashboard' },
        { label: 'Usuarios',           icon: 'manage_accounts', route: '/usuarios' },
        { label: 'Estudiantes en práctica', icon: 'school',  route: '/estudiantes-en-practica' },
        { label: 'Tutores',            icon: 'supervisor_account', route: '/tutores' },
        { label: 'Colaboradores',      icon: 'groups',       route: '/colaboradores' },
        { label: 'Actividades',        icon: 'assignment',   route: '/actividades-estudiantes' },
        { label: 'Supervisión general',icon: 'insights',     route: '/supervision' },
        { label: 'Reportes completos', icon: 'analytics',    route: '/reportes' },
        { label: 'Generar solicitud',  icon: 'description',  route: '/carta' }, // crea la ruta si aún no existe
      ];
    }

    if (id === 'vinculacion') {
      // Registrar encuestas
      return [
        { label: 'Dashboard',          icon: 'dashboard',          route: '/dashboard' },
        { label: 'Encuestas',          icon: 'assignment',         route: '/encuestas' },
        { label: 'Estudiantes',        icon: 'school',             route: '/estudiantes' },
        { label: 'Colaboradores',      icon: 'groups',             route: '/colaboradores' },
        { label: 'Centros educativos', icon: 'domain',             route: '/centros-educativos' },
      ];
    }

    if (id === 'practicas') {
      // Gestionar centros, estudiantes, prácticas, colaboradores, reportes/historial
      return [
        { label: 'Dashboard',          icon: 'dashboard',          route: '/dashboard' },
        { label: 'Estudiantes',        icon: 'school',             route: '/estudiantes' },
        { label: 'Tutores',            icon: 'supervisor_account', route: '/tutores' },
        { label: 'Colaboradores',      icon: 'groups',             route: '/colaboradores' },
        { label: 'Centros educativos', icon: 'domain',             route: '/centros-educativos' },
        { label: 'Prácticas',          icon: 'event_note',         route: '/practicas' },     // crea la ruta si aún no existe
        { label: 'Actividades',        icon: 'assignment',         route: '/actividades-estudiantes' },
        { label: 'Reportes/Historial', icon: 'timeline',           route: '/reportes' },     // crea la ruta si aún no existe
      ];
    }

    // Fallback si no calza
    return [];
  }
}
