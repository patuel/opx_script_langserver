import { Tokenizer } from "../../src/ojs/Tokenizer";
import { expect } from "chai";
import "mocha";
import { Token } from "../../src/ojs/Token";

describe("OJS Core", () => {
    describe("Tokenizer", () => {
        describe("General", () => {
            describe("Init", () => {
                it("should initialize the tokenizer", () => {
                    const tokenizer = new Tokenizer();
                    tokenizer.init("foo");
                    expect(tokenizer).to.not.be.null;
                });
            });
            describe("Foo", () => {
                it("should tokenize", () => {
                    const tokenizer = new Tokenizer();
                    tokenizer.init("var foo = false;");
                    let t = Token.ILLEGAL;
                    while (t != Token.EOF) {
                        const {token, lit} = tokenizer.scan();
                        console.log(token, lit);

                        t = token;
                    }
                });
            });
        });
    });
});