const re = /(\S+)\s+(\S+)/

export const parseAuthHeader = (headerValue: unknown) => {
  if (typeof headerValue !== "string") {
    return null
  }

  const matches = headerValue.match(re)

  return matches && { scheme: matches[1], value: matches[2] }
}
