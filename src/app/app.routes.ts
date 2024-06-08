import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: "units",
    loadComponent: () => import("./pages/units/units.component").then(c => c.UnitsComponent),
    title: "All units - Dragon API"
  }
];
