#!/usr/bin/env ts-node
import {
    bothFlag,
    empty,
    help,
    longFlag,
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
        bothFlag("h", "help", "Displays help message", empty()),
    ]);

    const program = parse(cliParser, process.argv);

    if (program.flags["h/help"].isPresent) {
        console.log(help(cliParser));
        return;
    }

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
    console.log(`Looking for tests in ${config.include}...`);

    const files = fileNamesToRun
        ? fileNamesToRun
        : await glob(config.include, { absolute: true });

    const results: { [filename: string]: { [functionName: string]: boolean } } =
        {};

    let passedTests = 0;
    let totalTests = 0;
    const startTime = performance.now();

    await Promise.all(
        files.map(async (fileName) => {
            return new Promise(async (resolve, reject) => {
                fileName =
                    program.flags.file.arguments.kind === "ok"
                        ? path.join(process.cwd(), fileName)
                        : fileName;
                const splitName = fileName.split(".");

                if (!splitName[0].endsWith("test")) {
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
                    console.log(`Running ${functionName}`);
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

    const endTime = performance.now();

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

    console.table(formattedResults);

    console.log(
        `Ran ${totalTests} tests in ${Math.floor(
            endTime - startTime
        )}ms. ${passedTests} tests passed, ${totalTests - passedTests} failed`
    );

    if (totalTests - passedTests > 0) {
        process.exit(1);
    }
}

if (require.main === module) {
    runner();
}
