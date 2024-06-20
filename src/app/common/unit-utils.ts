export function typeFromPathOrName(pathOrName: string): string {
  let searched = '.';
  if (pathOrName.startsWith("/")) {
    searched = '_2e'; // systemd uses that as an escape code for '.' in path
  }
  return pathOrName.substring(pathOrName.lastIndexOf(searched) + searched.length);
}

// Alright, the problem is javascript can store safely numbers up to 2^53 but it works properly for my usecase XD
// I don't use it to do `==` but `<`. Btw (2^64 - 1..1024) < 2^64 is false as a result of this inaccuracy
// So in theory number 2^64 - 1024 would be treaten as invalid but in reality no variable should reach that high value
export const PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64 = Math.pow(2, 64);

export function timestampIsSet(ts: number) {
  return ts > 0 && ts < PROBABLY_NOT_TOO_ACCURATE_MAX_UINT64;
}
