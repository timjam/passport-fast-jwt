/**
 * Looks like array filter cannot infer the correct type
 * without this
 */
export const isDefined = <T>(value?: T | null): value is T => {
  if (value !== undefined && value !== null) {
    return true
  }

  return false
}
