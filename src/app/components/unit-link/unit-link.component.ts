import { Component, computed, input } from '@angular/core';
import { typeFromPathOrName } from '../../common/unit-utils';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unit-link',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './unit-link.component.html',
  styleUrl: './unit-link.component.scss'
})
export class UnitLinkComponent {
  pathOrName = input.required<string>();
  type = computed(() => typeFromPathOrName(this.pathOrName()));
}
