import {Component,inject,OnInit,AfterViewInit,PLATFORM_ID,OnDestroy,ViewChild} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
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
  title: string;
  name: string;
  icon?: string;
  permissions: string[];
  color?: 'blue' | 'green' | 'purple';
}

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private auth = inject(AuthService);

  @ViewChild(MatSidenav) sidenav?: MatSidenav;

  private navigationSub?: Subscription;
  private closeSidenavListener = () => {
    this.isSidenavOpened = false;
    this.sidenav?.close();
  };

  /** NUEVO: detectar si estamos en la ruta /login */
  isLoginRoute = false;

  isSidenavOpened = true;
  appTitle = 'Sistema de Prácticas';

  user = { name: 'Invitado', roleLabel: 'Sin rol', icon: 'account_circle' };
  rolePermissions: string[] = [];
  nav: NavItem[] = [];

  ngOnInit(): void {
    this.applyRole('practicas'); // fallback para SSR

    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('app:close-sidenav', this.closeSidenavListener);
      this.loadRoleFromStorage();

      // detectar cambios de ruta + detectar si estamos en /login
      this.navigationSub = this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          this.isLoginRoute = event.url === '/login';
          this.loadRoleFromStorage();
        });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      queueMicrotask(() => this.loadRoleFromStorage());
    }
  }

  // ------- Lógica de rol -------
  private loadRoleFromStorage() {
    try {
      const saved = isPlatformBrowser(this.platformId)
        ? localStorage.getItem('app.selectedRole')
        : null;
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
  onSidenavChange(opened: boolean) {
    this.isSidenavOpened = opened;
  }

  toggleSidenav(sidenav: MatSidenav) {
    sidenav.toggle();
  }

  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('app.selectedRole');
    }

    this.auth.logout();
    this.router.navigateByUrl('/login');
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('app:close-sidenav', this.closeSidenavListener);
    }
    this.navigationSub?.unsubscribe();
  }

  // ------- Helpers -------
  private mapRoleLabel(id: RoleId): string {
    switch (id) {
      case 'jefatura':
        return 'Jefatura de Carrera';
      case 'vinculacion':
        return 'Coordinador/a de Vinculación';
      case 'practicas':
        return 'Coordinador/a de Prácticas';
      default:
        return 'Sin rol';
    }
  }

  private buildNav(id: RoleId): NavItem[] {
    if (id === 'jefatura') {
      return [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Usuarios', icon: 'manage_accounts', route: '/usuarios' },
        { label: 'Estudiantes en práctica', icon: 'school', route: '/estudiantes-en-practica' },
        { label: 'Tutores', icon: 'supervisor_account', route: '/tutores' },
        { label: 'Colaboradores', icon: 'groups', route: '/colaboradores' },
        { label: 'Actividades', icon: 'assignment', route: '/actividades-estudiantes' },
        { label: 'Supervisión general', icon: 'insights', route: '/supervision' },
        { label: 'Reportes completos', icon: 'analytics', route: '/reportes' },
        { label: 'Generar solicitud', icon: 'description', route: '/carta' },
      ];
    }

    if (id === 'vinculacion') {
      return [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Encuestas', icon: 'assignment', route: '/encuestas' },
        { label: 'Estudiantes', icon: 'school', route: '/estudiantes' },
        { label: 'Colaboradores', icon: 'groups', route: '/colaboradores' },
        { label: 'Centros educativos', icon: 'domain', route: '/centros-educativos' },
      ];
    }

    if (id === 'practicas') {
      return [
        { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
        { label: 'Estudiantes', icon: 'school', route: '/estudiantes' },
        { label: 'Tutores', icon: 'supervisor_account', route: '/tutores' },
        { label: 'Colaboradores', icon: 'groups', route: '/colaboradores' },
        { label: 'Centros educativos', icon: 'domain', route: '/centros-educativos' },
        { label: 'Prácticas', icon: 'event_note', route: '/practicas' },
        { label: 'Actividades', icon: 'assignment', route: '/actividades-estudiantes' },
        { label: 'Reportes/Historial', icon: 'timeline', route: '/reportes' },
      ];
    }

    return [];
  }
}
