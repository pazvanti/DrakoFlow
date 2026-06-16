"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const previewPanel_1 = require("./previewPanel");
function activate(context) {
    console.log('DrakoFlow Preview Extension is now active!');
    const showPreviewCommand = vscode.commands.registerCommand('drakoflow.showPreview', () => {
        previewPanel_1.DrakoFlowPreviewPanel.createOrShow(context.extensionUri, vscode.ViewColumn.One);
    });
    const showPreviewToSideCommand = vscode.commands.registerCommand('drakoflow.showPreviewToSide', () => {
        previewPanel_1.DrakoFlowPreviewPanel.createOrShow(context.extensionUri, vscode.ViewColumn.Beside);
    });
    // Keep track of which documents we've automatically opened previews for in this session
    const autoOpenedUris = new Set();
    function maybeAutoOpen(editor) {
        if (!editor) {
            return;
        }
        const doc = editor.document;
        if (doc.fileName.endsWith('.drako') || doc.languageId === 'drakoflow') {
            const uriString = doc.uri.toString();
            const autoOpenEnabled = vscode.workspace.getConfiguration('drakoflow').get('preview.autoOpen', true);
            if (autoOpenEnabled && !autoOpenedUris.has(uriString) && !previewPanel_1.DrakoFlowPreviewPanel.currentPanels.has(uriString)) {
                autoOpenedUris.add(uriString);
                previewPanel_1.DrakoFlowPreviewPanel.createOrShow(context.extensionUri, vscode.ViewColumn.Beside, true);
            }
        }
    }
    // Check the active editor upon activation
    maybeAutoOpen(vscode.window.activeTextEditor);
    // Listen for active editor changes
    const activeEditorListener = vscode.window.onDidChangeActiveTextEditor(editor => {
        maybeAutoOpen(editor);
    });
    // Clean up tracking when a document is closed
    const closeDocListener = vscode.workspace.onDidCloseTextDocument(doc => {
        autoOpenedUris.delete(doc.uri.toString());
    });
    context.subscriptions.push(showPreviewCommand, showPreviewToSideCommand, activeEditorListener, closeDocListener);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map