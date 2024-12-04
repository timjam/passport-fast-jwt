import Crypto from "node:crypto"

import { expect } from "chai"
import { createSigner } from "fast-jwt"

import { jwtVerifier } from "../src/verifier"
import {
  checkOpenSSLExists,
  generatePemFiles,
  keyFetcher,
  removePemFiles,
} from "./testUtils/keyFileUtils"

// create eddsa private and private key
// for some other algos as well
// create signers for these algos
// generate some jwts with these signers
// generate verifiers for these with this modules verifier factory

/**
 * NOTE: Your system needs to have openssl installed in order
 * to run tests
 */

const testToken = {
  sub: "Tester",
}

const rsaKey = "rsaKey"
const eddsaKey = "eddsaKey"

describe("Verifier tests", () => {
  let secretString: string

  before(async () => {
    checkOpenSSLExists()
    secretString = Crypto.createHash("sha256").digest("hex")
    await generatePemFiles(rsaKey, "rsa")
    await generatePemFiles(eddsaKey, "ed25519")
  })

  after(async () => {
    await removePemFiles(rsaKey)
    await removePemFiles(eddsaKey)
  })

  it("Secret as a string works", async () => {
    const signToken = createSigner({ key: secretString })
    const verifyToken = jwtVerifier({}, secretString)
    const signedToken = signToken(testToken)

    const sections = await verifyToken(signedToken)

    expect(sections.header.alg).to.be.equal("HS256")
    expect(sections.header.typ).to.be.equal("JWT")
    expect(sections.payload.sub).to.be.equal("Tester")
    expect(sections.payload.iat).to.not.be.equal(null)
  })

  it("Secret as a keyfetcher works", async () => {
    const privateKeyFetcher = keyFetcher(`${rsaKey}.pem`)
    const publicKeyFetcher = keyFetcher(`${rsaKey}_pub.pem`)

    const signToken = createSigner({ key: privateKeyFetcher })
    const signedToken = await signToken(testToken)

    const verifyToken = jwtVerifier({}, undefined, publicKeyFetcher)

    const sections = await verifyToken(signedToken)

    expect(sections.header.alg).to.be.oneOf(["RS256", "RS384", "RS512"])
    expect(sections.header.typ).to.be.equal("JWT")
    expect(sections.payload.sub).to.be.equal("Tester")
    expect(sections.payload.iat).to.not.be.equal(null)
  })

  it("Can verify with password protected keys", () => {})

  it("Async/Await keyfetcher works", () => {})

  it("Callback style keyfetcher or secret works", () => {})

  it("EdDSA algorithm is supported", async () => {
    const privateKeyFetcher = keyFetcher(`${eddsaKey}.pem`)
    const publicKeyFetcher = keyFetcher(`${eddsaKey}_pub.pem`)

    const signToken = createSigner({ key: privateKeyFetcher })
    const signedToken = await signToken(testToken)

    const verifyToken = jwtVerifier({}, undefined, publicKeyFetcher)

    const sections = await verifyToken(signedToken)

    expect(sections.header.alg).to.be.equal("EdDSA")
    expect(sections.header.typ).to.be.equal("JWT")
    expect(sections.payload.sub).to.be.equal("Tester")
    expect(sections.payload.iat).to.not.be.equal(null)
  })
})
