import { Pipe, PipeTransform, inject } from '@angular/core';
import { FormatService } from '../services/format.service';

@Pipe({
  name: 'usecTimestampRelative',
  standalone: true
})
export class UsecTimestampRelativePipe implements PipeTransform {
  #timeService = inject(FormatService);

  transform(value: number): string {
    return this.#timeService.formatUsecRelativeTimestamp(value);
  }
}
