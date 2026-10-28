import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

import { CatalogApi } from '../core/catalog-api';
import { formatPesos, SpaService } from '../core/catalog';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogApi);
  readonly services = signal<SpaService[]>([]);
  readonly loadError = signal<string | null>(null);
  readonly formatPesos = formatPesos;

  ionViewWillEnter(): void {
    this.catalog.list().subscribe({
      next: (services) => {
        this.services.set(services);
        this.loadError.set(null);
      },
      error: () => this.loadError.set('No pudimos cargar el catálogo.'),
    });
  }

  reserve(): void {
    void this.router.navigate(['/reservar']);
  }

  openAdmin(): void {
    void this.router.navigate(['/admin']);
  }
}
