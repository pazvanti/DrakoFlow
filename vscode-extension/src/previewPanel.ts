import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class DrakoFlowPreviewPanel {
  public static readonly viewType = 'drakoflowPreview';
  public static currentPanels = new Map<string, DrakoFlowPreviewPanel>();

  private readonly _panel: vscode.WebviewPanel;
  private readonly _documentUri: vscode.Uri;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _lastReceivedText: string = '';

  public static createOrShow(extensionUri: vscode.Uri, viewColumn: vscode.ViewColumn, preserveFocus: boolean = false) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active text editor to preview.');
      return;
    }

    const doc = editor.document;
    if (!doc.fileName.endsWith('.drako') && doc.languageId !== 'drakoflow') {
      vscode.window.showWarningMessage('Active file is not a DrakoFlow (.drako) document.');
      return;
    }

    const uriString = doc.uri.toString();
    const existingPanel = DrakoFlowPreviewPanel.currentPanels.get(uriString);

    if (existingPanel) {
      existingPanel._panel.reveal(viewColumn, preserveFocus);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      DrakoFlowPreviewPanel.viewType,
      `Preview: ${path.basename(doc.fileName)}`,
      { viewColumn, preserveFocus },
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(extensionUri.fsPath, 'dist'))
        ],
        retainContextWhenHidden: true
      }
    );

    const newPanel = new DrakoFlowPreviewPanel(panel, doc.uri, extensionUri);
    DrakoFlowPreviewPanel.currentPanels.set(uriString, newPanel);
  }

  private constructor(panel: vscode.WebviewPanel, documentUri: vscode.Uri, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._documentUri = documentUri;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._updateWebviewHtml();

    // Listen for when the panel is disposed
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.type) {
          case 'ready':
            this._postDocumentText();
            break;
          case 'change':
            await this._updateDocumentText(message.text);
            break;
        }
      },
      null,
      this._disposables
    );

    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument(
      e => {
        if (e.document.uri.toString() === this._documentUri.toString()) {
          this._postDocumentText();
        }
      },
      null,
      this._disposables
    );
  }

  private _updateWebviewHtml() {
    this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const htmlPath = path.join(this._extensionUri.fsPath, 'dist', 'index.html');
    if (!fs.existsSync(htmlPath)) {
      return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Error</title>
        </head>
        <body>
          <div style="padding: 20px; color: red;">
            <h3>DrakoFlow assets not found.</h3>
            <p>Please compile the main project and the extension first. See the README in the extension folder for details.</p>
          </div>
        </body>
        </html>
      `;
    }

    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Load webview URIs for assets
    const jsUri = webview.asWebviewUri(vscode.Uri.file(
      path.join(this._extensionUri.fsPath, 'dist', 'assets', 'index.js')
    ));
    const cssUri = webview.asWebviewUri(vscode.Uri.file(
      path.join(this._extensionUri.fsPath, 'dist', 'assets', 'index.css')
    ));

    // Replace relative assets with webview URIs
    htmlContent = htmlContent.replace('src="./assets/index.js"', `src="${jsUri}"`);
    htmlContent = htmlContent.replace('href="./assets/index.css"', `href="${cssUri}"`);

    // Inject our custom CSS style and script before </head>
    const injectedStyles = `
<style>
  #editor-panel {
    display: none !important;
  }
  .diagram-panel {
    width: 100% !important;
    flex: 1 !important;
  }
  li:has(#btn-load), li:has(#btn-save), li:has(#btn-load) + li + li {
    display: none !important;
  }
  #btn-toggle-editor {
    display: none !important;
  }
  #btn-toggle-lock {
    display: none !important;
  }
  .dropdown:has(#btn-file-menu),
  .dropdown:has(#btn-file-menu) + .vr {
    display: none !important;
  }
  .dropdown:has(#btn-toggle-snap),
  .canvas-controls > .vr {
    display: none !important;
  }
  .sidebar-dock, #library-panel {
    display: none !important;
  }
</style>
    `;

    const injectedScript = `
<script>
  (function() {
    const vscode = acquireVsCodeApi();
    
    // Wait until DOM and app script is ready
    window.addEventListener('DOMContentLoaded', () => {
      const editor = document.getElementById('editor');
      if (!editor) {
        console.error('DrakoFlow editor textarea not found');
        return;
      }

      // Move documentation button to the toolbar and restyle it
      const docsBtn = document.getElementById('btn-show-docs');
      const controlsContainer = document.querySelector('.diagram-panel .panel-header .gap-2');
      if (docsBtn && controlsContainer) {
        docsBtn.className = 'btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center';
        docsBtn.style.fontSize = '0.9rem';
        docsBtn.style.width = '32px';
        docsBtn.style.height = '28px';
        docsBtn.title = 'Open Component Documentation';
        controlsContainer.appendChild(docsBtn);
      }

      let lastKnownVsCodeText = '';

      // Monkeypatch the programmatic setter of the textarea value
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        Object.defineProperty(editor, 'value', {
          get() {
            return descriptor.get.call(this);
          },
          set(val) {
            const oldVal = this.value;
            descriptor.set.call(this, val);
            if (oldVal !== val) {
              this.dispatchEvent(new Event('programmatic-input'));
            }
          }
        });
      }

      function handleTextChange() {
        const currentText = editor.value;
        if (currentText !== lastKnownVsCodeText) {
          vscode.postMessage({
            type: 'change',
            text: currentText
          });
        }
      }

      editor.addEventListener('input', handleTextChange);
      editor.addEventListener('programmatic-input', handleTextChange);

      // Listen for text updates from the extension host
      window.addEventListener('message', event => {
        const message = event.data;
        if (message.type === 'update') {
          if (editor.value !== message.text) {
            lastKnownVsCodeText = message.text;
            editor.value = message.text;
            
            // Dispatch input event to let the web editor's existing listener update layout & render
            editor.dispatchEvent(new Event('input'));
          }
        }
      });

      // Notify the VS Code extension that the preview panel is ready to receive initial content
      vscode.postMessage({ type: 'ready' });
    });
  })();
</script>
    `;

    htmlContent = htmlContent.replace('</head>', `${injectedStyles}${injectedScript}</head>`);
    return htmlContent;
  }

  private async _postDocumentText() {
    try {
      const document = await vscode.workspace.openTextDocument(this._documentUri);
      const text = document.getText();
      if (text !== this._lastReceivedText) {
        this._lastReceivedText = text;
        this._panel.webview.postMessage({
          type: 'update',
          text: text
        });
      }
    } catch (err) {
      console.error('Failed to read document text for preview:', err);
    }
  }

  private async _updateDocumentText(newText: string) {
    if (newText === this._lastReceivedText) {
      return;
    }
    this._lastReceivedText = newText;

    try {
      const document = await vscode.workspace.openTextDocument(this._documentUri);

      const activeEditor = vscode.window.visibleTextEditors.find(
        e => e.document.uri.toString() === this._documentUri.toString()
      );

      if (activeEditor) {
        const wholeRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );
        await activeEditor.edit(editBuilder => {
          editBuilder.replace(wholeRange, newText);
        });
      } else {
        const edit = new vscode.WorkspaceEdit();
        const wholeRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(document.getText().length)
        );
        edit.replace(this._documentUri, wholeRange, newText);
        await vscode.workspace.applyEdit(edit);
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to sync coordinates to document: ${err}`);
    }
  }

  public dispose() {
    DrakoFlowPreviewPanel.currentPanels.delete(this._documentUri.toString());

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
