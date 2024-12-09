import { execSync } from "child_process"
import { createSigner, createVerifier } from "fast-jwt"
import fs from "fs"
import which from "which"

type Algorithm = "rsa" | "ed25519"

export const RSA_PASS = "password"
export const RSA_PROTECTED = "rsa"
export const RSA_NO_PASS = "rsa_no_pass"
export const EDDSA_NO_PASS = "eddsa_no_pass"

export const testTokenPayload = {
  sub: "Test User",
}

export const checkOpenSSLExists = async () => {
  const resolvedOrNull = which.sync("openssl", { nothrow: true })

  if (!resolvedOrNull) {
    console.error(
      "command openssl not found. Please install it before running tests",
    )
    process.exit(1)
  }
}

const convertKeysToPem = async (fileName: string) => {
  execSync(
    `openssl pkey -in ${fileName}.pem -pubout -out ${fileName}_pub.pem 2>/dev/null`,
  )
}

const generateKeys = async (
  fileName: string,
  algorithm: Algorithm,
  passwd?: string,
) => {
  if (passwd) {
    execSync(
      `openssl genpkey -pass pass:${passwd} -algorithm ${algorithm} -out ${fileName}.pem 2>/dev/null `,
    )
  } else {
    execSync(
      `openssl genpkey -algorithm ${algorithm} -out ${fileName}.pem 2>/dev/null `,
    )
  }
}

export const generatePemFiles = async (
  fileName: string,
  algorithm: Algorithm,
  passwd?: string,
) => {
  await generateKeys(fileName, algorithm, passwd)
  await convertKeysToPem(fileName)
}

export const keyFetcher =
  (fileName: string, type: "private" | "public") => async () =>
    type === "private"
      ? fs.readFileSync(`${fileName}.pem`)
      : fs.readFileSync(`${fileName}_pub.pem`)

export const removePemFiles = async (fileName: string) => {
  fs.rmSync(`${fileName}.pem`)
  fs.rmSync(`${fileName}_pub.pem`)
}

export const createTestKeys = async () => {
  await generatePemFiles(RSA_PROTECTED, "rsa", RSA_PASS)
  await generatePemFiles(RSA_NO_PASS, "rsa")
  await generatePemFiles(EDDSA_NO_PASS, "ed25519")
  // await sleep(2)
}

export const deleteTestKeys = async () => {
  await removePemFiles(RSA_PROTECTED)
  await removePemFiles(RSA_NO_PASS)
  await removePemFiles(EDDSA_NO_PASS)
}

export const createTestTokens = async () => {
  /**
   * Signers created with protected keys
   * must have the algorithm provided. Also the key
   * must be the key itself and can not be a fetcher
   */

  const protectedKey = fs.readFileSync(`${RSA_PROTECTED}.pem`)

  const rsaSign = createSigner({
    algorithm: "RS256",
    key: { key: protectedKey, passphrase: RSA_PASS },
  })

  const rsaProtectedToken = rsaSign(testTokenPayload)

  /**
   * Signers created with unprotected keys
   * does not need to have the algorithm set.
   * Algorithm will be derived from the key itself
   */

  const rsaNoPassSign = createSigner({
    key: keyFetcher(RSA_NO_PASS, "private"),
  })

  const rsaUnprotectedToken = await rsaNoPassSign(testTokenPayload)

  const eddsaNoPassSign = createSigner({
    key: keyFetcher(EDDSA_NO_PASS, "private"),
  })

  const eddsaUnprotectedToken = await eddsaNoPassSign(testTokenPayload)

  return {
    rsaProtectedToken,
    rsaUnprotectedToken,
    eddsaUnprotectedToken,
  } as const
}

/**
 * Public keys does not need password even though their
 * private counterpart did
 */
export const rsaVerify = createVerifier({
  key: keyFetcher(RSA_PROTECTED, "public"),
})
export const rsaNoPassVerify = createVerifier({
  key: keyFetcher(RSA_NO_PASS, "public"),
})
export const eddsaNoPassVerify = createVerifier({
  key: keyFetcher(EDDSA_NO_PASS, "public"),
})
