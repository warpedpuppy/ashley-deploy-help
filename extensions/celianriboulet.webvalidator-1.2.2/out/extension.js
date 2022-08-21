"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
const vscode = require("vscode");
const validation = require("./validation");
const IssueDiagnostic_1 = require("./IssueDiagnostic");
const ValidationStatusBarItem_1 = require("./ValidationStatusBarItem");
/**
 * This method is called when the extension is activated
 * The extension is activated on launch or on the very
 * first time the command is executed
 * The main goal of this method is to register all available commands such
 * as "start validation" or "clear diagnostic"
 * @param context
 */
const activate = (context) => {
    //Creating the buttons in status bar on launch
    ValidationStatusBarItem_1.default.createValidationItems();
    // The commands are defined in the package.json file
    //Subscribe start validation command
    context.subscriptions.push(vscode.commands.registerCommand('webvalidator.startvalidation', () => {
        validation.startValidation();
    }));
    //Subscribe clear validation command
    context.subscriptions.push(vscode.commands.registerCommand('webvalidator.clearvalidation', () => {
        validation.clearDiagnosticsListAndUpdateWindow();
    }));
    //Subscribe onDidChangeTextDocument (Every time the active text document is modified)
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(() => {
        IssueDiagnostic_1.default.refreshWindowDiagnostics().then(allCleared => {
            ValidationStatusBarItem_1.default.clearValidationItem.updateVisibility(!allCleared);
        });
    }));
    //Subscribe onDidChangeActiveTextEditor (Everytime the active window if changed)
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(() => {
        ValidationStatusBarItem_1.default.updateValidationItemTextVisibility();
    }));
    // Subscribe onDidSaveTextDocument (Everytime the active document is saved)
    context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(() => {
        validation.startValidatationOnSaveHandler();
    }));
    console.log('W3C web validation extension activated !');
};
exports.activate = activate;
//# sourceMappingURL=extension.js.map