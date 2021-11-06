import * as assert from "@eeue56/ts-assert";

export function testBasicAddition() {
    assert.strictEqual(2, 1 + 1);
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
