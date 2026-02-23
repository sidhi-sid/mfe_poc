/**
 * Module Federation remote types.
 * Each remote exports a React component + inline CSS text for shadow isolation.
 */
declare module 'oms/App' {
  import type { ComponentType } from 'react'
  export const Component: ComponentType
  export const cssText: string
}

declare module 'dashboard/App' {
  import type { ComponentType } from 'react'
  export const Component: ComponentType
  export const cssText: string
}
