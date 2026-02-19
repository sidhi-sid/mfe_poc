/**
 * Module Federation remote entry for OMS.
 * Exports OmsRoutes (without BrowserRouter) so it integrates cleanly
 * with the host shell's router context.
 */
import './remote.css'
export { OmsRoutes as default } from './App'
