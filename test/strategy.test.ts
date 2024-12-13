/* eslint-disable @typescript-eslint/no-explicit-any */
import { use } from "chai"
import chaiPassportStrategy from "chai-passport-strategy"
import { TokenError } from "fast-jwt"

import { fromAuthHeaderAsBearerToken, fromHeader } from "../src/extractors"
import { JwtStrategy } from "../src/strategy"
import { AfterVerifyCallback, CBWithError, JwtSections } from "../src/types"
import {
  createTestKeys,
  createTestTokens,
  deleteTestKeys,
  eddsaComplete,
  eddsaNoPassVerify,
  rsaNoPassVerify,
  rsaVerify,
  testTokenPayload,
} from "./testUtils/keyFileUtils"

const chai = use(chaiPassportStrategy)

describe("JWT Strategy tests", () => {
  let testTokens: Awaited<ReturnType<typeof createTestTokens>>

  before(async () => {
    await createTestKeys()
    testTokens = await createTestTokens()
  })

  after(async () => {
    await deleteTestKeys()
  })

  describe("Can verify tokens signed with protected key", () => {
    let user = null
    let info = null

    before(() => {
      const strategy = new JwtStrategy<CBWithError>(
        rsaVerify,
        { tokenExtractor: fromHeader("token") },
        (error, sections, done) => {
          if (error) {
            throw new Error("There shouldn't be error this time")
          }

          const user = sections.payload.sub
          return done(null, user, { message: "Random test info" })
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["token"] = testTokens.rsaProtectedToken
        })
        .success((u, i) => {
          user = u
          info = i
        })
        .authenticate()
    })

    it("User and info should be set", () => {
      chai.expect(user).to.be.not.equal(null)
      chai.expect(info).to.be.not.equal(null)
      chai.expect(user).to.be.equal(testTokenPayload.sub)
      chai.assert.deepEqual(info, { message: "Random test info" })
    })
  })

  describe("Can verify tokens signed with rsa key", () => {
    let user = null
    let info = null

    before(() => {
      const strategy = new JwtStrategy<AfterVerifyCallback>(
        rsaNoPassVerify,
        { tokenExtractor: fromAuthHeaderAsBearerToken() },
        (sections, done) => {
          const user = sections.payload.sub
          return done(null, user, { message: "Random test info" })
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["authorization"] =
            `Bearer ${testTokens.rsaUnprotectedToken}`
        })
        .success((u, i) => {
          user = u
          info = i
        })
        .authenticate()
    })

    it("User and info should be set after succesful verification", () => {
      chai.expect(user).to.be.not.equal(null)
      chai.expect(info).to.be.not.equal(null)
      chai.expect(user).to.be.equal(testTokenPayload.sub)
      chai.assert.deepEqual(info, { message: "Random test info" })
    })
  })

  describe("Can verify tokens signed with eddsa key", () => {
    let user = null
    let info = null

    before(() => {
      const strategy = new JwtStrategy(
        eddsaNoPassVerify,
        { tokenExtractor: fromAuthHeaderAsBearerToken() },
        (sections, done) => {
          const user = sections.payload.sub
          return done(null, user, { message: "Random test info" })
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["authorization"] =
            `Bearer ${testTokens.eddsaUnprotectedToken}`
        })
        .success((u, i) => {
          user = u
          info = i
        })
        .authenticate()
    })

    it("User and info should be set after succesful verification", () => {
      chai.expect(user).to.be.not.equal(null)
      chai.expect(info).to.be.not.equal(null)
      chai.expect(user).to.be.equal(testTokenPayload.sub)
      chai.assert.deepEqual(info, { message: "Random test info" })
    })
  })

  describe("Errors in authentication are passed to error object and bubbled up when using callback with error delegation", () => {
    /**
     * Token signed with EdDSA is verified with RSA key
     */
    let user = null
    let info = null
    let error: any = null

    before(() => {
      const strategy = new JwtStrategy<CBWithError>(
        rsaNoPassVerify,
        { tokenExtractor: fromAuthHeaderAsBearerToken() },
        (err, sections, done) => {
          if (!err) {
            return done(null, sections.payload.sub)
          }
          error = err
          return
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["authorization"] =
            `Bearer ${testTokens.eddsaUnprotectedToken}`
        })
        .success((u, i) => {
          user = u
          info = i
        })
        .error(() => {
          error = "This should never be assigned"
        })
        .authenticate()
    })

    it("Should err when verifying token with wrong key", () => {
      chai.expect(user).to.be.equal(null)
      chai.expect(info).to.be.equal(null)
      chai.expect(error).to.be.not.equal(null)
      chai.expect(error).to.be.instanceOf(TokenError)
      chai.expect(error).to.be.instanceOf(Error)
    })
  })

  describe("Errors in authentication are failed silently when using callback without error delegation", () => {
    /**
     * Token signed with EdDSA is verified with RSA key
     */
    let user = null
    let info = null
    let error: any = null
    let challenge = null
    let status: number | null = null

    before(() => {
      const strategy = new JwtStrategy<AfterVerifyCallback>(
        rsaNoPassVerify,
        { tokenExtractor: fromAuthHeaderAsBearerToken() },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (sections, done) => {
          // Does not matter what's here, because the jwt verification
          // in JwtStrategy itself is going to fail and this is not called
          // when error is not delegated from strategy to this callback
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["authorization"] =
            `Bearer ${testTokens.eddsaUnprotectedToken}`
        })
        .success((u, i) => {
          user = u
          info = i
        })
        .fail((c: any, s: number) => {
          challenge = c
          status = s
        })
        .error((e) => {
          console.log(JSON.stringify({ e }, null, 2))
          error = "This should never be assigned"
        })
        .authenticate()
    })

    it("Passport calls fail method correctly", () => {
      chai.expect(user).to.be.equal(null)
      chai.expect(info).to.be.equal(null)
      chai.expect(error).to.be.equal(null)
      chai.expect(challenge).to.be.not.equal(null)
      chai.expect(status).to.be.not.equal(null)
      chai.assert.deepEqual(challenge, {
        message: "The token algorithm is invalid.",
        type: "FAST_JWT_INVALID_ALGORITHM",
      })
    })
  })

  describe("Failed authentications are handled correctly", () => {
    let error = null
    let user = null
    let info = null
    let status = null

    before(() => {
      const strategy = new JwtStrategy(
        eddsaNoPassVerify,
        { tokenExtractor: fromAuthHeaderAsBearerToken() },
        (sections, done) => {
          try {
            const user = undefined // Mocking that can not find user from the db

            if (!user) {
              return done(null, false, "User not found", 404)
            }

            return done(null, user)
          } catch (error) {
            done(error)
          }
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["authorization"] =
            `Bearer ${testTokens.eddsaUnprotectedToken}`
        })
        .success((u, i) => {
          user = u
          info = i
        })
        .fail((i, s) => {
          info = i
          status = s
        })
        .error((e) => {
          error = e
        })
        .authenticate()
    })

    it("Should err when verifying token with wrong key", () => {
      chai.expect(error).to.be.equal(null)
      chai.expect(user).to.be.equal(null)
      chai.expect(info).to.be.not.equal(null)
      chai.expect(status).to.be.not.equal(null)

      chai.expect(info).to.be.equal("User not found")
      chai.expect(status).to.be.equal(404)
    })
  })

  describe("Verifier with complete set to true correctly returns all sections", () => {
    let sections: JwtSections | null = null

    before(() => {
      const strategy = new JwtStrategy(
        eddsaComplete,
        { tokenExtractor: fromAuthHeaderAsBearerToken() },
        (jwtSections, done) => {
          sections = jwtSections
          return done(null, "Test user")
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["authorization"] =
            `Bearer ${testTokens.eddsaUnprotectedToken}`
        })
        .authenticate()
    })

    it("Section should contain headers, payload and signature properties when complete is true", () => {
      chai.expect(sections).to.be.not.equal(null)
      chai.expect(Object.keys(sections!)).to.include("header")
      chai.expect(Object.keys(sections!)).to.include("payload")
      chai.expect(Object.keys(sections!)).to.include("signature")
      chai.expect(Object.keys(sections!)).to.include("input")

      chai.assert.deepEqual(sections!.header, { alg: "EdDSA", typ: "JWT" })
      chai.expect(sections!.payload.sub).to.be.equal(testTokenPayload.sub)
      chai.expect(sections!.input).to.be.equal(testTokens.eddsaUnprotectedToken)
    })
  })

  describe("Verifier with complete set to false returns only the payload and others are empty", () => {
    let sections: JwtSections | null = null

    before(() => {
      const strategy = new JwtStrategy(
        eddsaNoPassVerify,
        { tokenExtractor: fromAuthHeaderAsBearerToken() },
        (jwtSections, done) => {
          sections = jwtSections
          return done(null, "Test user")
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["authorization"] =
            `Bearer ${testTokens.eddsaUnprotectedToken}`
        })
        .authenticate()
    })

    it("Only section payload should have content when complete is set to false", () => {
      chai.expect(sections).to.be.not.equal(null)
      chai.expect(Object.keys(sections!)).to.include("header")
      chai.expect(Object.keys(sections!)).to.include("payload")
      chai.expect(Object.keys(sections!)).to.include("signature")
      chai.expect(Object.keys(sections!)).to.include("input")

      chai.assert.deepEqual(sections!.header, {})
      chai.expect(sections!.signature).to.be.equal("")
      chai.expect(sections!.payload.sub).to.be.equal(testTokenPayload.sub)
      chai.expect(sections!.input).to.be.equal("")
    })
  })

  describe.only("Custom callback", () => {
    let sections: JwtSections | null = null

    before(() => {
      const strategy = new JwtStrategy(
        eddsaNoPassVerify,
        { tokenExtractor: fromAuthHeaderAsBearerToken() },
        (jwtSections, done) => {
          sections = jwtSections
          return done(null, "Test user")
        },
      )

      // @ts-expect-error no types exist for chai-passport-strategy
      chai.passport
        .use(strategy)
        .request((req) => {
          req.headers["authorization"] =
            `Bearer ${testTokens.eddsaUnprotectedToken}`
        })
        .authenticate("jwt", (error, user, info) => {
          console.log(JSON.stringify({ error, user, info }, null, 2))
        })
    })

    it("Only section payload should have content when complete is set to false", () => {
      chai.expect(sections).to.be.not.equal(null)
      chai.expect(Object.keys(sections!)).to.include("header")
      chai.expect(Object.keys(sections!)).to.include("payload")
      chai.expect(Object.keys(sections!)).to.include("signature")
      chai.expect(Object.keys(sections!)).to.include("input")

      chai.assert.deepEqual(sections!.header, {})
      chai.expect(sections!.signature).to.be.equal("")
      chai.expect(sections!.payload.sub).to.be.equal(testTokenPayload.sub)
      chai.expect(sections!.input).to.be.equal("")
    })
  })
})
