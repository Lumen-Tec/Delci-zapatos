import type { ComponentProps } from 'react'
import { ChevronLeft, ChevronRight, Ellipsis } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function Pagination({ className, ...props }: ComponentProps<'nav'>) {
    return <nav aria-label="Paginación" data-slot="pagination" className={cn('mx-auto flex w-full justify-center', className)} {...props} />
}

function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
    return <ul data-slot="pagination-content" className={cn('flex items-center gap-1', className)} {...props} />
}

function PaginationItem(props: ComponentProps<'li'>) {
    return <li data-slot="pagination-item" {...props} />
}

function PaginationButton({ className, isActive, size = 'icon-sm', ...props }: ComponentProps<'button'> & { isActive?: boolean; size?: 'icon-sm' | 'sm' }) {
    return <button aria-current={isActive ? 'page' : undefined} className={cn(buttonVariants({ variant: isActive ? 'outline' : 'ghost', size }), isActive && 'bg-muted', className)} {...props} />
}

function PaginationPrevious(props: ComponentProps<'button'>) {
    return <PaginationButton size="sm" aria-label="Página anterior" {...props}><ChevronLeft aria-hidden="true" data-icon="inline-start" /><span>Anterior</span></PaginationButton>
}

function PaginationNext(props: ComponentProps<'button'>) {
    return <PaginationButton size="sm" aria-label="Página siguiente" {...props}><span>Siguiente</span><ChevronRight aria-hidden="true" data-icon="inline-end" /></PaginationButton>
}

function PaginationEllipsis() {
    return <span aria-hidden="true" className="flex size-7 items-center justify-center text-muted-foreground"><Ellipsis /></span>
}

export { Pagination, PaginationButton, PaginationContent, PaginationEllipsis, PaginationItem, PaginationNext, PaginationPrevious }
