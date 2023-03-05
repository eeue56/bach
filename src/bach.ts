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
        filesToProcess.map(async (fileName) => {
            return new Promise(async (resolve, reject) => {
                fileName =
                    program.flags.file.arguments.kind === "ok"
                        ? path.join(process.cwd(), fileName)
                        : fileName;
                const splitName = fileName.split(".");
                const extension = splitName[splitName.length - 1];
                const isValidExtension =
                    extension === "js" || extension === "ts";

                if (!splitName[0].endsWith("test") || !isValidExtension) {
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
                        console.error(`${fileName} ${functionName} failed.`);
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
        const formattedResults: {
            functionName: string;
            passed: boolean;
        }[] = [ ];

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
            console.table(
                formattedResults.filter((result) => result.passed === false)
            );
        } else {
            console.table(formattedResults);
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
            console.table(
                formattedResults.filter((result) => result.failed > 0)
            );
        } else {
            console.table(formattedResults);
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
