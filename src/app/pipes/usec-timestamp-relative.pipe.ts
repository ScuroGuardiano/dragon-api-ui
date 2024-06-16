import { Pipe, PipeTransform } from '@angular/core';

const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

@Pipe({
  name: 'usecTimestampRelative',
  standalone: true
})
export class UsecTimestampRelativePipe implements PipeTransform {

  transform(value: number): string {
    const diff = Math.floor(value / 1000) - Date.now();
    const diffAbs = Math.abs(diff);
    const diffSign = Math.sign(diff);
    const format = new Intl.RelativeTimeFormat();

    if (diffAbs >= day) {
      return format.format(diffSign * Math.floor(diffAbs / day), 'day');
    }
    if (diffAbs >= hour) {
      return format.format(diffSign * Math.floor(diffAbs / hour), 'hour');
    }
    if (diffAbs >= minute) {
      return format.format(diffSign * Math.floor(diffAbs / minute), 'minute');
    }
    return format.format(diffSign * Math.floor(diffAbs / second), 'second');
  }

}
