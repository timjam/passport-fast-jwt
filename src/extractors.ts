import { Request } from "express"

import { isDefined } from "./helpers/isDefined"
import { parseAuthHeader } from "./helpers/parseAuthHeader"

export type TokenExtractor = (request: Request) => string | undefined | null

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

export const fromAuthHeaderWithScheme =
  (authScheme: string): TokenExtractor =>
  (request: Request) => {
    const authHeader = request.headers[AUTH_HEADER]

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

export const fromAuthHeaderAsBearerToken = () =>
  fromAuthHeaderWithScheme(BEARER_AUTH_SCHEME)

/**
 * Takes in an array of valid extractors and returns an extractor that runs all the given extractors
 * against the request and tries to find a token. Returns the first token found. Extractors are
 * run in the order they are given in the array.
 * @param extractors An array of valid extractor functions
 * @returns
 */
export const fromExtractors =
  (extractors: TokenExtractor[]) => (request: Request) => {
    const token = extractors.map((ext) => ext(request)).filter(isDefined)

    if (!token.length) {
      return null
    }

    return token[0]
  }
