import Swal from 'sweetalert2'

const toastOptions = {
    toast: true,
    position: 'center' as const,
    showConfirmButton: false,
    timer: 3000,
    animation: false,
}

export function showSuccess(title: string) {
    return Swal.fire({ ...toastOptions, icon: 'success', title })
}

export function showError(title: string) {
    return Swal.fire({ ...toastOptions, icon: 'error', title })
}
