import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonToolbar } from '@ionic/angular';

import { CatalogApi } from '../core/catalog-api';
import { formatPesos, SpaService } from '../core/catalog';
import { LiveUpdates } from '../core/live-updates';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [IonHeader, IonToolbar, IonContent, IonButton],
})
export class HomePage {
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogApi);
  readonly services = signal<SpaService[]>([]);
  readonly catalogReady = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly formatPesos = formatPesos;

  constructor() {
    inject(LiveUpdates)
      .changes(['catalog'])
      .subscribe(() => this.loadCatalog());
  }

  ionViewWillEnter(): void {
    this.loadCatalog();
  }

  reserve(): void {
    void this.router.navigate(['/reservar']);
  }

  private loadCatalog(): void {
    this.catalog.list().subscribe({
      next: (services) => {
        this.services.set(services);
        this.catalogReady.set(true);
        this.loadError.set(null);
      },
      error: () => {
        this.catalogReady.set(true);
        this.loadError.set('No pudimos cargar el catálogo.');
      },
    });
  }

}
