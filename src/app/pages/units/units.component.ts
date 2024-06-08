import { Component, inject } from '@angular/core';
import { UnitsTableComponent } from "../../components/units-table/units-table.component";
import { UnitService } from '../../services/unit.service';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-units',
    standalone: true,
    templateUrl: './units.component.html',
    styleUrl: './units.component.scss',
    imports: [UnitsTableComponent, AsyncPipe]
})
export class UnitsComponent {
  #unitService = inject(UnitService);

  units = this.#unitService.listUnits();
}
