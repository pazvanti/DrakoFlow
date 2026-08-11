package com.drakoflow.intellij.editor

import com.google.gson.Gson
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.fileEditor.FileEditor
import com.intellij.openapi.fileEditor.FileEditorLocation
import com.intellij.openapi.fileEditor.FileEditorState
import com.intellij.openapi.project.Project
import com.intellij.openapi.util.Disposer
import com.intellij.openapi.util.UserDataHolderBase
import com.intellij.openapi.vfs.VirtualFile
import com.intellij.ui.jcef.JBCefApp
import com.intellij.ui.jcef.JBCefBrowser
import com.intellij.ui.jcef.JBCefBrowserBase
import com.intellij.ui.jcef.JBCefBrowserBuilder
import com.intellij.ui.jcef.JBCefJSQuery
import org.cef.browser.CefBrowser
import org.cef.browser.CefFrame
import org.cef.handler.CefLoadHandlerAdapter
import java.awt.BorderLayout
import java.beans.PropertyChangeListener
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.SwingConstants

class DrakoPreviewEditor(
    private val project: Project,
    private val virtualFile: VirtualFile,
    private val document: Document
) : UserDataHolderBase(), FileEditor {

    private val mainPanel = JPanel(BorderLayout())
    private var jbCefBrowser: JBCefBrowser? = null
    private var jsQuery: JBCefJSQuery? = null
    private var isUpdatingFromWebview = false
    private val gson = Gson()

    init {
        if (!JBCefApp.isSupported()) {
            mainPanel.add(JLabel("JBCef (Chromium Embedded) is not supported in this IDE environment.", SwingConstants.CENTER), BorderLayout.CENTER)
        } else {
            setupBrowser()
        }
    }

    private fun setupBrowser() {
        val browser = JBCefBrowserBuilder()
            .setEnableOpenDevToolsMenuItem(true)
            .build()

        this.jbCefBrowser = browser
        mainPanel.add(browser.component, BorderLayout.CENTER)

        val query = JBCefJSQuery.create(browser as JBCefBrowserBase)
        this.jsQuery = query

        query.addHandler { text ->
            isUpdatingFromWebview = true
            try {
                ApplicationManager.getApplication().invokeLater {
                    WriteCommandAction.runWriteCommandAction(project) {
                        if (document.text != text) {
                            document.setText(text)
                        }
                    }
                }
            } finally {
                isUpdatingFromWebview = false
            }
            null
        }

        val inlinedHtml = prepareInlinedHtml(query)

        browser.jbCefClient.addLoadHandler(object : CefLoadHandlerAdapter() {
            override fun onLoadEnd(cefBrowser: CefBrowser?, frame: CefFrame?, httpStatusCode: Int) {
                if (frame?.isMain == true) {
                    sendDocumentTextToWebview(document.text)
                }
            }
        }, browser.cefBrowser)

        browser.loadHTML(inlinedHtml, "https://drakoflow-app/index.html")

        document.addDocumentListener(object : DocumentListener {
            override fun documentChanged(event: DocumentEvent) {
                if (isUpdatingFromWebview) return
                sendDocumentTextToWebview(event.document.text)
            }
        }, this)
    }

    private fun sendDocumentTextToWebview(text: String) {
        val browser = jbCefBrowser ?: return
        val jsonText = gson.toJson(text)
        val js = "if (window.updateDrakoText) { window.updateDrakoText($jsonText); }"
        browser.cefBrowser.executeJavaScript(js, browser.cefBrowser.url, 0)
    }

    private fun prepareInlinedHtml(query: JBCefJSQuery): String {
        val indexHtmlStream = javaClass.getResourceAsStream("/webview-dist/index.html")
            ?: throw IllegalStateException("Resource /webview-dist/index.html not found")
        val indexJsStream = javaClass.getResourceAsStream("/webview-dist/assets/index.js")
            ?: throw IllegalStateException("Resource /webview-dist/assets/index.js not found")
        val indexCssStream = javaClass.getResourceAsStream("/webview-dist/assets/index.css")
            ?: throw IllegalStateException("Resource /webview-dist/assets/index.css not found")

        var htmlContent = indexHtmlStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        val jsContent = indexJsStream.bufferedReader(Charsets.UTF_8).use { it.readText() }.replace("</script>", "<\\/script>")
        val cssContent = indexCssStream.bufferedReader(Charsets.UTF_8).use { it.readText() }.replace("</style>", "<\\/style>")

        // Remove external script and link tags for index.js & index.css
        htmlContent = htmlContent.replace(Regex("""<script[^>]*src=["']\./assets/index\.js["'][^>]*></script>"""), "")
        htmlContent = htmlContent.replace(Regex("""<link[^>]*href=["']\./assets/index\.css["'][^>]*>"""), "")

        val injectedCss = """
            <style>
              $cssContent

              #editor-panel { display: none !important; }
              .diagram-panel { width: 100% !important; flex: 1 !important; }
              li:has(#btn-load), li:has(#btn-save), li:has(#btn-load) + li + li { display: none !important; }
              #btn-toggle-editor { display: none !important; }
              #btn-toggle-lock { display: none !important; }
              .dropdown:has(#btn-file-menu), .dropdown:has(#btn-file-menu) + .vr { display: none !important; }
              .dropdown:has(#btn-toggle-snap), .canvas-controls > .vr { display: none !important; }
              .sidebar-dock, #library-panel { display: none !important; }
            </style>
        """.trimIndent()

        val injectedScript = """
            <script>
              (function() {
                window.updateDrakoText = function(newText) {
                  const editor = document.getElementById('editor');
                  if (editor) {
                    if (editor.value !== newText) {
                      editor.value = newText;
                      editor.dispatchEvent(new Event('input'));
                    }
                  } else {
                    window._pendingDrakoText = newText;
                  }
                };

                function initBridge() {
                  const editor = document.getElementById('editor');
                  if (!editor) return;

                  if (window._pendingDrakoText !== undefined) {
                    editor.value = window._pendingDrakoText;
                    delete window._pendingDrakoText;
                    editor.dispatchEvent(new Event('input'));
                  }

                  let lastText = editor.value;
                  function notifyIde() {
                    const currentText = editor.value;
                    if (currentText !== lastText) {
                      lastText = currentText;
                      ${query.inject("currentText")}
                    }
                  }

                  const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
                  if (descriptor && descriptor.set) {
                    Object.defineProperty(editor, 'value', {
                      get() { return descriptor.get.call(this); },
                      set(val) {
                        const oldVal = this.value;
                        descriptor.set.call(this, val);
                        if (oldVal !== val) {
                          this.dispatchEvent(new Event('programmatic-input'));
                        }
                      }
                    });
                  }

                  editor.addEventListener('input', notifyIde);
                  editor.addEventListener('programmatic-input', notifyIde);
                }

                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', initBridge);
                } else {
                  initBridge();
                }
              })();
            </script>
            <script>
              $jsContent
            </script>
        """.trimIndent()

        return htmlContent
            .replace("</head>", "$injectedCss</head>")
            .replace("</body>", "$injectedScript</body>")
    }

    override fun getComponent(): JComponent = mainPanel

    override fun getPreferredFocusedComponent(): JComponent? = jbCefBrowser?.component

    override fun getName(): String = "DrakoFlow Diagram Preview"

    override fun setState(state: FileEditorState) {}

    override fun isModified(): Boolean = false

    override fun isValid(): Boolean = true

    override fun addPropertyChangeListener(listener: PropertyChangeListener) {}

    override fun removePropertyChangeListener(listener: PropertyChangeListener) {}

    override fun getCurrentLocation(): FileEditorLocation? = null

    override fun getFile(): VirtualFile = virtualFile

    override fun dispose() {
        jsQuery?.let { Disposer.dispose(it) }
        jbCefBrowser?.let { Disposer.dispose(it) }
    }
}
