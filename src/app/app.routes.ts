import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { ListaChoferesComponent } from './features/choferes/lista-choferes/lista-choferes';
import { ListaViajes } from './features/viajes/lista-viajes/lista-viajes';
import { Layout } from './shared/layout/layout';
import { authGuard } from './core/guards/auth.guard';
import { ListaCamiones } from './features/camiones/lista-camiones/lista-camiones';
import { ListaMultas } from './features/multas/lista-multas/lista-multas';
import { ListaAuditoria } from './features/auditoria/lista-auditoria/lista-auditoria';
import { adminGuard } from './core/guards/admin.guard';
import { ListaUsuarios } from './features/usuarios/lista-usuarios/lista-usuarios';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: 'viajes', component: ListaViajes },
      { path: 'choferes', component: ListaChoferesComponent },
      { path: '', redirectTo: 'viajes', pathMatch: 'full' },
      { path: 'camiones', component: ListaCamiones },
      { path: 'multas', component: ListaMultas },
      { path: 'auditoria', component: ListaAuditoria },
      { path: 'auditoria', component: ListaAuditoria, canActivate: [adminGuard] },
      { path: 'usuarios', component: ListaUsuarios, canActivate: [adminGuard] },
    ]
  },
];