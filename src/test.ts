import { createVerifier } from "fast-jwt"

import { fromBodyField } from "./extractors"
import { JwtStrategy } from "./strategy"

const tokenExtractor = fromBodyField("token")

const verifier = createVerifier({ key: async () => "secret" })

const Users = [{ id: "123", name: "Teuvo" }]

export const strategy = new JwtStrategy(
  verifier,
  { tokenExtractor, secretOrKey: "secret" },
  (sections, done) => {
    try {
      const user = Users.filter((u) => u.id === sections.payload.sub)

      if (!user) {
        done(null, false)
      }

      done(null, user)
    } catch (error) {
      done(error)
    }
  },
)
