import { Request } from "express"

import { isDefined } from "./helpers/isDefined"
import { parseAuthHeader } from "./helpers/parseAuthHeader"
import { TokenExtractor } from "./types"

const AUTH_HEADER = "authorization"
const BEARER_AUTH_SCHEME = "bearer"

const fromRequestProp =
  (property: keyof Request) =>
  (paramName: string): TokenExtractor =>
  (request: Request) => {
    const requestProp = request[property]

    if (requestProp && paramName in requestProp) {
      return requestProp[paramName]
    }

    return null
  }
/**
 * Constructs a token extractor function with the given authentication scheme
 * and authentication header name.
 *
 * @param authScheme
 * @param authHeaderName
 * @returns
 */
export const fromAuthHeaderWithScheme =
  (authHeaderName: string, authScheme: string): TokenExtractor =>
  (request: Request) => {
    const authHeader = request.headers[authHeaderName]

    if (authHeader) {
      const authParam = parseAuthHeader(authHeader)
      if (
        authParam &&
        authScheme.toLowerCase() === authParam.scheme.toLowerCase()
      ) {
        return authParam.value
      }
    }

    return null
  }

export const fromHeader = fromRequestProp("headers")

export const fromBodyField = fromRequestProp("body")

export const fromQueryParam = fromRequestProp("query")

/**
 * A ready made token extractor for 'Authorization' header
 * with 'Bearer' scheme. This is shorthand for
 *
 * @example
 * fromAuthHeaderWithScheme('authorization', 'bearer')
 *
 * @returns Token extractor for bearer authorization scheme
 */
export const fromAuthHeaderAsBearerToken = () =>
  fromAuthHeaderWithScheme(AUTH_HEADER, BEARER_AUTH_SCHEME)

/**
 * Takes in an array of valid extractors and returns an extractor that runs all the given extractors
 * against the request and tries to find a token. Returns the first token found. Extractors are
 * run in the order they are given in the array.
 * @param extractors An array of valid extractor functions
 * @returns token as string if some of the extractors finds a token, otherwise null
 *
 * @example
 * fromExtractors([
 *   fromAuthHeaderAsBearerToken(),
 *   fromAuthHeaderWithScheme('x-authorization', 'bearer'),
 *   fromBodyField('token')
 * ])
 */
export const fromExtractors =
  (extractors: TokenExtractor[]) => (request: Request) => {
    const token = extractors.map((ext) => ext(request)).filter(isDefined)

    if (!token.length) {
      return null
    }

    return token[0]
  }
