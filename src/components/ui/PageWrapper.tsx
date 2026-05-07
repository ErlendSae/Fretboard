import React from 'react'

interface PageWrapperProps { children: React.ReactNode }

export function PageWrapper({ children }: PageWrapperProps) {
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">{children}</div>
}
