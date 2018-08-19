import {
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    DidOpenTextDocumentParams,
    DidChangeTextDocumentParams,
    DidSaveTextDocumentParams,
    DidCloseTextDocumentParams,
    DocumentSymbolParams,
    SymbolInformation,
    Range,
    SymbolKind
} from "vscode-languageserver";

import { TextDocument } from "./TextDocument";
import { ILogger } from "./Logger";

import Tokenizer from "./ojs/Tokenizer";
import { Token } from "./ojs/Token";

export default class LspServer {
    //private initializeParams: InitializeParams;
    private initializeResult: InitializeResult;

    private openedDocumentUris = new Map<string, TextDocument>();

    private activated: () => void;
    private activation = new Promise<void>((resolve) => {
        this.activated = resolve;
    })

    constructor(private logger: ILogger) {

    }

    public async initialize(params: InitializeParams): Promise<InitializeResult> {
        this.logger.log("Initialize", params);
        
        // this.initializeParams = params;
        this.initializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                // workspaceSymbolProvider: true,
                documentSymbolProvider: true,

            }
        };

        this.logger.log("Initialization result", this.initializeResult);

        return this.initializeResult;
    }

    public async initialized(): Promise<void> {
        // TODO: Register providers here
        this.activated();
    }

    public async didOpenTextDocument(params: DidOpenTextDocumentParams): Promise<void> {
        await this.activation;

        this.logger.log("didOpenTextDocument", params);

        const path = params.textDocument.uri;
        if (!this.openedDocumentUris.has(path)) {
            const document = new TextDocument(params.textDocument);
            this.openedDocumentUris.set(path, document);
        }
    }

    public async didChangeTextDocument(params: DidChangeTextDocumentParams): Promise<void> {
        await this.activation;

        const path = params.textDocument.uri;
        if (this.openedDocumentUris.has(path)) {
            const document = this.openedDocumentUris.get(path);
            document.apply(params.contentChanges, params.textDocument.version);
            this.logger.log("Applied changed", document);
        }

        this.logger.log("didChangeTextDocument", params);
    }

    public async didSaveTextDocument(params: DidSaveTextDocumentParams): Promise<void> {
        await this.activation;

        this.logger.log("didSaveTextDocument", params);
    }

    public async didCloseTextDocument(params: DidCloseTextDocumentParams): Promise<void> {
        await this.activation;

        this.logger.log("didCloseTextDocument", params);

        const path = params.textDocument.uri;
        if (this.openedDocumentUris.has(path)) {
            this.openedDocumentUris.delete(path);
        }
    }

    public async documentSymbol(params: DocumentSymbolParams): Promise<SymbolInformation[]> {
        await this.activation;

        const symbols: SymbolInformation[] = [];

        const path = params.textDocument.uri;

        this.logger.log("Requesting symbols for", path);

        const tokenKindMap: { [index: number]: SymbolKind } = {
            [Token.FUNCTION]: SymbolKind.Function,
            [Token.METHOD]: SymbolKind.Method
        };
        
        if (this.openedDocumentUris.has(path)) {
            const document = this.openedDocumentUris.get(path);
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