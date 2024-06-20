import { Pipe, PipeTransform, inject } from '@angular/core';
import { FormatService } from '../services/format.service';

@Pipe({
  name: 'usecTimespan',
  standalone: true
})
export class UsecTimespanPipe implements PipeTransform {
  #timeService = inject(FormatService);

  transform(value: number): string {
    return this.#timeService.formatUsecTimespan(value);
  }
}
