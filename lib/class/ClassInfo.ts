import { ClassType } from '../utils/types';

/** class info */
export interface ClassInfo {
  /** package name */
  pkg?: string;
  /** package version */
  version?: string;
  /** class name */
  name?: string;
  /** class qualified name */
  qualifiedName?: string;
  /** super classes */
  extends?: ClassType[];
  /** implement interfaces */
  implements?: (ClassType | symbol)[];
}
