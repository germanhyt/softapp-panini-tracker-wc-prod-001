import { Suspense } from 'react'
import { AlbumView } from '@/components/album/album-view'

export default function AlbumPage() {
  return (
    <Suspense fallback={<div className="loading">📖 Cargando álbum...</div>}>
      <AlbumView />
    </Suspense>
  )
}
