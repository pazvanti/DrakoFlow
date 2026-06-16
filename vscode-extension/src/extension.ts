import * as vscode from 'vscode';
import { DrakoFlowPreviewPanel } from './previewPanel';

export function activate(context: vscode.ExtensionContext) {
  console.log('DrakoFlow Preview Extension is now active!');

  const showPreviewCommand = vscode.commands.registerCommand('drakoflow.showPreview', () => {
    DrakoFlowPreviewPanel.createOrShow(context.extensionUri, vscode.ViewColumn.One);
  });

  const showPreviewToSideCommand = vscode.commands.registerCommand('drakoflow.showPreviewToSide', () => {
    DrakoFlowPreviewPanel.createOrShow(context.extensionUri, vscode.ViewColumn.Beside);
  });

  // Keep track of which documents we've automatically opened previews for in this session
  const autoOpenedUris = new Set<string>();

  function maybeAutoOpen(editor: vscode.TextEditor | undefined) {
    if (!editor) {
      return;
    }
    const doc = editor.document;
    if (doc.fileName.endsWith('.drako') || doc.languageId === 'drakoflow') {
      const uriString = doc.uri.toString();
      const autoOpenEnabled = vscode.workspace.getConfiguration('drakoflow').get<boolean>('preview.autoOpen', true);
      
      if (autoOpenEnabled && !autoOpenedUris.has(uriString) && !DrakoFlowPreviewPanel.currentPanels.has(uriString)) {
        autoOpenedUris.add(uriString);
        DrakoFlowPreviewPanel.createOrShow(context.extensionUri, vscode.ViewColumn.Beside, true);
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

  context.subscriptions.push(
    showPreviewCommand,
    showPreviewToSideCommand,
    activeEditorListener,
    closeDocListener
  );
}

export function deactivate() {}
