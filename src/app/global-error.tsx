'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body className="flex min-h-screen items-center justify-center bg-[#0f0f23] px-4 text-white">
        <div className="max-w-md space-y-4 text-center">
          <h2 className="text-xl font-bold">Algo salió mal</h2>
          <p className="text-sm text-[#a0a0b8]">Recarga la página o vuelve a intentarlo.</p>
          <button
            type="button"
            className="rounded-full bg-[#e94560] px-5 py-2.5 font-semibold text-white"
            onClick={() => reset()}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
