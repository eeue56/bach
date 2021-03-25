#!/usr/bin/env ts-node
import * as path from "path";

import * as fs from "fs";
import { promises as fsPromises } from "fs";

import glob from "fast-glob";
import JSON5 from "json5";

async function getFiles(dir: string): Promise<string[]> {
    const dirents: fs.Dirent[] = await fsPromises.readdir(dir, {
        withFileTypes: true,
    });
    const files = await Promise.all(
        dirents.map(async (dirent: fs.Dirent) => {
            const res: string = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                return await getFiles(res);
            } else {
                return res;
            }
        })
    );
    return Array.prototype.concat(...files);
}

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

function isAsyncFunction(func: any): boolean {
    return Object.getPrototypeOf(func).constructor === AsyncFunction;
}

export async function runner(): Promise<any> {
    console.log("Looking for tsconfig...");
    const strConfig = (await fsPromises.readFile("./tsconfig.json")).toString();
    const config = JSON5.parse(strConfig);
    console.log(`Looking for tests in ${config.include}...`);

    const files = await glob(config.include, { absolute: true });

    let passedTests = 0;
    let totalTests = 0;

    await Promise.all(
        files.map(async (fileName) => {
            return new Promise(async (resolve, reject) => {
                const splitName = fileName.split(".");

                if (!splitName[0].endsWith("test")) {
                    return resolve(null);
                }

                console.log(`Found ${fileName}`);
                const imported = await import(fileName);
                for (const functionName of Object.keys(imported)) {
                    const func = imported[functionName];
                    const isAsync = isAsyncFunction(func);

                    if (!functionName.startsWith("test")) return;

                    totalTests += 1;
                    console.log(`Running ${functionName}`);
                    try {
                        if (isAsync) {
                            await func();
                        } else {
                            func();
                        }
                        passedTests += 1;
                    } catch (e) {
                        console.error(
                            `${fileName} ${functionName} failed.`
                        );
                        console.error(e);
                    }
                };

                resolve(null);
            });
        })
    );

    console.log(
        `Ran ${totalTests} tests. ${passedTests} tests passed, ${
            totalTests - passedTests
        } failed`
    );
}

if (require.main === module) {
    runner();
}
