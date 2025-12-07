import * as THREE from 'three'

declare module 'three' {
  interface BufferGeometry {
    boundsTree?: any
    computeBoundsTree(options?: any): any
    disposeBoundsTree(): void
  }
}

