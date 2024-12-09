// import { createSigner, createVerifier } from "fast-jwt"
// import fs from "fs"

// import {
//   EDDSA_NO_PASS,
//   filePath,
//   keyFetcher,
//   RSA_NO_PASS,
//   RSA_PASS,
//   RSA_PROTECTED,
// } from "./keyFileUtils"

// const testTokenPayload = {
//   sub: "Test User",
// }

// const protectedKey = fs.readFileSync(filePath(RSA_PROTECTED))

// /**
//  * Signers created with protected keys
//  * must have the algorithm provided. Also the key
//  * must be the key itself and can not be a fetcher
//  */
// export const rsaSign = createSigner({
//   algorithm: "RS256",
//   key: { key: protectedKey, passphrase: RSA_PASS },
// })

// export const rsaProtectedToken = rsaSign(testTokenPayload)

// /**
//  * Signers created with unprotected keys
//  * does not need to have the algorithm set.
//  * Algorithm will be derived from the key itself
//  */
// export const rsaNoPassSign = createSigner({
//   key: keyFetcher(RSA_NO_PASS),
// })

// export const rsaUnprotectedToken = rsaNoPassSign(testTokenPayload)

// export const eddsaNoPassSign = createSigner({
//   key: keyFetcher(EDDSA_NO_PASS),
// })

// export const eddsaUnprotectedToken = eddsaNoPassSign(testTokenPayload)

// /**
//  * Public keys does not need password even though their
//  * private counterpart did
//  */
// export const rsaVerify = createVerifier({ key: keyFetcher(RSA_PROTECTED) })

// export const rsaNoPassVerify = createVerifier({ key: keyFetcher(RSA_NO_PASS) })
// export const eddsaNoPassVerify = createVerifier({
//   key: keyFetcher(EDDSA_NO_PASS),
// })
