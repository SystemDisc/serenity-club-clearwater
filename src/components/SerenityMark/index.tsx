import { cn } from '@/utilities/ui'
import React from 'react'

type SerenityMarkProps = {
  className?: string
}

export function SerenityMark({ className }: SerenityMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block shrink-0 overflow-hidden rounded-md bg-stone-50 bg-cover bg-center',
        className,
      )}
      style={{ backgroundImage: "url('/brand/serenity-sc-mark.svg')" }}
    />
  )
}
