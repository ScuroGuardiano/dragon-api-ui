import { Component, input, output } from '@angular/core';
import { IUnitListEntry } from '../../services/unit.service';
import { RouterLink } from '@angular/router';
import { UnitLinkComponent } from "../unit-link/unit-link.component";

@Component({
    selector: 'app-units-table',
    standalone: true,
    templateUrl: './units-table.component.html',
    styleUrl: './units-table.component.scss',
    imports: [RouterLink, UnitLinkComponent]
})
export class UnitsTableComponent {
  data = input<IUnitListEntry[]>([]);
}
