import { SymbolKind, Range, SymbolInformation, DocumentSymbolParams } from "vscode-languageserver";
import { Token } from "../ojs/Token";
import Tokenizer from "../ojs/Tokenizer";
import { TextDocument } from "../TextDocument";

export default class SymbolProvider {
    /**
     * getDocumentSymbols
     */
    public getDocumentSymbols(params: DocumentSymbolParams, openedDocumentUris: Map<string, TextDocument>) {
        const symbols: SymbolInformation[] = [];

        const path = params.textDocument.uri;

        const tokenKindMap: { [index: number]: SymbolKind } = {
            [Token.FUNCTION]: SymbolKind.Function,
            [Token.METHOD]: SymbolKind.Method
        };

        if (openedDocumentUris.has(path)) {
            const document = openedDocumentUris.get(path);
            try {
                var tokenizer = new Tokenizer();
                tokenizer.init(document.text);
                let t = Token.ILLEGAL;
                do {
                    const symbol = tokenizer.scan();

                    if (symbol.type === Token.IDENT) {
                        const start = {
                            line: symbol.startLine,
                            character: symbol.start
                        };
                        const end = {
                            line: symbol.endLine,
                            character: symbol.end
                        };
                        const range: Range = {
                            start: start,
                            end: end
                        };

                        if (t.valueOf() in tokenKindMap) {
                            let kind: SymbolKind = tokenKindMap[t.valueOf()];
                            symbols.push({
                                name: symbol.content,
                                kind,
                                location: {
                                    range: range,
                                    uri: params.textDocument.uri
                                }
                            });
                        }
                    }

                    t = symbol.type;
                } while (t != Token.EOF);
            } catch (e) {
                console.error(e);
            }
        }

        return symbols;
    }
}