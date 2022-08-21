"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utils = require("./utils");
/**
 * Class that contain a vscode.diagnostic and its correponding line's range with the
 * original content of this same line
 * - The line content is used for the auto clear feature, as it is compared with the actual content of this same line
 * @constructor Create an instance with one issue that come from the request of the API
 */
class IssueDiagnostic {
    /**
     * Create a new issue diagnostic from a issue message
     * @param message the message containing all the related data of the issue
     * @param document the document on which the diagnostic is created
     */
    constructor(message, document) {
        const lineRange = utils.getLineRange(message.lastLine, document);
        this.diagnostic = IssueDiagnostic.getVSCodeDiagnosticFromMessage(message);
        this.lineRange = lineRange;
        this.lineIntialContent = document.getText(lineRange);
        IssueDiagnostic.issueDiagnostics.push(this);
    }
    /**
     * Clear all the diagnostics on the workspace that are related to the validation
     */
    static clearAllVSCodeDiagnostics() {
        IssueDiagnostic.issueDiagnostics = [];
        IssueDiagnostic.vscodeDiagnostics.clear();
    }
    /**
     * Clear all the error diagnostics on the worspace that are related to the validation
     */
    static clearVSCodeErrorsDiagnostics() {
        IssueDiagnostic.issueDiagnostics = IssueDiagnostic.issueDiagnostics
            .filter(d => d.diagnostic.severity === vscode.DiagnosticSeverity.Error);
    }
}
exports.default = IssueDiagnostic;
/**
 * All registed IssueDiagnostic (This class)
 */
IssueDiagnostic.issueDiagnostics = [];
/**
 * All registered vscode diagnostics
 */
IssueDiagnostic.vscodeDiagnostics = vscode.languages.createDiagnosticCollection('w3c_validation_collection');
/**
 * Create a vscode diagnostic from a message
 * @param  message the message from which the diagnostic will be created
 * @return diagnostic object
 */
IssueDiagnostic.getVSCodeDiagnosticFromMessage = (message) => {
    let severity = vscode.DiagnosticSeverity.Information;
    switch (message.type) {
        case 'error':
            severity = vscode.DiagnosticSeverity.Error;
            break;
        case 'info':
            severity = vscode.DiagnosticSeverity.Warning;
            break;
    }
    const diagnostic = new vscode.Diagnostic(utils.getMessageRange(message), message.message, severity);
    diagnostic.code = 'W3C_validation';
    diagnostic.source = message.type;
    return diagnostic;
};
/**
 * Refresh the diagnostics on the active text editor by reading the content of
 * the issueDiagnosticList array.
 * This is called on every changes in the active text editor.
 * @returns true if there si no diagnostics left on the document
 */
IssueDiagnostic.refreshWindowDiagnostics = () => {
    return new Promise((resolve, reject) => {
        if (!vscode.window.activeTextEditor) {
            reject();
            return; // return for ts type check
        }
        //Clearing window's diagnostic
        IssueDiagnostic.vscodeDiagnostics.clear();
        const diagnostics = [];
        //Auto clear diagnostic on page :
        //For each registered diagnostic in the issueDiagnostic list
        IssueDiagnostic.issueDiagnostics.forEach(element => {
            var _a;
            //We first check if the line of this diagnostic has changed
            //So we compare the initial content of the diagnostic's line with the actual content.
            const currentLineContent = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.getText(element.lineRange);
            if (element.lineIntialContent !== currentLineContent) {
                IssueDiagnostic.issueDiagnostics.splice(IssueDiagnostic.issueDiagnostics.indexOf(element), 1);
            }
            else {
                //In case the line has no changes, that means we should keep this diagnostic on page.
                diagnostics.push(element.diagnostic);
            }
        });
        //Adding all remaining diagnostics to page.
        IssueDiagnostic.vscodeDiagnostics.set(vscode.window.activeTextEditor.document.uri, diagnostics);
        resolve(diagnostics.length === 0);
    });
};
//# sourceMappingURL=IssueDiagnostic.js.map