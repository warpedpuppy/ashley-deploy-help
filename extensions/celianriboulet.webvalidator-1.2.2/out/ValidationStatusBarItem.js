"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const utils_1 = require("./utils");
class ValidationStatusBarItem {
    /**
     * Create a new custom status bar item
     * @param command the command that this item execute when pressed
     * @param defaultText the default text value that this item display
     * @param tooltip The tootltip to show when this item is hovered
     */
    constructor(command, defaultText, defaultIconText, tooltip, show) {
        this.defaultText = defaultText;
        this.defaultIconText = defaultIconText;
        this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
        this.item.command = command;
        this.item.tooltip = tooltip;
        this.updateContent();
        this.updateVisibility(show);
    }
    /**
     * Initialize all the necessary status bar items for this extension
     */
    static createValidationItems() {
        //Init start validation item
        ValidationStatusBarItem.validationItem = new ValidationStatusBarItem('webvalidator.startvalidation', 'W3C validation', '$(pass)', 'Start the W3C validation of this file', true);
        //Init clear validation item
        ValidationStatusBarItem.clearValidationItem = new ValidationStatusBarItem('webvalidator.clearvalidation', 'Clear W3C validation', '$(notifications-clear)', 'This will clear all issues made by the W3C Web Validator extension', false);
        ValidationStatusBarItem.updateValidationItemTextVisibility();
    }
    /**
     * Update the content of this status bar item
     * @param customText the new text for this item
     * @param customIcon the new icon fr this item
     */
    updateContent(customText = this.defaultText, customIcon = this.defaultIconText) {
        this.item.text = `${customIcon} ${customText}`.trim();
    }
    /**
     * Set the visibility of this staus bar item
     * @param show true to show this item in the status bar
     */
    updateVisibility(show) {
        show ? this.item.show() : this.item.hide();
    }
    /**
     * Set the startValidation item text visibility depending on the current active editor window
     */
    static updateValidationItemTextVisibility() {
        var _a;
        utils_1.activeFileIsValid((_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document, false)
            ?
                ValidationStatusBarItem.validationItem.updateContent()
            :
                ValidationStatusBarItem.validationItem.updateContent('');
    }
}
exports.default = ValidationStatusBarItem;
//# sourceMappingURL=ValidationStatusBarItem.js.map