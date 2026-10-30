import { Component, inject } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor() {
    if (Capacitor.isNativePlatform()) {
      void StatusBar.setStyle({ style: Style.Light });
      void StatusBar.setBackgroundColor({ color: '#e7a5c0' });
    }
    const router = inject(Router);
    let previous = '';
    let leaving = new Set<string>();
    router.events.subscribe((event) => {
      if (event instanceof NavigationStart && previous) {
        const outlet = isAdmin(event.url) === isAdmin(previous) ? 'ion-tabs ion-router-outlet' : 'ion-app > ion-router-outlet';
        leaving = new Set(visiblePages(outlet).map((page) => page.tagName));
      }
      if (!(event instanceof NavigationEnd)) {
        return;
      }
      const next = event.urlAfterRedirects;
      if (previous && leaving.size > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const forward = screenRank(next) >= screenRank(previous);
        const outlet = isAdmin(next) === isAdmin(previous) ? 'ion-tabs ion-router-outlet' : 'ion-app > ion-router-outlet';
        playEnter(outlet, forward, leaving);
      }
      previous = next;
      leaving = new Set();
    });
  }
}

function playEnter(outlet: string, forward: boolean, before: Set<string>): void {
  let frames = 0;
  const watch = (): void => {
    const entering = visiblePages(outlet).find((page) => !before.has(page.tagName));
    frames += 1;
    if (entering) {
      entering.classList.remove('aniclare-enter-forward', 'aniclare-enter-back');
      entering.style.removeProperty('transform');
      void entering.offsetWidth;
      entering.classList.add(forward ? 'aniclare-enter-forward' : 'aniclare-enter-back');
      entering.addEventListener(
        'animationend',
        () => {
          entering.classList.remove('aniclare-enter-forward', 'aniclare-enter-back');
          entering.style.removeProperty('transform');
        },
        { once: true },
      );
      return;
    }
    if (frames < 24) {
      requestAnimationFrame(watch);
    }
  };
  requestAnimationFrame(watch);
}

function visiblePages(outlet: string): HTMLElement[] {
  return [...document.querySelectorAll(`${outlet} > .ion-page:not(.ion-page-hidden)`)].filter(
    (page): page is HTMLElement => page instanceof HTMLElement,
  );
}

function isAdmin(url: string): boolean {
  return url.includes('/admin');
}

function screenRank(url: string): number {
  if (isAdmin(url)) {
    return 3;
  }
  if (url.includes('/historial')) {
    return 2;
  }
  if (url.includes('/reservar')) {
    return 1;
  }
  return 0;
}
