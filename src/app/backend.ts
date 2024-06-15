import { environment } from "../environments/environment";

export const ENDPOINTS = {
  listUnits: `${environment.api}/pid1/units`,
  unitProperties: (urlencodedPath: string) => `${environment.api}/pid1/unit/by-path/${urlencodedPath}/properties`,
  unitPropertiesByName: (name: string) => `${environment.api}/pid1/unit/by-name/${name}/properties`,
}
