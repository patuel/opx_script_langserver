import { Token, lookup } from "./Token";

// TODO: If the last line contains text directly before EOF, the 
// last character is not tokenized

export interface Symbol {
    start: number;
    end: number;
    startLine: number;
    endLine: number;
    content: string;
    type: Token;
}

export default class Tokenizer {
    private data: string;
    private offset: number;
    private length: number;
    // private lines: number[];
    private ch: string;
    private line: number;

    // private tokens: TokenMeta[];

    public constructor() {

    }

    public init(data: string) {
        this.data = data;
        this.offset = 0;
        this.length = this.data.length;
        this.line = 0;

        // this.lines = [0];
        // this.tokens = [];

        if (this.length > 0) {
            this.ch = this.data.charAt(0);
        }
    }

    private findLineEnd() {
        while (this.ch !== "\n" && this.ch !== null) {
            this.next();
        }
    }

    private scanComment() {
        // Initial / has already been consumed
        // The second comment char has been consumed, is the current ch
        // this.next();

        if (this.ch === "/") {
            // Single line comment
            this.findLineEnd();
        } else {
            // Multi line comment
            let foundCommentEnd = false;
            let ch = this.ch;
            while (this.next()) {
                if (this.ch === "\n") {
                    this.line++;
                }
                if (ch === "*" && this.ch === "/") {
                    this.next();
                    foundCommentEnd = true;
                    break;
                }
                ch = this.ch;
            }
            if (!foundCommentEnd) {
                throw new Error("Comment not terminated");
            }
        }
    }

    private isLetter(c: string) {
        return /\w/.test(c);
    }

    private isDigit(c: string) {
        // TODO: Change to faster number testing
        return /\d/.test(c);
    }

    private scanIdentifier() {
        const offset = this.offset - 1;
        while (this.isLetter(this.ch) || this.isDigit(this.ch))
            this.next();
        return this.data.substring(offset, this.offset - 1);
    }

    private scanNumber() {
        let seenDecimalPoint = false;

        while (this.isDigit(this.ch) || (!seenDecimalPoint && this.ch === ".")) {
            if (this.ch === ".") {
                seenDecimalPoint = true;
            }
            this.next();
        }
    }

    private scanString(initChar: string) {
        /** Multiline strings are allowed in Planisware! */

        let ch = this.ch;
        while (this.next()) {
            if (ch === "\\" && this.ch === initChar) {
                // Escaped quote, skip next character
                this.next();
            } else if (ch === initChar) {
                break;
            }
            ch = this.ch;
        }
    }

    private skipWhitespace() {
        while (
            this.ch === " " ||
            this.ch === "\t" ||
            this.ch === "\r" ||
            this.ch === "\n") {
                if (this.ch === "\n") {
                    this.line++;
                }
                this.next()
            }
    }

    private next() {
        let char;

        while (this.offset < this.length) {
            char = this.data.charAt(this.offset);
            this.offset++;

            this.ch = char;
            return true;
        }

        this.ch = null;
        return false;
    }

    private switch2(t1: Token, t2: Token) {
        if (this.ch === "=") {
            this.next();
            return t2;
        }
        return t1;
    }

    private switch3(t1: Token, t2: Token, ch: string, t3: Token) {
        if (this.ch === "=") {
            this.next();
            return t2;
        }
        if (this.ch === ch) {
            this.next();
            return t3;
        }
        return t1;
    }

    public scan(): Symbol {
        this.skipWhitespace();

        let token: Token;
        let lit: string;

        const start = this.offset - 1;
        const startLine = this.line;

        // TODO: I don't like checking for null here to see if it's EOF
        if (this.ch !== null) {
            switch (true) {
                case this.isLetter(this.ch):
                    lit = this.scanIdentifier();
                    token = lookup(lit);
                    break;
                case this.isDigit(this.ch):
                    token = Token.NUMBER;
                    this.scanNumber();
                    break;
            }

            const ch = this.ch;
            if (token === undefined) {
                if (this.next()) { // Always make progress
                    switch (ch) {
                        case "\"":
                            token = Token.STRING;
                            this.scanString("\"");
                            break;
                        case "'":
                            token = Token.STRING;
                            // TODO: Strings in single quotes ' are treated like identifiers
                            // e.g. variable names
                            this.scanString("'");
                            break;
                        case ".":
                            token = Token.PERIOD;
                            break;
                        case ",":
                            token = Token.COMMA;
                            break;
                        case ";":
                            token = Token.SEMICOLON;
                            break;
                        case ":":
                            token = Token.COLON;
                            break;
                        case "?":
                            token = Token.QMARK;
                            break;
                        case "(":
                            token = Token.LPAREN;
                            break;
                        case ")":
                            token = Token.RPAREN;
                            break;
                        case "[":
                            token = Token.LBRACK;
                            break;
                        case "]":
                            token = Token.RBRACK;
                            break;
                        case "{":
                            token = Token.LCURLY;
                            break;
                        case "}":
                            token = Token.RCURLY;
                            break;
                        case "+":
                            // + ++ +=
                            token = this.switch3(Token.ADD, Token.ADD_ASSIGN, "+", Token.INC);
                            break;
                        case "-":
                            token = this.switch3(Token.SUB, Token.SUB_ASSIGN, "-", Token.DEC);
                            break;
                        case "*":
                            token = this.switch2(Token.MUL, Token.MUL_ASSIGN);
                            break;
                        case "/":
                            if (this.ch === "*" || this.ch === "/") {
                                token = Token.COMMENT;
                                this.scanComment();
                            } else {
                                token = this.switch2(Token.QUO, Token.QUO_ASSIGN);
                            }
                            break;
                        case "%":
                            // TODO: Check if reminder is a valid operator in planisware
                            token = Token.REM;
                            break;
                        case "<":
                            token = this.switch2(Token.LSS, Token.LEQ);
                            break;
                        case ">":
                            token = this.switch2(Token.GTR, Token.GEQ);
                            break;
                        case "=":
                            token = this.switch2(Token.ASSIGN, Token.EQL);
                            break;
                        case "!":
                            token = this.switch2(Token.NOT, Token.NEQ);
                            break;
                        case "&":
                            if (this.ch === "&") {
                                token = Token.LAND;
                            } else {
                                throw new Error(`Unexpected Character '${ch}'`);
                            }
                            break;
                        case "|":
                            if (this.ch === "|") {
                                token = Token.LOR;
                            } else {
                                throw new Error(`Unexpected Character '${ch}'`);
                            }
                            break;
                        default:
                            throw new Error(`Unexpected Character '${ch}'`);
                    }
                } else {
                    // EOF
                    token = Token.EOF;
                }
            }
        } else {
            token = Token.EOF;
        }

        const end = this.offset - 1;
        const endLine = this.line;

        return {
            type: token,
            content: this.data.substring(start, end),
            start,
            end,
            startLine,
            endLine
        };
    }
}