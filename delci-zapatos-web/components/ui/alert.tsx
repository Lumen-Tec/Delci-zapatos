import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva('relative grid w-full grid-cols-[0_1fr] items-start gap-x-3 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[1rem_1fr] [&>svg]:mt-0.5 [&>svg]:text-current', {
    variants: {
        variant: {
            default: 'bg-background text-foreground',
            destructive: 'border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive',
        },
    },
    defaultVariants: { variant: 'default' },
})

function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
    return <div role="alert" data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<'h5'>) {
    return <h5 data-slot="alert-title" className={cn('col-start-2 mb-1 font-medium leading-none tracking-tight', className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="alert-description" className={cn('col-start-2 text-sm [&_p]:leading-relaxed', className)} {...props} />
}

export { Alert, AlertDescription, AlertTitle }
