import { Pipe, PipeTransform } from '@angular/core';

const ms = 1000;
const second = ms * 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;

@Pipe({
  name: 'usecTimespan',
  standalone: true
})
export class UsecTimespanPipe implements PipeTransform {

  transform(value: number): string {
    // I would use here Intl.DurationFormat but it's currently
    // unsupporter in almost all major browsers
    let x = value;
    let unit = "us";
    let p = false;

    if (value >= day) {
      x = Math.floor(value / day);
      unit = " day";
      p = x > 1;
    }
    else if (value >= hour) {
      x = Math.floor(value / hour);
      unit = "h";
    }
    else if (value >= minute) {
      x = Math.floor(value / minute);
      unit = " min";
      p = x > 1;
    }
    else if (value >= second) {
      x = Math.floor(value / second);
      unit = "s";
    }
    else if (value >= ms) {
      x = Math.floor(value / ms);
      unit = "ms";
    }

    return `${x}${unit}${p ? 's' : ''}`;
  }

}
