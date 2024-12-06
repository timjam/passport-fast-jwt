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

/**
 * NOTE: Your system needs to have openssl installed in order
 * to run tests
 */

const testToken = {
  sub: "Tester",
}

const rsaKey = "rsaKey"
const eddsaKey = "eddsaKey"
const protKey = "protected"
const passwd = "password"

describe("Verifier tests", () => {
  let secretString: string

  before(async () => {
    checkOpenSSLExists()
    secretString = Crypto.createHash("sha256").digest("hex")
    await generatePemFiles(rsaKey, "rsa")
    await generatePemFiles(protKey, "rsa", passwd)
    await generatePemFiles(eddsaKey, "ed25519")
  })

  after(async () => {
    await removePemFiles(rsaKey)
    await removePemFiles(protKey)
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

  it("Can verify with password protected keys", async () => {
    const privateKeyFetcher = keyFetcher(`${protKey}.pem`)
    const publicKeyFetcher = keyFetcher(`${protKey}_pub.pem`)

    const signTokenSync = createSigner({
      algorithm: "RS256",
      key: {
        key: await privateKeyFetcher(),
        passphrase: passwd,
      },
    })
    const signedToken = signTokenSync(testToken)

    const verifyToken = jwtVerifier({}, undefined, publicKeyFetcher)
    const sections = await verifyToken(signedToken)
    expect(sections.header.alg).to.be.oneOf(["RS256", "RS384", "RS512"])
    expect(sections.header.typ).to.be.equal("JWT")
    expect(sections.payload.sub).to.be.equal("Tester")
    expect(sections.payload.iat).to.not.be.equal(null)
  })

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
