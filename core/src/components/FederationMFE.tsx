import type { ModuleWithAvailability } from '@/hooks/useModules'
import { useMemo } from 'react'

interface FederationMFEProps {
  module: ModuleWithAvailability
}

export function FederationMFE({ module }: FederationMFEProps) {
  const src = useMemo(() => {
    console.log("module ==>> ", module);
    const base = (module.baseUrl ?? '').toString().trim()
    const path = module.path || '/'

    if (!base) {
      // If no baseUrl, assume the module is served under the same origin.
      return path
    }

    const normalizedBase = base.replace(/\/$/, '')
    return `${normalizedBase}${path}`
  }, [module.baseUrl, module.path])

  if (!src) {
    return (
      <p className="text-muted-foreground">
        Unable to resolve URL for module: {module.id}. Check its configuration.
      </p>
    )
  }

  return (
    <div className="w-full h-full min-h-[200px]">
      <iframe
        src={src}
        title={module.label ?? module.id}
        className="w-full h-full border-0"
      />
    </div>
  )
}
