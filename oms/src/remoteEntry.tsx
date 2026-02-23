/**
 * Module Federation remote entry for OMS.
 * Exports the component + inline CSS for shadow DOM isolation by the host.
 */
export { OmsRoutes as Component } from './App'
export { default as cssText } from './index.css?inline'
