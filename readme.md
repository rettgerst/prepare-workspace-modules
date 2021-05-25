# prepare-workspace-modules

## situation:

you have a monorepo using npm v7+ workspaces, and some of your modules are written in typescript or otherwise require a compilation or bundling step before being consumed by other modules.

## problem:

npm v7 [currently has a bug](https://github.com/npm/cli/issues/1965) which results in lifecycle scripts not executing in packages.

this means that if one of your packages' exports does not exist until after the prepare script is run, other packages will not be able to consume that package until you manually cd into the package directory and run it yourself. very annoying!

you also can't just run `npm run --workspaces prepare` because the command has no knowledge of the dependency graph. you must manually take into account the heirarchy of your modules.

## solution:

run this package in the root directory.

## how it works;

this package will first inspect your root module's package.json to discover all workspaces in the project. it actually uses the same [@npmcli/map-workspaces](https://www.npmjs.com/package/@npmcli/map-workspaces) module that npm uses internally.

also, instead of including that package as a dependency, this tool will discover the installed map-workspaces implementation from your global npm installation, so hopefully it should Just Work™ with newer versions of npm.

the tool then inspects your project's dependencies and does a post-order depth-first search on the dependency tree, executing the prepare script in each package, leaves first.
