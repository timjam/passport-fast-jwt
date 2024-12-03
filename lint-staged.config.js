/**
 * @see https://github.com/lint-staged/lint-staged?tab=readme-ov-file#configuration
 */

const eslintFixAll = "eslint --fix"
const prettierFormatAll = "prettier --write"

const config = {
  // Lints and formats files ignoring files in .husky folder
  "!(.husky/*|.gitignore)": [eslintFixAll, prettierFormatAll],
  // In case some husky git hooks are written in js or ts lint and format those
  "./husky/*.{js,ts}": [eslintFixAll, prettierFormatAll],
}

export default config
