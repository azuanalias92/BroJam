'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ErrorBoundary from '@/components/ErrorBoundary'

function ProblematicComponent() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    throw new Error('Test error for ErrorBoundary')
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-2">Error Boundary Test</h3>
      <p className="text-muted-foreground mb-4">
        This component can trigger an error to test the ErrorBoundary.
      </p>
      <Button 
        onClick={() => setShouldError(true)}
        variant="destructive"
      >
        Trigger Error
      </Button>
    </div>
  )
}

export default function ErrorBoundaryTest() {
  return (
    <ErrorBoundary>
      <ProblematicComponent />
    </ErrorBoundary>
  )
}