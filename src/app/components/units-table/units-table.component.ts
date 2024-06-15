import { Component, input, output } from '@angular/core';
import { IUnitListEntry } from '../../services/unit.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-units-table',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './units-table.component.html',
  styleUrl: './units-table.component.scss'
})
export class UnitsTableComponent {
  data = input<IUnitListEntry[]>([]);

  unitClick = output<IUnitListEntry>();
}
