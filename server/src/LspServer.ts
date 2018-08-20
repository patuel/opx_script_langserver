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
    Hover,
    TextDocumentPositionParams,
    DidChangeConfigurationParams,
    RemoteClient,
    DidChangeConfigurationNotification
} from "vscode-languageserver";

import { TextDocument } from "./TextDocument";
import { ILogger } from "./Logger";

import LspSettings, { IOpxLspSettings } from "./settings/OpxLspSettings";
import HoverProvider from "./provider/HoverProvider";
import SymbolProvider from "./provider/SymbolProvider";

export default class LspServer {
    //private initializeParams: InitializeParams;
    private initializeResult: InitializeResult;

    private openedDocumentUris = new Map<string, TextDocument>();
    private hasConfigurationCapability = false;

    private activated: () => void;
    private activation = new Promise<void>((resolve) => {
        this.activated = resolve;
    });

    private hoverProvider: HoverProvider = null;
    private symbolProvider: SymbolProvider = null;

    // @ts-ignore
    constructor(private client: RemoteClient, private logger: ILogger) { }

    public async initialize(params: InitializeParams): Promise<InitializeResult> {
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

        return this.initializeResult;
    }

    public async onGetConfiguration(configuration: IOpxLspSettings) {
        LspSettings.setConfiguration(configuration);
    }

    public async initialized(): Promise<void> {
        if (this.hasConfigurationCapability) {
            this.client.register(DidChangeConfigurationNotification.type, undefined);
        }

        this.symbolProvider = new SymbolProvider();
        this.hoverProvider = new HoverProvider();

        this.activated();
    }

    public async didOpenTextDocument(params: DidOpenTextDocumentParams): Promise<void> {
        await this.activation;

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
        }
    }

    // @ts-ignore
    public async didSaveTextDocument(params: DidSaveTextDocumentParams): Promise<void> {
        await this.activation;
    }

    public async didCloseTextDocument(params: DidCloseTextDocumentParams): Promise<void> {
        await this.activation;

        const path = params.textDocument.uri;
        if (this.openedDocumentUris.has(path)) {
            this.openedDocumentUris.delete(path);
        }
    }

    public async documentSymbol(params: DocumentSymbolParams): Promise<SymbolInformation[]> {
        await this.activation;

        return this.symbolProvider.getDocumentSymbols(params, this.openedDocumentUris);
    }

    public async hover(params: TextDocumentPositionParams): Promise<Hover | null> {
        await this.activation;

        return this.hoverProvider.hover(params, this.openedDocumentUris);
    }

    public async didChangeConfiguration(params: DidChangeConfigurationParams) {
        if (this.hasConfigurationCapability && params.settings) {
            const configuration = <IOpxLspSettings>(params.settings.ojs);

            if (configuration.interfaceUrl !== null && !configuration.interfaceUrl.endsWith("?")) {
                configuration.interfaceUrl = configuration.interfaceUrl + "?";
            }

            LspSettings.setConfiguration(configuration);
        }
    }
}