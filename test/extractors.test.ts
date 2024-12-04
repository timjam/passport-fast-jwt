import { expect } from "chai"
import { createRequest } from "node-mocks-http"

import {
  fromAuthHeaderWithScheme,
  fromBodyField,
  fromExtractors,
  fromHeader,
  fromQueryParam,
} from "../src/extractors"

describe("Token extractor tests", () => {
  describe("From header", () => {
    const req = createRequest()
    req.headers["token_header"] = "mockToken"

    it("Should return null when no token is present in headers", () => {
      const token = fromHeader("invalid_header")(req)
      expect(token).to.equal(null)
    })

    it("Should return the token when token is present in headers", () => {
      const token = fromHeader("token_header")(req)
      expect(token).to.equal("mockToken")
    })
  })

  describe("From body", () => {
    const req = createRequest()
    req.body["token"] = "mockToken"

    it("Should return null when no token is present in body", () => {
      const token = fromBodyField("invalid_body_field")(req)
      expect(token).to.equal(null)
    })

    it("Should return the token when token is present in body", () => {
      const token = fromBodyField("token")(req)
      expect(token).to.equal("mockToken")
    })
  })

  describe("From query", () => {
    const req = createRequest()
    req.query["token"] = "mockToken"

    it("Should return null when no token is present in query", () => {
      const token = fromQueryParam("invalid_body_field")(req)
      expect(token).to.equal(null)
    })

    it("Should return the token when token is present in query", () => {
      const token = fromQueryParam("token")(req)
      expect(token).to.equal("mockToken")
    })
  })

  describe("From auth header with specific scheme", () => {
    const req = createRequest()

    it("Should return null when there's no auth header present ", () => {
      const token = fromAuthHeaderWithScheme("scheme")(req)
      expect(token).to.equal(null)
    })

    it("Should return null when auth header is present, but it doesn't align with scheme value pattern", () => {
      req.headers["authorization"] = "schemevalue"
      const token = fromAuthHeaderWithScheme("scheme")(req)
      expect(token).to.equal(null)
    })

    it("Should return the scheme value when auth header is valid scheme value pattern", () => {
      req.headers["authorization"] = "scheme value"
      const token = fromAuthHeaderWithScheme("scheme")(req)
      expect(token).to.equal("value")
    })
  })

  describe("From multiple extrators", () => {
    const extractors = [
      fromHeader("token"),
      fromBodyField("token"),
      fromQueryParam("token"),
    ]

    it("Returns token when at least one of the extractors finds a token", () => {
      const req = createRequest()
      req.headers["token"] = "mockToken"
      req.query["token"] = "anotherMockToken"

      const token = fromExtractors(extractors)(req)

      expect(token).to.equal("mockToken")
    })

    it("Returns null when none of the extractors finds a token", () => {
      const req = createRequest()
      req.headers["not_a_matchig_token_header"] = "mockToken"
      req.query["not_a_matching_token_query_param_either"] = "anotherMockToken"

      const token = fromExtractors(extractors)(req)

      expect(token).to.equal(null)
    })
  })
})
