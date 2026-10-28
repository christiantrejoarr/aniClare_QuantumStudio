import type { ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';

import { environment } from '../../environments/environment';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let fixture: ComponentFixture<HomePage>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideIonicAngular(), provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    fixture.componentInstance.ionViewWillEnter();
  });

  it('muestra el catálogo publicado y la reserva', () => {
    http.expectOne(`${environment.apiUrl}/services`).flush([
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Masaje relajante',
        description: 'Sesión de 60 minutos.',
        durationMinutes: 60,
        priceCents: 85_000,
        depositCents: 30_000,
        currency: 'MXN',
      },
    ]);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Masaje relajante');
    expect(text).toContain('Reservar');
    expect(text).toContain('$850');
  });
});
