import { formatDate } from '@angular/common';
import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64 } from '../common/unit-utils';

const ms = 1000;
const second = 1000 * ms;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

const kib = 1024;
const mib = 1024 * kib;
const gib = 1024 * mib;
const tib = 1024 * gib;

@Injectable({
  providedIn: 'root'
})
export class FormatService {
  #localeId = inject(LOCALE_ID);

  formatUsecTimestamp(value: number): string {
    const x = value / 1000;
    return formatDate(new Date(x), "EEE YYYY-MM-dd HH:mm:ss O", this.#localeId) ?? "Invalid date";
  }

  formatUsecRelativeTimestamp(value: number) {
    const diff = Math.floor(value) - Date.now() * 1000;
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

  formatUsecTimespan(value: number): string {
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

  formatBytes(bytes: number) {
    if (bytes >= tib) {
      return (bytes / tib).toFixed(2) + "T";
    }
    if (bytes >= gib) {
      return (bytes / gib).toFixed(2) + "G";
    }
    if (bytes >= mib) {
      return (bytes / mib).toFixed(2) + "M";
    }
    if (bytes >= kib) {
      return (bytes / kib).toFixed(2) + "K";
    }
    return bytes + "B";
  }

  formatPossiblyInfiniteBytes(bytes: number) {
    if (bytes < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64) {
      return "infinity";
    }
    return this.formatBytes(bytes);
  }
}
