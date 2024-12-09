import { use } from "chai"
import chaiPassportStrategy from "chai-passport-strategy"

import { fromAuthHeaderAsBearerToken, fromHeader } from "../src/extractors"
import { JwtStrategy } from "../src/strategy"
import {
  createTestKeys,
  createTestTokens,
  deleteTestKeys,
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
      const strategy = new JwtStrategy(
        rsaVerify,
        fromHeader("token"),
        (sections, done) => {
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
      const strategy = new JwtStrategy(
        rsaNoPassVerify,
        fromAuthHeaderAsBearerToken(),
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
        fromAuthHeaderAsBearerToken(),
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

  describe("Erring authentications are handled correctly", () => {
    /**
     * Token signed with EdDSA is verified with RSA key
     */
    let user = null
    let info = null
    let error = null

    before(() => {
      const strategy = new JwtStrategy(
        rsaNoPassVerify,
        fromAuthHeaderAsBearerToken(),
        (sections, done) => {
          // Does not matter what's here when the verification itself errs
          return done(null, sections.payload.sub)
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
        .error((e) => {
          error = e
        })
        .authenticate()
    })

    it("Should err when verifying token with wrong key", () => {
      chai.expect(user).to.be.equal(null)
      chai.expect(info).to.be.equal(null)
      chai.expect(error).to.be.not.equal(null)
      chai.expect(error).to.be.instanceOf(Error)
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
        fromAuthHeaderAsBearerToken(),
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
})
