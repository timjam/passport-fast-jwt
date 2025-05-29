import { expect } from "chai"
import { createRequest } from "node-mocks-http"

import {
  fromAuthHeaderWithScheme,
  fromBodyField,
  fromExtractors,
  fromHeader,
  fromQueryParam,
} from "../../src/extractors"

const TOKEN_HEADER = "token_header"
const INVALID_TOKEN_HEADER = "invalid_header"
const MOCK_TOKEN_1 = "mockToken"
const MOCK_TOKEN_2 = "anotherMockToken"
const SCHEME = "scheme"
const INVALID_BODY_FIELD = "invalid_body_field"
const TOKEN_FIELD_NAME = "token"
const AUTH_HEADER = "authorization"

describe("Token extractor tests", () => {
  describe("From header", () => {
    const req = createRequest()
    req.headers[TOKEN_HEADER] = MOCK_TOKEN_1

    it("Should return null when no token is present in headers", () => {
      const token = fromHeader(INVALID_TOKEN_HEADER)(req)
      expect(token).to.equal(null)
    })

    it("Should return the token when token is present in headers", () => {
      const token = fromHeader(TOKEN_HEADER)(req)
      expect(token).to.equal(MOCK_TOKEN_1)
    })
  })

  describe("From body", () => {
    const req = createRequest()
    req.body[TOKEN_FIELD_NAME] = MOCK_TOKEN_1

    it("Should return null when no token is present in body", () => {
      const token = fromBodyField(INVALID_BODY_FIELD)(req)
      expect(token).to.equal(null)
    })

    it("Should return the token when token is present in body", () => {
      const token = fromBodyField(TOKEN_FIELD_NAME)(req)
      expect(token).to.equal(MOCK_TOKEN_1)
    })
  })

  describe("From query", () => {
    const req = createRequest()
    req.query[TOKEN_FIELD_NAME] = MOCK_TOKEN_1

    it("Should return null when no token is present in query", () => {
      const token = fromQueryParam(INVALID_BODY_FIELD)(req)
      expect(token).to.equal(null)
    })

    it("Should return the token when token is present in query", () => {
      const token = fromQueryParam(TOKEN_FIELD_NAME)(req)
      expect(token).to.equal(MOCK_TOKEN_1)
    })
  })

  describe("From auth header with specific scheme", () => {
    const req = createRequest()

    it("Should return null when there's no auth header present ", () => {
      const token = fromAuthHeaderWithScheme(AUTH_HEADER, SCHEME)(req)
      expect(token).to.equal(null)
    })

    it("Should return null when auth header is present, but it doesn't align with scheme value pattern", () => {
      req.headers["authorization"] = "schemevalue"
      const token = fromAuthHeaderWithScheme(AUTH_HEADER, SCHEME)(req)
      expect(token).to.equal(null)
    })

    it("Should return the scheme value when auth header is valid scheme value pattern", () => {
      req.headers["authorization"] = "scheme value"
      const token = fromAuthHeaderWithScheme(AUTH_HEADER, SCHEME)(req)
      expect(token).to.equal("value")
    })
  })

  describe("From multiple extrators", () => {
    const extractors = [
      fromHeader(TOKEN_FIELD_NAME),
      fromBodyField(TOKEN_FIELD_NAME),
      fromQueryParam(TOKEN_FIELD_NAME),
    ]

    it("Returns token when at least one of the extractors finds a token", () => {
      const req = createRequest()
      req.headers[TOKEN_FIELD_NAME] = MOCK_TOKEN_1
      req.query[TOKEN_FIELD_NAME] = MOCK_TOKEN_2

      const token = fromExtractors(extractors)(req)

      expect(token).to.equal(MOCK_TOKEN_1)
    })

    it("Returns null when none of the extractors finds a token", () => {
      const req = createRequest()
      req.headers["not_a_matchig_token_header"] = MOCK_TOKEN_1
      req.query["not_a_matching_token_query_param_either"] = MOCK_TOKEN_2

      const token = fromExtractors(extractors)(req)

      expect(token).to.equal(null)
    })
  })
})
