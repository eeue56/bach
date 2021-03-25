# bach

A very simple TypeScript test runner inspired by Pytest.

Looks in tsconfig.include for files ending with `test`. Look in those files for functions starting with `test`, and run them. Async functions are run with `await`. Use the [assert](https://nodejs.org/api/assert.html) module for writing assertions. The return result is ignored.

## Installation

Requires ts-node to be installed.

```
npm install --save-dev @eeue56/bach
```

## Usage

Make sure your tsconfig has `include` set up correctly. Then you can run bach via `npx @eeue56/bach` from the project root.

See [bach_test.ts](src/bach_test.ts) for example usage.

## Name

Bach means "small" or "little" in Welsh. It is also used as an affectionate term, much like "love" or "dear" in English. I named it bach, because I wanted the smallest possible test runner that still gave useful output.