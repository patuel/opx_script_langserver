# OJS Language Server

## Functionality

This Language Server works for `opxscript` files. It has the following language features:
- Document Symbols
- Hover functionality for accessors in Planisware Customizing notation (e.g. _CONF_AA_B_MY_ATTRIBUTE)

## Settings

The plugin provides the following settings:



## Structure

```
.
├── client // Language Client
│   ├── src
│   │   └── extension.ts // Language Client entry point
├── opx_interface // Planisware Rest Interface
├── opx_lang // Syntax highlighting & Information about Planisware Script V1
├── package.json // The extension manifest.
└── server // Language Server
    └── src
        └── main.ts // Language Server entry point
```

## Planisware REST Interface Installation

The REST interface is a source of information for the language server.
It provides additional data on environment-customizing like attributes, formulas, etc.

### Temporary:

- Open Planisware Intranet
- Evaluate the script `opx_interface/JS_LSP_ENV_INTERFACE.ojs` in Intranet using the Script Evaluator (remember the port of the slave you're on)

### Persistent:

- Open Planisware Intranet
- Open Pro Mode
- Create a new Script containing the code from `opx_interface/JS_LSP_ENV_INTERFACE.ojs`
- Restart the server to enable the script

### Finding the Interface URL

When calling the `rest.defineapi` function in Planisware, the first argument is the "module" name, after logging in to Planisware Intranet, replace the current module (e.g. /home) with the name given.

Example:
http://localhost/opx/OPX2/127.0.0.1:11100/home => http://localhost/opx/OPX2/127.0.0.1:11100/opx_lsp

## Compile and Run

- Run `npm install` in the root folder. This installs all required modules in the client and server folder
- Open VS Code on this folder
- Compile the source by either:
  - running `npm compile`
  - pressing Ctrl+Shift+B to run the vscode build task(s)
- Switch to the Debug viewlet
- From the drop down, select `Launch Client` for the client only or `Client + Server` to debug the server
- Run the selected config
- In the [Extension Development Host] instance of VSCode
  - Open a .ojs document or
  - Create a new document and set the language to `opxscript`