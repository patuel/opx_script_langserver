import * as program from "commander";
import { readFileSync } from "fs";
import Tokenizer from "./Tokenizer";
import { Token, getTokenName } from "./Token";

program
    .version("0.1.0")
    .option("-f, --file <file>", "File to tokenize")
    .parse(process.argv);

var content = readFileSync(program.file, "utf8");

var tokenizer = new Tokenizer();
tokenizer.init(content);

while (true) {
    var symbol = tokenizer.scan();

    console.log(
        getTokenName(symbol.type),
        symbol.type.valueOf(),
        symbol.startLine,
        symbol.endLine,
        symbol.content);

    if (symbol.type === Token.EOF) {
        break;
    }
}