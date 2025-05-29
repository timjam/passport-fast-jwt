# Simple instructions to publish the package

## Local publish from command line

- Have access to npmjs set up
- Commit changes
- Run `npm version <patch|minor|major>`
- Run `npm publish`

You an also check what would happen by running:

`npm run pack --dry-run`: Packs the package without publishing. --dry-run modifier is not necessary, but it runs the command as dry run and only shows what would have happend so in this case what the package would contain, if run without the modifier

Similarily you can add the --dry-run into publish command to see what would be published
`npm publish --dry-run`

## Publish through Github Actions

There's a Github Action `autoPublish.yml` that tries to publish the package when a new release is made within the repository.

There's also a manual publish action `manualPublish.yml` that needs to be manually triggered. This can be use, if the automatic publish fails.
