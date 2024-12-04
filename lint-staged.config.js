/**
 * @see https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration
 */

const eslintFixAll = "eslint --fix"
const prettierFormatAll = "prettier --write"

// These are ignored during lint-staged
const ignorePatterns = [".husky/*", ".gitignore", "LICENSE"]

const ignore = `!(${ignorePatterns.join("|")})`

const config = {
  // Lint all except what's specifically ignored
  [ignore]: [eslintFixAll, prettierFormatAll],
  // Lint only these in addition to previous "lint all except ignored"
  "./husky/*.{js,ts}": [eslintFixAll, prettierFormatAll],
}

export default config
