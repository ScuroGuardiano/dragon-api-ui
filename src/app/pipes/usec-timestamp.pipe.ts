import { formatDate } from '@angular/common';
import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';

@Pipe({
  name: 'usecTimestamp',
  standalone: true
})
export class UsecTimestampPipe implements PipeTransform {
  #localeID = inject(LOCALE_ID);

  transform(value: number): string {
    const x = Math.floor(value / 1000);
    return formatDate(new Date(x), "EEE YYYY-MM-dd HH:mm:ss O", this.#localeID) ?? "Invalid date";
  }

}
