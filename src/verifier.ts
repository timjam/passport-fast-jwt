import { createVerifier, KeyFetcher, VerifierOptions } from "fast-jwt"

export const jwtVerifier = (
  options: VerifierOptions,
  secretOrKey?: string | Buffer,
  keyFetcher?: KeyFetcher,
) => {
  if (secretOrKey && !keyFetcher) {
    return createVerifier({
      ...options,
      key: async () => secretOrKey,
      complete: true,
    })
  }
  if (keyFetcher && !secretOrKey) {
    return createVerifier({ ...options, key: keyFetcher, complete: true })
  }
  throw new Error("JwtStrategy requires only either secretOrKey or keyFetcher")
}
