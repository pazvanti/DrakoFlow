package com.drakoflow.intellij.editor

import com.google.gson.Gson
import com.intellij.openapi.application.ApplicationManager
import com.intellij.openapi.command.WriteCommandAction
import com.intellij.openapi.editor.Document
import com.intellij.openapi.editor.event.DocumentEvent
import com.intellij.openapi.editor.event.DocumentListener
import com.intellij.openapi.fileChooser.FileChooserFactory
import com.intellij.openapi.fileChooser.FileSaverDescriptor
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
import org.cef.callback.CefBeforeDownloadCallback
import org.cef.callback.CefDownloadItem
import org.cef.callback.CefDownloadItemCallback
import org.cef.handler.CefDownloadHandlerAdapter
import org.cef.handler.CefLoadHandlerAdapter
import java.awt.BorderLayout
import java.beans.PropertyChangeListener
import java.util.Base64
import javax.swing.JComponent
import javax.swing.JLabel
import javax.swing.JPanel
import javax.swing.SwingConstants

private data class DownloadPayload(val filename: String?, val dataUrl: String?)

class DrakoPreviewEditor(
    private val project: Project,
    private val virtualFile: VirtualFile,
    private val document: Document
) : UserDataHolderBase(), FileEditor {

    private val mainPanel = JPanel(BorderLayout())
    private var jbCefBrowser: JBCefBrowser? = null
    private var jsQuery: JBCefJSQuery? = null
    private var downloadQuery: JBCefJSQuery? = null
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

        val dlQuery = JBCefJSQuery.create(browser as JBCefBrowserBase)
        this.downloadQuery = dlQuery

        dlQuery.addHandler { jsonPayload ->
            try {
                val dataObj = gson.fromJson(jsonPayload, DownloadPayload::class.java)
                val rawName = dataObj.filename?.ifBlank { null } ?: "diagram.png"
                val dataUrl = dataObj.dataUrl ?: ""
                val ext = rawName.substringAfterLast('.', "png")

                ApplicationManager.getApplication().invokeLater {
                    val descriptor = FileSaverDescriptor("Export $rawName", "Select location to save exported file", ext)
                    val saveFileDialog = FileChooserFactory.getInstance().createSaveFileDialog(descriptor, project)
                    val parentDir = virtualFile.parent
                    val fileWrapper = saveFileDialog.save(parentDir, rawName)

                    if (fileWrapper != null) {
                        val bytes = decodeDataUrl(dataUrl)
                        if (bytes != null) {
                            fileWrapper.file.writeBytes(bytes)
                        }
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
            null
        }

        val inlinedHtml = prepareInlinedHtml(query, dlQuery)

        browser.jbCefClient.addLoadHandler(object : CefLoadHandlerAdapter() {
            override fun onLoadEnd(cefBrowser: CefBrowser?, frame: CefFrame?, httpStatusCode: Int) {
                if (frame?.isMain == true) {
                    sendDocumentTextToWebview(document.text)
                }
            }
        }, browser.cefBrowser)

        browser.jbCefClient.addDownloadHandler(object : CefDownloadHandlerAdapter() {
            override fun onBeforeDownload(
                cefBrowser: CefBrowser?,
                downloadItem: CefDownloadItem?,
                suggestedName: String?,
                callback: CefBeforeDownloadCallback?
            ) {
                val rawName = suggestedName?.ifBlank { null }
                    ?: downloadItem?.suggestedFileName?.ifBlank { null }
                    ?: "diagram.png"
                val ext = rawName.substringAfterLast('.', "png")

                ApplicationManager.getApplication().invokeLater {
                    val descriptor = FileSaverDescriptor("Export Diagram", "Save exported file", ext)
                    val saveFileDialog = FileChooserFactory.getInstance().createSaveFileDialog(descriptor, project)
                    val parentDir = virtualFile.parent
                    val fileWrapper = saveFileDialog.save(parentDir, rawName)

                    if (fileWrapper != null) {
                        callback?.Continue(fileWrapper.file.absolutePath, false)
                    } else {
                        callback?.Continue(null, false)
                    }
                }
            }

            override fun onDownloadUpdated(
                cefBrowser: CefBrowser?,
                downloadItem: CefDownloadItem?,
                callback: CefDownloadItemCallback?
            ) {
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

    private fun decodeDataUrl(dataUrl: String): ByteArray? {
        val commaIdx = dataUrl.indexOf(',')
        if (commaIdx == -1) return null
        val base64Data = dataUrl.substring(commaIdx + 1)
        return Base64.getDecoder().decode(base64Data)
    }

    private fun sendDocumentTextToWebview(text: String) {
        val browser = jbCefBrowser ?: return
        val jsonText = gson.toJson(text)
        val js = "if (window.updateDrakoText) { window.updateDrakoText($jsonText); }"
        browser.cefBrowser.executeJavaScript(js, browser.cefBrowser.url, 0)
    }

    private fun prepareInlinedHtml(query: JBCefJSQuery, dlQuery: JBCefJSQuery): String {
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
                const originalClick = HTMLAnchorElement.prototype.click;
                HTMLAnchorElement.prototype.click = function() {
                  if (this.download && this.href && window._postDownloadToIde) {
                    const filename = this.download;
                    const href = this.href;
                    fetch(href)
                      .then(res => res.blob())
                      .then(blob => {
                        const reader = new FileReader();
                        reader.onloadend = function() {
                          window._postDownloadToIde(JSON.stringify({
                            filename: filename,
                            dataUrl: reader.result
                          }));
                        };
                        reader.readAsDataURL(blob);
                      })
                      .catch(err => {
                        console.error('Failed to process download blob:', err);
                      });
                  }
                  return originalClick.apply(this, arguments);
                };

                window._postDownloadToIde = function(payload) {
                  ${dlQuery.inject("payload")}
                };

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
        downloadQuery?.let { Disposer.dispose(it) }
        jsQuery?.let { Disposer.dispose(it) }
        jbCefBrowser?.let { Disposer.dispose(it) }
    }
}
