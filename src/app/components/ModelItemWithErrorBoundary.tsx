'use client'

import React from 'react'
import ModelItem from './ModelItem'
import SimpleModelItem from './SimpleModelItem'
import { ErrorBoundary } from './ErrorBoundary'

type Props = {
  url: string
  id: string
  fallbackShape?: 'box' | 'sphere' | 'cone' | 'cylinder'
  fallbackColor?: string
}

export default function ModelItemWithErrorBoundary({ 
  url, 
  id, 
  fallbackShape = 'box',
  fallbackColor = '#ff6b6b'
}: Props) {
  return (
    <ErrorBoundary
      fallback={
        <SimpleModelItem 
          id={id} 
          shape={fallbackShape} 
          color={fallbackColor} 
        />
      }
    >
      <ModelItem url={url} id={id} />
    </ErrorBoundary>
  )
}

