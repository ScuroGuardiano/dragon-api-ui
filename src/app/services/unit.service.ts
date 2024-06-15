import { HttpClient } from '@angular/common/http'; import { Injectable, inject } from '@angular/core';
import { ENDPOINTS } from '../backend';
import { Observable, map } from 'rxjs';
import { IUnitProp, listUnitProps } from '../common/unit-prop.decorator';

// pub const UnitListEntry = struct {
//     name: [:0]const u8,
//     description: [:0]const u8,
//     load_state: [:0]const u8,
//     active_state: [:0]const u8,
//     sub_state: [:0]const u8,
//     followed: [:0]const u8,
//     path: zbus.Path,
//     queued_job_id: u32,
//     job_type: [:0]const u8,
//     job_path: zbus.Path,
// };

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  #http = inject(HttpClient);

  public listUnits(): Observable<IUnitListEntry[]> {
    return this.#http.get<IUnitListEntry[]>(ENDPOINTS.listUnits);
  }

  public getUnitProperties(path: Path, propertyList: string[]): Observable<IUnitProperties> {
    const props = propertyList.join(",");
    return this.#http.get<IUnitProperties>(
      ENDPOINTS.unitProperties(path.path),
      { params: { props } }
    );
  }

  public getUnitPropertiesToObject<T>(path: Path, TargetCls: new() => T): Observable<T> {
    const propsMap = new Map<string, IUnitProp>();
    const unitProps = listUnitProps(TargetCls);
    if (!unitProps) {
      throw new Error(`Class ${TargetCls.name} doesn't have unit properties defined on it.`);
    }
    unitProps.forEach(p => propsMap.set(p.key, p));
    const props = Array.from(propsMap.keys()).join(",");

    return this.#http.get<IUnitProperties>(
      ENDPOINTS.unitProperties(path.path),
      { params: { props } }
    ).pipe(
      map(res => {
        const ret = new TargetCls();
        return this.mapPropertiesToTarget(propsMap, res, ret);
      })
    );
  }

  public getUnitPropertiesToObjectByName<T>(name: string, TargetCls: new() => T): Observable<T> {
    const propsMap = new Map<string, IUnitProp>();
    const unitProps = listUnitProps(TargetCls);
    if (!unitProps) {
      throw new Error(`Class ${TargetCls.name} doesn't have unit properties defined on it.`);
    }
    unitProps.forEach(p => propsMap.set(p.key, p));
    const props = Array.from(propsMap.keys()).join(",");

    return this.#http.get<IUnitProperties>(
      ENDPOINTS.unitPropertiesByName(name),
      { params: { props } }
    ).pipe(
      map(res => {
        const ret = new TargetCls();
        return this.mapPropertiesToTarget(propsMap, res, ret);
      })
    );
  }

  private mapPropertiesToTarget<T>(propsMap: Map<string, IUnitProp>, raw: IUnitProperties, target: T): T {
    Object.keys(raw).forEach(key => {
      const val = raw[key];
      if (!val) {
        return;
      }

      const prop = propsMap.get(key);
      if (!prop) {
        return;
      }

      if (prop.transform) {
        // @ts-ignore
        target[prop.property] = prop.transform(raw[prop.key]);
      }
      else {
        // @ts-ignore
        target[prop.property] = raw[prop.key];
      }
    });

    return target;
  }
}

export class Path {
  constructor(public readonly path: string, isUrlEncoded = false) {
    if (!isUrlEncoded) {
      this.path = encodeURIComponent(path);
    }
  }
}

export interface IUnitListEntry {
  name: string;
  description: string;
  load_state: string;
  active_state: string;
  sub_state: string;
  followed: string;
  path: string;
  queued_job_id: number;
  job_type: string;
  job_path: string;
}

export interface IUnitProperties {
  [key: string]: UnitPropertyType;
}

export interface IDictEntry<T> {
  key: boolean | number | string;
  value: T;
}

export type UnitPropertyType = boolean | string | number | UnitPropertyType[] | IDictEntry<UnitPropertyType>[];
