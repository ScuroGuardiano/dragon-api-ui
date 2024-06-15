import { Component, computed, inject, signal } from '@angular/core';
import { UnitsTableComponent } from "../../components/units-table/units-table.component";
import { IUnitListEntry, UnitService } from '../../services/unit.service';
import { AsyncPipe } from '@angular/common';
import { UnitDetailsComponent } from "../../components/unit-details/unit-details.component";

@Component({
    selector: 'app-units',
    standalone: true,
    templateUrl: './units.component.html',
    styleUrl: './units.component.scss',
    imports: [UnitsTableComponent, AsyncPipe, UnitDetailsComponent]
})
export class UnitsComponent {
  #unitService = inject(UnitService);

  units = this.#unitService.listUnits();

  detailsRow = signal<IUnitListEntry | null>(null);
  detailsPath = computed(() => this.detailsRow()?.path);

  showUnitDetails(unit: IUnitListEntry) {
    console.log(`Showing unit ${unit.path}`);
    this.detailsRow.set(unit);
  }

  hideUnitDetails() {
    this.detailsRow.set(null);
  }
}
