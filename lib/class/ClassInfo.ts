import { KeyType } from '../utils/types';

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
  extends?: KeyType[];
  /** implement interfaces */
  implements?: KeyType[];
}
