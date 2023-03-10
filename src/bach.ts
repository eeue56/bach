#!/usr/bin/env ts-node
import {
    bothFlag,
    empty,
    help,
    longFlag,
    number,
    parse,
    parser,
    string,
    variableList,
} from "@eeue56/baner";
import glob from "fast-glob";
import { promises as fsPromises } from "fs";
import JSON5 from "json5";
import * as path from "path";
import { performance } from "perf_hooks";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

type SingleFileResult = {
    functionName: string;
    passed: boolean;
};

type SingleFileCellSizes = {
    functionName: number;
    passed: number;
};

type MultipleFileResult = {
    fileName: string;
    passed: number;
    failed: number;
};

type MultipleFileCellSizes = {
    fileName: number;
    passed: number;
    failed: number;
};

const chalk = {
    red: function (text: string): string {
        return `\x1b[31m${text}\x1b[0m`;
    },
    green: function (text: string): string {
        return `\x1b[32m\x1b[1m${text}\x1b[0m`;
    },
};

function widestSingleFileCellSizes(
    results: SingleFileResult[]
): SingleFileCellSizes {
    const cellSizes: SingleFileCellSizes = {
        functionName: " Function name ".length,
        passed: " Passed? ".length,
    };

    for (const result of results) {
        if (cellSizes.functionName < result.functionName.length + 2) {
            cellSizes.functionName = result.functionName.length + 2;
        }

        if (cellSizes.passed < `${result.passed}`.length + 2) {
            cellSizes.passed = `${result.passed}`.length + 2;
        }
    }
    return {
        functionName:
            cellSizes.functionName % 2 === 0
                ? cellSizes.functionName
                : cellSizes.functionName + 1,
        passed:
            cellSizes.passed % 2 === 0
                ? cellSizes.passed
                : cellSizes.passed + 1,
    };
}

function widestMultipleFileCellSizes(
    results: MultipleFileResult[]
): MultipleFileCellSizes {
    const cellSizes: MultipleFileCellSizes = {
        fileName: " Function name ".length,
        passed: " Passed ".length,
        failed: " Failed ".length,
    };

    for (const result of results) {
        if (cellSizes.fileName < result.fileName.length + 2) {
            cellSizes.fileName = result.fileName.length + 2;
        }

        if (cellSizes.passed < `${result.passed}`.length + 2) {
            cellSizes.passed = `${result.passed}`.length + 2;
        }

        if (cellSizes.failed < `${result.failed}`.length + 2) {
            cellSizes.failed = `${result.failed}`.length + 2;
        }
    }
    return {
        fileName:
            cellSizes.fileName % 2 === 0
                ? cellSizes.fileName
                : cellSizes.fileName + 1,
        passed:
            cellSizes.passed % 2 === 0
                ? cellSizes.passed
                : cellSizes.passed + 1,
        failed:
            cellSizes.failed % 2 === 0
                ? cellSizes.failed
                : cellSizes.failed + 1,
    };
}

const horizontal = "─";
const vertical = "│";
const leftJoin = "├";
const middleJoin = "┼";
const rightJoin = "┤";
const leftCorner = "┌";
const rightCorner = "┐";
const bottomLeftCorner = "└";
const bottomRightCorner = "┘";

export function centerAndPadding(cellSize: number, text: string): string {
    const length = text.length;
    const eitherSide = Math.floor((cellSize - length) / 2);

    let extraLeft = 0;
    if (text.length % 2 === 1) {
        extraLeft = 1;
    }
    return " ".repeat(eitherSide + extraLeft) + text + " ".repeat(eitherSide);
}

function viewSingleFileResult(
    result: SingleFileResult,
    tableWidth: SingleFileCellSizes
): void {
    console.log(
        leftJoin +
            horizontal.repeat(tableWidth.functionName) +
            middleJoin +
            horizontal.repeat(tableWidth.passed) +
            rightJoin
    );

    const colouredFunctionName = result.passed
        ? chalk.green(
              centerAndPadding(
                  tableWidth.functionName,
                  `${result.functionName}`
              )
          )
        : chalk.red(
              centerAndPadding(
                  tableWidth.functionName,
                  `${result.functionName}`
              )
          );

    const colouredPassed = result.passed
        ? chalk.green(centerAndPadding(tableWidth.passed, `${result.passed}`))
        : chalk.red(centerAndPadding(tableWidth.passed, `${result.passed}`));

    console.log(
        vertical + colouredFunctionName + vertical + colouredPassed + vertical
    );
}

