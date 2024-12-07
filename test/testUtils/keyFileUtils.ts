import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import which from "which"

type Algorithm = "rsa" | "ed25519"

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

const convertKeysToPem = async (fileName: string) => {
  execSync(
    `openssl pkey -in ${filePath(fileName)}.pem -pubout -out ${filePath(fileName)}_pub.pem 2>/dev/null`,
  )
}

const generateKeys = async (
  fileName: string,
  algorithm: Algorithm,
  passwd?: string,
) => {
  if (passwd) {
    execSync(
      `openssl genpkey -pass pass:${passwd} -algorithm ${algorithm} -out ${filePath(fileName)}.pem 2>/dev/null `,
    )
  } else {
    execSync(
      `openssl genpkey -algorithm ${algorithm} -out ${filePath(fileName)}.pem 2>/dev/null `,
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

export const keyFetcher = (fileName: string) => async () =>
  fs.readFileSync(filePath(fileName))

export const removePemFiles = async (fileName: string) => {
  fs.rmSync(filePath(`${fileName}.pem`))
  fs.rmSync(filePath(`${fileName}_pub.pem`))
}
