/**
 * Utility function to conditionally join class names
 * Similar to clsx/classnames but lightweight
 */
export function cn(...classes) {
  return classes
    .flat()
    .filter((x) => typeof x === 'string' && x.length > 0)
    .join(' ')
}

/**
 * Merge class names with conditional object support
 * Example: cn('base', { 'active': isActive, 'disabled': isDisabled })
 */
export function cx(...args) {
  const classes = []

  args.forEach((arg) => {
    if (!arg) return

    if (typeof arg === 'string') {
      classes.push(arg)
    } else if (typeof arg === 'object') {
      Object.entries(arg).forEach(([key, value]) => {
        if (value) classes.push(key)
      })
    }
  })

  return classes.join(' ')
}