function viewSingleFileResults(results: SingleFileResult[]): void {
    const cellSizes = widestSingleFileCellSizes(results);
    const headers =
        vertical +
        centerAndPadding(cellSizes.functionName, "Function name") +
        vertical +
        centerAndPadding(cellSizes.passed, "Passed?") +
        vertical;

    console.log(
        leftCorner +
            horizontal.repeat(cellSizes.functionName + cellSizes.passed + 1) +
            rightCorner
    );
    console.log(headers);

    for (const result of results) {
        viewSingleFileResult(result, cellSizes);
    }
    console.log(
        bottomLeftCorner +
            horizontal.repeat(cellSizes.functionName) +
            horizontal.repeat(cellSizes.passed + 1) +
            bottomRightCorner
    );
}

function viewMultipleFileResult(
    result: MultipleFileResult,
    tableWidth: MultipleFileCellSizes
): void {
    console.log(
        leftJoin +
            horizontal.repeat(tableWidth.fileName) +
            middleJoin +
            horizontal.repeat(tableWidth.passed) +
            middleJoin +
            horizontal.repeat(tableWidth.failed) +
            rightJoin
    );

    const colouredFileName =
        result.failed === 0
            ? chalk.green(
                  centerAndPadding(tableWidth.fileName, `${result.fileName}`)
              )
            : chalk.red(
                  centerAndPadding(tableWidth.fileName, `${result.fileName}`)
              );

    const colouredPassed =
        result.passed > 0
            ? chalk.green(
                  centerAndPadding(tableWidth.passed, `${result.passed}`)
              )
            : chalk.red(
                  centerAndPadding(tableWidth.passed, `${result.passed}`)
              );

    const colouredFailed =
        result.failed === 0
            ? chalk.green(
                  centerAndPadding(tableWidth.failed, `${result.failed}`)
              )
            : chalk.red(
                  centerAndPadding(tableWidth.failed, `${result.failed}`)
              );

    console.log(
        vertical +
            colouredFileName +
            vertical +
            colouredPassed +
            vertical +
            colouredFailed +
            vertical
    );
}

function viewMultipleFileResults(results: MultipleFileResult[]): void {
    const cellSizes = widestMultipleFileCellSizes(results);
    const headers =
        vertical +
        centerAndPadding(cellSizes.fileName, "File name") +
        vertical +
        centerAndPadding(cellSizes.passed, "Passed") +
        vertical +
        centerAndPadding(cellSizes.failed, "Failed") +
        vertical;

    console.log(
        leftCorner +
            horizontal.repeat(
                cellSizes.fileName + cellSizes.passed + cellSizes.failed + 2
            ) +
            rightCorner
    );
    console.log(headers);

    for (const result of results) {
        viewMultipleFileResult(result, cellSizes);
    }
    console.log(
        bottomLeftCorner +
            horizontal.repeat(
                cellSizes.fileName + cellSizes.passed + cellSizes.failed + 2
            ) +
            bottomRightCorner
    );
}

function isAsyncFunction(func: any): boolean {
    return Object.getPrototypeOf(func).constructor === AsyncFunction;
}

