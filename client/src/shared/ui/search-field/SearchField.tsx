import { cn } from '@/shared/lib'

import { Icon } from '../icon/Icon'
import { TextInput, type TextInputProps } from '../text-input/TextInput'
import styles from './SearchField.module.css'

export type SearchFieldProps = Omit<TextInputProps, 'iconLeft' | 'type'>

export const SearchField = ({
  placeholder = 'Марка, модель или VIN',
  wrapperClassName,
  className,
  ...rest
}: SearchFieldProps) => (
  <TextInput
    {...rest}
    type="search"
    placeholder={placeholder}
    iconLeft={<Icon name="search" size={20} className={styles.icon} />}
    wrapperClassName={cn(styles.wrapper, wrapperClassName)}
    className={cn(styles.input, className)}
  />
)
