import { Request } from "express"

import { isDefined } from "./helpers/isDefined"

export type TokenExtractor = (request: Request) => string | undefined | null

const AUTH_HEADER = "authorization"
const BEARER_AUTH_SCHEME = "bearer"
const re = /(\S+)\s+(\S+)/

const parseAuthHeader = (headerValue: unknown) => {
  if (typeof headerValue !== "string") {
    return null
  }

  const matches = headerValue.match(re)
  return matches && { scheme: matches[1], value: matches[2] }
}

const fromRequestProp =
  (property: "query" | "headers" | "body") =>
  (paramName: string) =>
  (request: Request) => {
    const requestProp = request[property]

    if (requestProp && paramName in requestProp) {
      return requestProp[paramName]
    }

    return null
  }

export const fromHeader = fromRequestProp("headers")

export const fromBodyField = fromRequestProp("body")

export const fromQueryParam = fromRequestProp("query")

export const fromAuthHeaderWithScheme =
  (authScheme: string) => (request: Request) => {
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

export const fromAuthHeaderAsBearerToken = () =>
  fromAuthHeaderWithScheme(BEARER_AUTH_SCHEME)

/**
 * Takes in an array of valid extractors and returns an extractor that runs all the given extractors
 * against the request and tries to find a token. Returns the first token found.
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
