export function typeFromPathOrName(pathOrName: string): string {
  let searched = '.';
  if (pathOrName.startsWith("/")) {
    searched = '_2e'; // systemd uses that as an escape code for '.' in path
  }
  return pathOrName.substring(pathOrName.lastIndexOf(searched) + searched.length);
}

const TIMESTAMP_MAX = Math.pow(2, 63);
export function timestampIsSet(ts: number) {
  // Alright, so systemd represents sometimes unset timestamp as UINT64_MAX
  // Javascript can't represent such a large number with accuracy
  // So I'll just compare it with 2^63, it's close enough and we will never reach
  // timestamp of 2^63 in nanoseconds is 11 April 2262, so I don't care :3
  return ts > 0 && ts < TIMESTAMP_MAX;
}

