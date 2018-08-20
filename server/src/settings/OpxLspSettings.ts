/**
 * Settings for the language server
 */
export interface IOpxLspSettings {
    interfaceUrl: string;
    interfaceUser: string;
    interfacePass: string;
}

export class OpxSettingsManager {
    private configuration: IOpxLspSettings = {
        interfaceUrl: null,
        interfaceUser: "",
        interfacePass: ""
    };

    /**
     * getConfiguration
     */
    public getConfiguration() {
        return this.configuration;
    }

    /**
     * setConfiguration
     */
    public setConfiguration(configuration: IOpxLspSettings) {
        this.configuration = configuration;
    }
}

export default new OpxSettingsManager();