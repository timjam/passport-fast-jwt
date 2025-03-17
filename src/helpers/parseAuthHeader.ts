const re = /(\S+)\s+(\S+)/

/**
 * Parses an HTTP Authorization header value to extract the scheme and value.
 *
 * @param headerValue - The value of the Authorization header.
 * @returns An object containing the scheme and value if the header is valid, otherwise null.
 *
 * @example
 * parseAuthHeader("Bearer token123")
 * // Returns: { scheme: "Bearer", value: "token123" }
 *
 * parseAuthHeader("Basic dGVzdDp0ZXN0cGFzcw==")
 * // Returns: { scheme: "Basic", value: "dGVzdDp0ZXN0cGFzcw==" }
 *
 * parseAuthHeader(12345)
 * // Returns: null
 *
 * parseAuthHeader("InvalidHeader")
 * // Returns: null
 */
export const parseAuthHeader = (headerValue: unknown) => {
  if (typeof headerValue !== "string") {
    return null
  }

  const matches = headerValue.match(re)

  return matches && { scheme: matches[1], value: matches[2] }
}
