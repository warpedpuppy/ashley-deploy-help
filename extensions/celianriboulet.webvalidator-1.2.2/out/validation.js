"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startValidatationOnSaveHandler = exports.clearDiagnosticsListAndUpdateWindow = exports.startValidation = void 0;
const https = require("https");
const vscode = require("vscode");
const axios_1 = require("axios");
const utils_1 = require("./utils");
const IssueDiagnostic_1 = require("./IssueDiagnostic");
const ValidationStatusBarItem_1 = require("./ValidationStatusBarItem");
const W3C_API_URL = 'https://validator.w3.org/nu/?out=json';
/**
 * This is the main method of the extension, it make a request to the W3C API and
 * analyse the response.
 */
const startValidation = (activeFileNotValidWarning = true) => {
    var _a;
    const document = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document;
    //Check if file is valid
    //Only suport HTML and CSS files for the moment
    if (!utils_1.activeFileIsValid(document, activeFileNotValidWarning))
        return;
    if (!document)
        return;
    ValidationStatusBarItem_1.default.validationItem.updateContent('Loading', '$(sync~spin)');
    //Current diagnostics are cleared, everything is reseted.
    exports.clearDiagnosticsListAndUpdateWindow(false);
    const fileLanguageID = document.languageId;
    //All the file content as raw text, this will be send as the request body
    const filecontent = document.getText();
    const showPopup = vscode.workspace.getConfiguration('webvalidator').showPopup;
    if (!showPopup) { // Validate silently
        postToW3C(filecontent, fileLanguageID)
            .then(response => handleW3CResponse(response, document, fileLanguageID, showPopup));
        return;
    }
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'W3C validation ...',
        cancellable: false,
    }, (progress, token) => {
        token.onCancellationRequested(() => {
            console.log('User canceled the validation');
        });
        return postToW3C(filecontent, fileLanguageID);
    }).then(response => {
        handleW3CResponse(response, document, fileLanguageID, showPopup);
    });
};
exports.startValidation = startValidation;
const postToW3C = (filecontent, fileLanguageID) => {
    return axios_1.default.post(W3C_API_URL, filecontent, {
        headers: { 'Content-type': `text/${fileLanguageID.toUpperCase()}; charset=utf-8` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }).then(response => {
        return response;
    }).catch((error) => {
        var _a;
        console.error(error);
        if (error.code == 'ENOTFOUND') {
            vscode.window.showErrorMessage('W3C service not reachable, please check your internet connection.');
            return null;
        }
        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 503) { // W3C down
            vscode.window.showErrorMessage('W3C service currently unavailable. Please retry later...');
            return null;
        }
        vscode.window.showErrorMessage('An error occured.');
        return null;
    });
};
const handleW3CResponse = (response, document, fileLanguageID, showPopup) => {
    if (response == null) {
        ValidationStatusBarItem_1.default.validationItem.updateContent();
        return;
    }
    if (response.data == null) {
        vscode.window.showErrorMessage('Error : incorrect response from W3C...');
        return;
    }
    const validationHasIssues = response.data.messages.length > 0;
    if (validationHasIssues) {
        createIssueDiagnosticsList(response.data.messages, document, showPopup);
        ValidationStatusBarItem_1.default.clearValidationItem.updateVisibility(true);
    }
    else {
        showPopup && vscode.window.showInformationMessage(`This ${fileLanguageID.toUpperCase()} file is valid !`);
    }
    if (showPopup || validationHasIssues) {
        ValidationStatusBarItem_1.default.validationItem.updateContent();
    }
    else {
        ValidationStatusBarItem_1.default.validationItem.updateContent('File is valid');
        setTimeout(() => ValidationStatusBarItem_1.default.validationItem.updateContent(), 2000);
    }
};
/**
 * This method create a new list referenced with the global array issueDiagnosticList from
 * the response of the post request to the W3C API
 * @param requestMessages the response from the W3C API
 * @param document the actual document
 * @param showPopup show the popup in lower right corner
 */
const createIssueDiagnosticsList = (requestMessages, document, showPopup = true) => {
    //The list (global variable issueDiagnosticList) is cleared before all.
    //The goal here is to create or recreate the content of the list.
    exports.clearDiagnosticsListAndUpdateWindow(false);
    let errorCount = 0;
    let warningCount = 0;
    //For each request response, we create a new instance of the IssueDiagnostic class
    //We also count the warning and error count, ot will then be displayed.
    requestMessages.forEach(element => {
        if (element.type === 'error')
            errorCount++;
        else
            warningCount++;
        new IssueDiagnostic_1.default(element, document);
    });
    //We now refresh the diagnostics on the current text editor with
    //the list that is now refilled correctly with the informations of the request
    IssueDiagnostic_1.default.refreshWindowDiagnostics().then(allCleared => {
        ValidationStatusBarItem_1.default.clearValidationItem.updateVisibility(!allCleared);
    });
    if (showPopup) {
        vscode.window.showErrorMessage(`This ${document.languageId.toUpperCase()} document is not valid. (${errorCount} errors , ${warningCount} warnings)`, ...(warningCount > 0 ? ['Clear all', 'Clear warnings'] : ['Clear all'])).then(selection => {
            if (selection === 'Clear all') {
                exports.clearDiagnosticsListAndUpdateWindow();
            }
            else if (selection === 'Clear warnings') {
                exports.clearDiagnosticsListAndUpdateWindow(true);
            }
        });
    }
};
/**
 * This method clear all diagnostic on window and in the issueDiagnosticList array
 * @param onlyWarning set to true if only warnings should be cleared
 * @param editorMessages set to false if no message should be displayed in the editor
 */
const clearDiagnosticsListAndUpdateWindow = (onlyWarning = false) => {
    if (onlyWarning) {
        IssueDiagnostic_1.default.clearVSCodeErrorsDiagnostics();
        IssueDiagnostic_1.default.refreshWindowDiagnostics().then(allCleared => {
            ValidationStatusBarItem_1.default.clearValidationItem.updateVisibility(!allCleared);
        });
    }
    else {
        IssueDiagnostic_1.default.clearAllVSCodeDiagnostics();
        ValidationStatusBarItem_1.default.clearValidationItem.updateVisibility(false);
    }
};
exports.clearDiagnosticsListAndUpdateWindow = clearDiagnosticsListAndUpdateWindow;
/**
 * Called everytime a file is saved in vscode
 * @param context extension context
 */
const startValidatationOnSaveHandler = () => {
    var _a;
    if (!utils_1.activeFileIsValid((_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document, false))
        return;
    if (vscode.workspace.getConfiguration('webvalidator').validateOnSave == false)
        return;
    exports.startValidation(false);
};
exports.startValidatationOnSaveHandler = startValidatationOnSaveHandler;
//# sourceMappingURL=validation.js.map