export enum Token {
    ILLEGAL,
    IDENT,

    // Types
    NUMBER,
    STRING,

    // Special tokens
    EOF,
    COMMENT, // or /* */

    PERIOD,     // .
    COMMA,      // ,
    SEMICOLON,  // ;
    COLON,      // :
    QMARK,      // ?

    LPAREN, // (
    RPAREN, // )

    LBRACK, // [
    RBRACK, // ]

    LCURLY, // {
    RCURLY, // }

    // Operators
    ADD,    // +
    SUB,    // -
    MUL,    // *
    QUO,    // /
    REM,    // %

    ADD_ASSIGN, // +=
    SUB_ASSIGN, // -=
    MUL_ASSIGN, // *=
    QUO_ASSIGN, // /=

    LAND,   // &&
    LOR,    // ||
    INC,    // ++
    DEC,    // --

    EQL,    // ==
    NEQ,    // !=
    LEQ,    // <=
    GEQ,    // >=

    LSS,    // <
    GTR,    // >
    ASSIGN, // =
    NOT,    // !

    // Keywords (Syntax operators)
    DELETE,
    FOR,
    FROMOBJECT,
    FUNCTION,
    GLOBAL,
    IF,
    INSTANCEOF,
    METHOD,
    ON,
    SQLWDBTRANSACTION,
    SUPER,
    SWITCH,
    TRY,
    TYPEOF,
    CONST,
    VAR,
    WTHROW,
    WTIMEOUT,
    WHILE,
    WITH,
    WMONITORING,
    WNOAPPLETREFRESH,
    WOBJECTLOCK,
    WOALERTS,
    WODATABASERECORDING,
    WOINTERUPTS,
    WOLOCKING,
    WPROCESSLOCK,
}

const tokenMap: { [index: string]: Token } = {
    ILLEGAL: Token.ILLEGAL,
    IDENT: Token.IDENT,
    NUMBER: Token.NUMBER,
    STRING: Token.STRING,
    EOF: Token.EOF,
    COMMENT: Token.COMMENT,
    PERIOD: Token.PERIOD,
    COMMA: Token.COMMA,
    SEMICOLON: Token.SEMICOLON,
    LPAREN: Token.LPAREN,
    RPAREN: Token.RPAREN,
    LBRACK: Token.LBRACK,
    RBRACK: Token.RBRACK,
    LCURLY: Token.LCURLY,
    RCURLY: Token.RCURLY,
    ADD: Token.ADD,
    SUB: Token.SUB,
    MUL: Token.MUL,
    QUO: Token.QUO,
    REM: Token.REM,
    ADD_ASSIGN: Token.ADD_ASSIGN,
    SUB_ASSIGN: Token.SUB_ASSIGN,
    MUL_ASSIGN: Token.MUL_ASSIGN,
    QUO_ASSIGN: Token.QUO_ASSIGN,
    LAND: Token.LAND,
    LOR: Token.LOR,
    INC: Token.INC,
    DEC: Token.DEC,
    EQL: Token.EQL,
    NEQ: Token.NEQ,
    LEQ: Token.LEQ,
    GEQ: Token.GEQ,
    LSS: Token.LSS,
    GTR: Token.GTR,
    ASSIGN: Token.ASSIGN,
    NOT: Token.NOT,
    DELETE: Token.DELETE,
    FOR: Token.FOR,
    FROMOBJECT: Token.FROMOBJECT,
    FUNCTION: Token.FUNCTION,
    GLOBAL: Token.GLOBAL,
    IF: Token.IF,
    INSTANCEOF: Token.INSTANCEOF,
    METHOD: Token.METHOD,
    ON: Token.ON,
    SQLWDBTRANSACTION: Token.SQLWDBTRANSACTION,
    SUPER: Token.SUPER,
    SWITCH: Token.SWITCH,
    TRY: Token.TRY,
    TYPEOF: Token.TYPEOF,
    VAR: Token.VAR,
    WTHROW: Token.WTHROW,
    WTIMEOUT: Token.WTIMEOUT,
    WHILE: Token.WHILE,
    WITH: Token.WITH,
    WMONITORING: Token.WMONITORING,
    WNOAPPLETREFRESH: Token.WNOAPPLETREFRESH,
    WOBJECTLOCK: Token.WOBJECTLOCK,
    WOALERTS: Token.WOALERTS,
    WODATABASERECORDING: Token.WODATABASERECORDING,
    WOINTERUPTS: Token.WOINTERUPTS,
    WOLOCKING: Token.WOLOCKING,
    WPROCESSLOCK: Token.WPROCESSLOCK,
}

export function lookup(str: string): Token | null {
    const tokenString = str.toLocaleUpperCase();
    if (tokenString in tokenMap)
        return tokenMap[tokenString] as Token;
    return Token.IDENT;
}

export function getTokenName(t: Token) {
    for (const key in tokenMap) {
        const value = tokenMap[key];
        if (value.valueOf() === t.valueOf()) {
            return key;
        }
    }
    return null;
}

