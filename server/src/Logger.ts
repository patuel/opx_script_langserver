import {
    Connection,
    MessageType,
    ShowMessageNotification
} from "vscode-languageserver/lib/main";

export interface ILogger {
    log(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

export default class Logger implements ILogger {
    constructor(protected connection: Connection, protected level: MessageType) {    }

    protected sendNotification(severity: MessageType, ...args: any[]) {
        if (severity <= this.level) {
            const message = args.map(e => {
                if (typeof e === 'object') {
                    return JSON.stringify(e);
                } else {
                    return e;
                }
            }).join(" ");

            this.connection.sendNotification(ShowMessageNotification.type, {
                type: severity,
                message
            });
        }
    }

    public log(...args: any[]): void {
        this.sendNotification(MessageType.Log, ...args);
    }

    public info(...args: any[]): void {
        this.sendNotification(MessageType.Info, ...args);
    }

    public warn(...args: any[]): void {
        this.sendNotification(MessageType.Warning, ...args);
    }

    public error(...args: any[]): void {
        this.sendNotification(MessageType.Error, ...args);
    }
}

export class ConsoleLogger extends Logger {
    constructor(protected connection: Connection, protected level: MessageType) {
        super(connection, level);
    }

    protected sendNotification(severity: MessageType, ...args: any[]) {
        if (severity <= this.level) {
           console.log(...args);
        }
    }
}