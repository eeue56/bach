import * as assert from "@eeue56/ts-assert";
import { centerAndPadding } from "./bach";

export function testShort() {
    assert.strictEqual(2, 1 + 1);
}

export function testBasicAddition() {
    assert.strictEqual(2, 1 + 1);
}

export function testEvenCenterAndPadding() {
    assert.deepStrictEqual(centerAndPadding(8, "true"), "  true  ");
}

export function testOddCenterAndPadding() {
    assert.deepStrictEqual(centerAndPadding(8, "false"), "  false ");
}

export function testObjectEquality() {
    const user = {
        name: "noah",
        age: 28,
        pets: [
            {
                name: "burt",
            },
        ],
    };

    const otherInstanceOfUser = {
        name: "noah",
        age: 28,
        pets: [
            {
                name: "burt",
            },
        ],
    };

    assert.deepStrictEqual(user, otherInstanceOfUser);
}

export async function testAsyncFunctions() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                assert.strictEqual("hello", "hello");
            } catch (e) {
                return reject(e);
            }
            resolve(null);
        }, 300);
    });
}

export async function snapshotString() {
    return "Hello world!";
}

export async function snapshotNumber() {
    return 9001;
}

export async function snapshotObject() {
    return {
        name: "Noah",
        age: 30,
        pets: [
            {
                name: "Frodo",
            },
        ],
    };
}
