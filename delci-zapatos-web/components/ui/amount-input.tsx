'use client'

import { useEffect, useRef, type ChangeEvent, type ComponentProps, type KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { amountCaretPosition, amountValidationMessage, formatAmountInput, parseAmountInput } from '@/lib/number-input'

type AmountInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'inputMode' | 'value' | 'onChange' | 'min' | 'max' | 'step' | 'ref'> & {
    value: string
    onValueChange: (value: string) => void
    min?: number
    max?: number
}

export function AmountInput({ value, onValueChange, min, max, onKeyDown, ...props }: AmountInputProps) {
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.setCustomValidity(amountValidationMessage(value, min, max))
    }, [value, min, max])

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const entered = input.value
        const caret = input.selectionStart ?? entered.length
        const parsed = parseAmountInput(entered)
        const nextValue = parsed ?? value
        const formatted = formatAmountInput(nextValue)
        const charactersBeforeCaret = entered.slice(0, caret).replace(/\s/g, '').length + (/^[.,]/.test(entered) ? 1 : 0)
        const nextCaret = amountCaretPosition(formatted, charactersBeforeCaret)

        input.value = formatted
        input.setSelectionRange(nextCaret, nextCaret)
        input.setCustomValidity(amountValidationMessage(nextValue, min, max))
        if (parsed !== null) onValueChange(parsed)
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        const input = event.currentTarget
        const caret = input.selectionStart
        if (caret === null || caret !== input.selectionEnd) return
        if (event.key === 'Backspace' && input.value[caret - 1] === ' ') input.setSelectionRange(caret - 1, caret - 1)
        if (event.key === 'Delete' && input.value[caret] === ' ') input.setSelectionRange(caret + 1, caret + 1)
    }

    return <Input {...props} ref={inputRef} type="text" inputMode="decimal" value={formatAmountInput(value)} onChange={handleChange} onKeyDown={handleKeyDown} />
}
