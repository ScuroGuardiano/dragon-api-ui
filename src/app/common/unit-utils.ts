export function typeFromPathOrName(pathOrName: string): string {
  let searched = '.';
  if (pathOrName.startsWith("/")) {
    searched = '_2e'; // systemd uses that as an escape code for '.' in path
  }
  return pathOrName.substring(pathOrName.lastIndexOf(searched) + searched.length);
}
