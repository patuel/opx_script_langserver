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
    SymbolKind,
    Hover,
    TextDocumentPositionParams,
    DidChangeConfigurationParams,
    RemoteClient,
    DidChangeConfigurationNotification
} from "vscode-languageserver";

import { TextDocument } from "./TextDocument";
import { ILogger } from "./Logger";

import Tokenizer from "./ojs/Tokenizer";
import { Token } from "./ojs/Token";
import * as request from "request";
import { OpxLspSettings } from "./settings/OpxLspSettings";
import { sprintf } from "sprintf";

export default class LspServer {
    //private initializeParams: InitializeParams;
    private initializeResult: InitializeResult;

    private openedDocumentUris = new Map<string, TextDocument>();
    private hasConfigurationCapability = false;
    private defaultConfiguration: OpxLspSettings = {
        interfaceUrl: null,
        interfaceUser: "",
        interfacePass: ""
    };
    // @ts-ignore
    private configuration: OpxLspSettings = this.defaultConfiguration;

    private activated: () => void;
    private activation = new Promise<void>((resolve) => {
        this.activated = resolve;
    })

    constructor(private client: RemoteClient, private logger: ILogger) {

    }

    public async initialize(params: InitializeParams): Promise<InitializeResult> {
        this.logger.log("Initialize", params);

        const capabilities = params.capabilities;

        this.hasConfigurationCapability = capabilities.workspace && capabilities.workspace.configuration;

        // this.initializeParams = params;
        this.initializeResult = {
            capabilities: {
                textDocumentSync: TextDocumentSyncKind.Incremental,
                // workspaceSymbolProvider: true,
                documentSymbolProvider: true,
                hoverProvider: true
            }
        };

        this.logger.log("Initialization result", this.initializeResult);

        return this.initializeResult;
    }

    public async onGetConfiguration(configuration: OpxLspSettings) {
        this.configuration = configuration;
    }

    public async initialized(): Promise<void> {
        if (this.hasConfigurationCapability) {
            this.client.register(DidChangeConfigurationNotification.type, undefined);
        }

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

    public async hover(params: TextDocumentPositionParams): Promise<Hover | null> {
        const path = params.textDocument.uri;
        if (this.openedDocumentUris.has(path)) {
            const document = this.openedDocumentUris.get(path);
            const wordRange = document.getWordRangeAtPosition(params.position);
            const word = document.getText(wordRange);

            // Hover support for Environment object style accessors (e.g. FOO_AA_B_SCHWAG)
            if (/_*([A-Z])+(_+[A-Z]+)+_*/.test(word)) {
                const url: string = this.configuration.interfaceUrl + word;
                const auth: request.AuthOptions = {
                    user: this.configuration.interfaceUser,
                    password: this.configuration.interfacePass,
                    sendImmediately: false
                };
                return new Promise<Hover | null>(resolve => {
                    // @ts-ignore response is declared but never read error
                    request(url, { auth }, (error: any, response: request.Response, body: any) => {
                        if (error || !/[\[\{]/.test(body.substr(0,1))) {
                            resolve(null);
                        } else {
                            const result = JSON.parse(body);
                            let code = "";
                            let language = "opxscript";

                            switch (result.CLASS) {
                                case "ADDED_ATTRIBUTE":
                                    code = sprintf("(%s): %s", result.CLASS, result.TYPE)
                                    break;
                                case "BREAKDOWN_STRUCTURE":
                                    break;
                                case "NAT": // Attribute Type

                                    var content = "";
                                    for (var key in result.POSSIBLE_VALUES) {
                                        if (content.length > 0) {
                                            content += ",\r\n";
                                        }
                                        var value = result.POSSIBLE_VALUES[key];
                                        content += sprintf("  \"%s\": \"%s\"", key, value);
                                    }

                                    language = "json";
                                    code = sprintf("Possible values:\r\n{\r\n%s\r\n}", content);
                                    break;
                                case "DATA_CONSISTENCY_RULE":
                                    break;
                                case "FORMULA":
                                    code = result.VALUE;
                                    break;
                                case "PERMANENT_TABLE":
                                    break;
                                case "ATTRIBUTE_RELATION":
                                    break;
                                case "SYMBOLIC_FIELD":
                                    break;
                                case "TEMP_TABLE":
                                    break;
                            }
                            
                            resolve({
                                range: wordRange,
                                contents: sprintf(
                                    "```%s\r\n%s\r\n```\r\n\r\n%s",
                                    language,
                                    code,
                                    result.LABEL)
                            });
                        }
                    });
                });
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public async didChangeConfiguration(params: DidChangeConfigurationParams) {
        if (this.hasConfigurationCapability && params.settings) {
            this.configuration = <OpxLspSettings>(params.settings.ojs || this.defaultConfiguration);

            if (this.configuration.interfaceUrl !== null && !this.configuration.interfaceUrl.endsWith("?")) {
                this.configuration.interfaceUrl = this.configuration.interfaceUrl + "?";
            }
        }
    }
}