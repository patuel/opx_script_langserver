import { createConnection, ProposedFeatures, MessageType } from "vscode-languageserver";
import LspServer from "./LspServer";
import Logger from "./Logger";

export function createLspConnection() {
    const connection = createConnection(ProposedFeatures.all);
    // const logger = new ConsoleLogger(connection, MessageType.Log);
    const logger = new Logger(connection, MessageType.Log);
    const server = new LspServer(connection.client, logger);

    connection.onInitialize(server.initialize.bind(server));
    connection.onInitialized(server.initialized.bind(server));

    connection.onDocumentSymbol(server.documentSymbol.bind(server));

    connection.onHover(server.hover.bind(server));
    
    connection.onDidChangeConfiguration(server.didChangeConfiguration.bind(server));

    connection.onDidOpenTextDocument(server.didOpenTextDocument.bind(server));
    connection.onDidChangeTextDocument(server.didChangeTextDocument.bind(server));
    connection.onDidSaveTextDocument(server.didSaveTextDocument.bind(server));
    connection.onDidCloseTextDocument(server.didCloseTextDocument.bind(server));

    return connection;
}
