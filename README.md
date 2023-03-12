# bach

A very simple TypeScript test runner inspired by Pytest.

Looks in tsconfig.include for files ending with `test`. Look in those files for functions starting with `test`, and run them. Async functions are run with `await`. Use the [assert](https://nodejs.org/api/assert.html) module for writing assertions. The return result is ignored.

Part of the [Hiraeth](https://github.com/eeue56/hiraeth) collection.

## Installation

Requires ts-node to be installed.

```
npm install --save-dev @eeue56/bach
```

## Usage

Make sure your tsconfig has `include` set up correctly. Then you can run bach via `npx @eeue56/bach` from the project root.

See [bach_test.ts](src/bach_test.ts) for example usage.

You can also specify specific files or functions to run via flags:

```
  --function [string...]:		Run a specific function
  --file [string...]:		    Run a specific file
  --clean-exit:             Don't use process.exit even if tests fail
  --only-fails :		        Only show the tests that fail
  --in-chunks number:       Run tests in chunks of N files (suitable for lower memory impact)
  --chunk-start number:     Start running chunk at N
  -u, --update-snapshots :  Update the snapshots and exit
  -h, --help :		          Displays help message

```

## Snapshot tests

Snapshots can be created by having a function called `snapshot{x}` exported inside the test files. On first run, it will create the snapshot files in `__snapshots__`. On subsequent runs, the contents within the snapshot files will be compared with the output from the function. For example:

```typescript
export async function snapshotNumber() {
    return 9001;
}
```

## Name

Bach means "small" or "little" in Welsh. It is also used as an affectionate term, much like "love" or "dear" in English. I named it bach, because I wanted the smallest possible test runner that still gave useful output.