export async function runner(): Promise<any> {
    const cliParser = parser([
        longFlag("function", "Run a specific function", variableList(string())),
        longFlag("file", "Run a specific file", variableList(string())),
        longFlag(
            "clean-exit",
            "Don't use process.exit even if tests fail",
            empty()
        ),
        longFlag("only-fails", "Only show the tests that fail", empty()),
        longFlag(
            "in-chunks",
            "Run tests in chunks of N files (suitable for lower memory impact)",
            number()
        ),
        longFlag("chunk-start", "Start running chunk at N", number()),
        bothFlag("h", "help", "Displays help message", empty()),
    ]);

    const program = parse(cliParser, process.argv);

    if (program.flags["h/help"].isPresent) {
        console.log(help(cliParser));
        return;
    }

    const onlyFails = program.flags["only-fails"].isPresent;

    const functionNamesToRun: string[] | null =
        program.flags.function.arguments.kind === "ok"
            ? (program.flags.function.arguments.value as string[])
            : null;

    const fileNamesToRun: string[] | null =
        program.flags.file.arguments.kind === "ok"
            ? (program.flags.file.arguments.value as string[])
            : null;

    console.log("Looking for tsconfig...");
    const strConfig = (await fsPromises.readFile("./tsconfig.json")).toString();
    const config = JSON5.parse(strConfig);

    if (!fileNamesToRun) {
        console.log(`Looking for tests in ${config.include}...`);
        if (!config.include) {
            console.error(
                "include was not set in tsconfig, not sure where to look for tests"
            );
            console.error("Quitting...");
            return;
        }
    } else {
        console.log("Running provided filenames...");
    }

    const files = fileNamesToRun
        ? fileNamesToRun
        : await glob(config.include, { absolute: true });

    const results: { [filename: string]: { [functionName: string]: boolean } } =
        {};

    let passedTests = 0;
    let totalTests = 0;

    const chunks = program.flags["in-chunks"].isPresent
        ? (program.flags["in-chunks"].arguments as any).value
        : files.length;

    const chunkStart = program.flags["chunk-start"].isPresent
        ? (program.flags["chunk-start"].arguments as any).value
        : 0;

    const startTime = performance.now();

    const filesToProcess = files.slice(chunkStart, chunkStart + chunks);

    await Promise.all(
        filesToProcess.map(async (fileName: string): Promise<null> => {
            return new Promise(async (resolve, reject): Promise<void> => {
                fileName =
                    program.flags.file.arguments.kind === "ok"
                        ? path.join(process.cwd(), fileName)
                        : fileName;
                const baseFileName = path
                    .basename(fileName)
                    .split(".")
                    .slice(0, -1)
                    .join(".");

                const extension = path.extname(fileName);
                const isValidExtension =
                    extension === ".js" || extension === ".ts";

                if (!baseFileName.endsWith("test") || !isValidExtension) {
                    return resolve(null);
                }

                results[fileName] = {};
                console.log(`Found ${fileName}`);
                const imported = await import(fileName);
                for (const functionName of Object.keys(imported)) {
                    if (!functionName.startsWith("test")) continue;
                    if (
                        functionNamesToRun &&
                        functionNamesToRun.indexOf(functionName) === -1
                    )
                        continue;

                    const func = imported[functionName];
                    const isAsync = isAsyncFunction(func);

                    totalTests += 1;

                    if (!onlyFails) console.log(`Running ${functionName}`);

                    try {
                        if (isAsync) {
                            await func();
                        } else {
                            func();
                        }
                        results[fileName][functionName] = true;
                        passedTests += 1;
                    } catch (e) {
                        results[fileName][functionName] = false;
                        console.error(
                            chalk.red(`${fileName} ${functionName} failed.`)
                        );
                        console.error(e);
                    }
                }

                resolve(null);
            });
        })
    );
    if (filesToProcess.length < files.length) {
        console.log(
            `Ran ${chunks} files, starting at ${chunkStart}, out of ${
                files.length
            } total. New start should be ${chunkStart + chunks}`
        );
    }

    const endTime = performance.now();

    if (program.flags["file"].isPresent) {
        const formattedResults: SingleFileResult[] = [ ];

        for (const fileName of Object.keys(results)) {
            const functions = results[fileName];

            for (const functionName of Object.keys(functions)) {
                formattedResults.push({
                    functionName,
                    passed: functions[functionName],
                });
            }
        }
        if (onlyFails) {
            viewSingleFileResults(
                formattedResults.filter((result) => result.passed === false)
            );
        } else {
            viewSingleFileResults(formattedResults);
        }
    } else {
        const formattedResults: {
            fileName: string;
            passed: number;
            failed: number;
        }[] = Object.entries(results).map(([ fileName, functions ]) => {
            let passed = 0;
            Object.entries(functions).forEach(([ functionName, didPass ]) => {
                if (didPass) passed += 1;
            });
            const failed = Object.keys(functions).length - passed;

            return {
                fileName,
                passed,
                failed,
            };
        });

        if (onlyFails) {
            viewMultipleFileResults(
                formattedResults.filter((result) => result.failed > 0)
            );
        } else {
            viewMultipleFileResults(formattedResults);
        }
    }

    console.log(
        `Ran ${totalTests} tests in ${Math.floor(
            endTime - startTime
        )}ms. ${passedTests} tests passed, ${totalTests - passedTests} failed`
    );

    if (
        totalTests - passedTests > 0 &&
        !program.flags["clean-exit"].isPresent
    ) {
        process.exit(1);
    }
}

if (require.main === module) {
    runner();
}
