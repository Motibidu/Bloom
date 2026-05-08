import * as React from 'react'
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Label } from '@/components/ui/shadcn/label'
import { Input } from '@/components/ui/shadcn/input'
import { Textarea } from '@/components/ui/shadcn/textarea'
import { cn } from '@/lib/utils'

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  placeholder?: string
  type?: React.HTMLInputTypeAttribute | 'textarea'
  required?: boolean
  className?: string
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = 'text',
  required,
  className,
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={required ? { required: `${label}을(를) 입력해 주세요` } : undefined}
      render={({ field, fieldState }) => (
        <div className={cn('space-y-2', className)}>
          <Label htmlFor={String(name)} className="text-lg font-semibold">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {type === 'textarea' ? (
            <Textarea
              id={String(name)}
              placeholder={placeholder}
              className="text-lg min-h-28 resize-none"
              {...field}
            />
          ) : (
            <Input
              id={String(name)}
              type={type}
              placeholder={placeholder}
              className="h-14 text-lg px-4"
              {...field}
            />
          )}
          {fieldState.error && (
            <p className="text-base text-destructive font-medium">
              {fieldState.error.message}
            </p>
          )}
        </div>
      )}
    />
  )
}
