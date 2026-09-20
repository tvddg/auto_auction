import { cn } from '@/shared/lib'

import styles from './SegmentedControl.module.css'

export type SegmentedOption<TValue extends string> = {
  value: TValue
  label: string
}

export type SegmentedControlProps<TValue extends string> = {
  value: TValue
  options: ReadonlyArray<SegmentedOption<TValue>>
  onChange: (value: TValue) => void
  'aria-label'?: string
  className?: string
}

export const SegmentedControl = <TValue extends string>({
  value,
  options,
  onChange,
  'aria-label': ariaLabel,
  className,
}: SegmentedControlProps<TValue>) => (
  <div className={cn(styles.root, className)} role="tablist" aria-label={ariaLabel}>
    {options.map((option) => {
      const isActive = option.value === value

      return (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={cn(styles.option, isActive && styles.active)}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      )
    })}
  </div>
)
