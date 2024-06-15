import 'reflect-metadata';

export type TransformFn<T = any, U = any> = (v: T) => U;

export interface IUnitProp {
  key: string;
  property: string;
  transform?: TransformFn;
}

export const UNIT_PROP_KEY = Symbol("Unit property metadata key");

export function UnitProp<T = any, U = any>(key: string, transform?: TransformFn<T, U>) {
  return function (target: any, property: string) {
    let props: IUnitProp[] | undefined = Reflect.getMetadata(UNIT_PROP_KEY, target);
    if (!props) {
      props = [];
      Reflect.defineMetadata(UNIT_PROP_KEY, props, target);
    }
    props.push({ key, property, transform });
  }
}

export function listUnitProps<T>(cls: new() => T): IUnitProp[] | undefined {
  const props = Reflect.getMetadata(UNIT_PROP_KEY, cls.prototype);
  return props;
}
