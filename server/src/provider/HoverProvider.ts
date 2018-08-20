import * as request from "request";
import { sprintf } from "sprintf";
import { TextDocumentPositionParams, Hover } from "vscode-languageserver";
import { TextDocument } from "../TextDocument";
import LspSettings from "../settings/OpxLspSettings";

export default class HoverProvider {
    public constructor() {}

    public async hover(params: TextDocumentPositionParams, openedDocumentUris: Map<string, TextDocument>): Promise<Hover | null> {
        const path = params.textDocument.uri;
        if(openedDocumentUris.has(path)) {
            const document = openedDocumentUris.get(path);
            const wordRange = document.getWordAtPosition(params.position);
            const word = document.getText(wordRange);

            // Hover support for Environment object style accessors (e.g. FOO_AA_B_SCHWAG)
            if (/_*([A-Z])+(_+[A-Z]+)+_*/.test(word)) {
                const url: string = LspSettings.getConfiguration().interfaceUrl + word;
                const auth: request.AuthOptions = {
                    user: LspSettings.getConfiguration().interfaceUser,
                    password: LspSettings.getConfiguration().interfacePass,
                    sendImmediately: false
                };
                return new Promise<Hover | null>(resolve => {
                    // @ts-ignore response is declared but never read error
                    request(url, { auth }, (error: any, response: request.Response, body: any) => {
                        if (error || !/[\[\{]/.test(body.substr(0, 1))) {
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
}