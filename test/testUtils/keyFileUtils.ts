import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import which from "which"

type Algorithm = "rsa" | "ed25519"

// export async function sleep(ms: number) {
//   return new Promise((resolve) => setTimeout(resolve, ms))
// }

export const checkOpenSSLExists = async () => {
  const resolvedOrNull = which.sync("openssl", { nothrow: true })

  if (!resolvedOrNull) {
    console.error(
      "command openssl not found. Please install it before running tests",
    )
    process.exit(1)
  }
}

const filePath = (fileName: string) => path.join(import.meta.dirname, fileName)

export const generatePemFiles = async (
  fileName: string,
  algorithm: Algorithm,
) => {
  execSync(
    `openssl genpkey -algorithm ${algorithm} -out ${filePath(fileName)}.pem 2>/dev/null && openssl pkey -in ${filePath(fileName)}.pem -pubout -out ${filePath(fileName)}_pub.pem 2>/dev/null`,
  )
}

export const keyFetcher = (fileName: string) => async () =>
  fs.readFileSync(filePath(fileName))

export const removePemFiles = async (fileName: string) => {
  fs.rmSync(filePath(`${fileName}.pem`))
  fs.rmSync(filePath(`${fileName}_pub.pem`))
}
