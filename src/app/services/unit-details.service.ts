import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UnitDetailsService {
  #router = inject(Router);
  #currentUnit = signal<string | null>(this.getCurrentUnitFromQuery());

  constructor() {
    this.#router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => this.#currentUnit.set(this.getCurrentUnitFromQuery()));
  }

  get currentUnit() {
    return this.#currentUnit.asReadonly();
  }

  showUnitDetails(pathOrName: string) {
    this.#router.navigate(['.'], {
      queryParams: { unit: pathOrName },
      queryParamsHandling: 'merge'
    });
  }

  hideUnitDetails() {
    this.#router.navigate(['.'], {
      queryParams: { unit: null },
      queryParamsHandling: 'merge'
    });
  }

  private getCurrentUnitFromQuery(): string | null {
    const url = new URL(this.#router.url);
    return url.searchParams.get("unit");
  }
}
