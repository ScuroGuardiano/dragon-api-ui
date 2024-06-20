import { Component, computed, effect, inject, signal } from '@angular/core';
import { UnitsTableComponent } from "../../components/units-table/units-table.component";
import { IUnitListEntry, UnitService } from '../../services/unit.service';
import { AsyncPipe } from '@angular/common';
import { UnitDetailsComponent } from "../../components/unit-details-rework/unit-details.component";
import { UnitDetailsService } from '../../services/unit-details.service';

@Component({
    selector: 'app-units',
    standalone: true,
    templateUrl: './units.component.html',
    styleUrl: './units.component.scss',
    imports: [UnitsTableComponent, AsyncPipe, UnitDetailsComponent]
})
export class UnitsComponent {
  constructor() {
    effect(() => console.log(`Sex ${this.selectedUnit()}`));
  }

  #unitService = inject(UnitService);
  #unitDetails = inject(UnitDetailsService);

  units = this.#unitService.listUnits();
  selectedUnit = this.#unitDetails.currentUnit;
}
