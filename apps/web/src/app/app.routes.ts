import type { Routes } from '@angular/router';

import { TabsPage } from './tabs/tabs.page';

export const routes: Routes = [
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page').then((m) => m.AdminPage),
  },
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'reservar',
        loadComponent: () => import('./reserve/reserve.page').then((m) => m.ReservePage),
      },
      {
        path: 'historial',
        loadComponent: () => import('./history/history.page').then((m) => m.HistoryPage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];
