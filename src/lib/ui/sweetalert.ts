import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const swalTheme = {
  background: '#1a1030',
  color: '#ffffff',
  confirmButtonColor: '#e31837',
  cancelButtonColor: '#3d2a5c',
} as const

export async function confirmDialog(options: {
  title: string
  html?: string
  text?: string
  confirmText?: string
  cancelText?: string
  icon?: 'warning' | 'question' | 'info'
}): Promise<boolean> {
  const result = await Swal.fire({
    title: options.title,
    html: options.html,
    text: options.html ? undefined : options.text,
    icon: options.icon ?? 'question',
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Sí, continuar',
    cancelButtonText: options.cancelText ?? 'Cancelar',
    reverseButtons: true,
    focusCancel: true,
    ...swalTheme,
  })

  return result.isConfirmed
}

export async function alertSuccess(options: { title: string; text?: string }): Promise<void> {
  await Swal.fire({
    title: options.title,
    text: options.text,
    icon: 'success',
    confirmButtonText: 'Entendido',
    ...swalTheme,
  })
}
