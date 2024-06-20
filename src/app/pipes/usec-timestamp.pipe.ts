import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import { FormatService } from '../services/format.service';

@Pipe({
  name: 'usecTimestamp',
  standalone: true
})
export class UsecTimestampPipe implements PipeTransform {
  #timeService = inject(FormatService);

  transform(value: number): string {
    return this.#timeService.formatUsecTimestamp(value);
  }
}
