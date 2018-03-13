import { getGlobalTypeByDecorator } from './decorators'
import { getMetadata } from '../utils'

/**
 * inject
 * type: class or string
 * @param {{ type: any }} { type }
 * @returns
 * @memberof Decorators
 */
export function inject({ type }: { type?: any } = {}) {
  return (target: any, key: string) => {
    const globalType = getGlobalTypeByDecorator(type, target, key)
    getMetadata(target.constructor).injects.push({
      key,
      globalType,
      type: 'inject'
    })
  }
}

/**
 * lazy inject
 * type: class or string
 * always: always read from context. default: false
 * subClass: getSubClasses. default: false
 * @param {{ type: any, always: boolean, subClass: boolean }} { type, always = false, subClass = false }
 * @returns
 * @memberof Decorators
 */
export function lazyInject({ type, always = false, subClass = false }: {
  type?: any, always?: boolean, subClass?: boolean
} = {}) {
  return (target: any, key: string) => {
    const globalType = getGlobalTypeByDecorator(type, target, key)
    getMetadata(target.constructor).injects.push({
      key,
      globalType,
      type: 'lazyInject',
      always,
      subClass,
    })
  }
}

/**
 * lazy inject subClass, the abbreviation of lazy inject
 * type: class or string
 * always: always read from context. default: false
 * @param {{ type: any, always: boolean }} { type, always = false }
 * @returns
 * @memberof Decorators
 */
export function lazyInjectSubClass({ type, always = false }: {
  type: any, always?: boolean
} = { type: undefined }) {
  return lazyInject({ type, always, subClass: true })
}
