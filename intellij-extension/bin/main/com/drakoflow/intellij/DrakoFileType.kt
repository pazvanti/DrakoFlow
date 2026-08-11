package com.drakoflow.intellij

import com.intellij.openapi.fileTypes.LanguageFileType
import javax.swing.Icon

object DrakoFileType : LanguageFileType(DrakoLanguage) {
    override fun getName(): String = "DrakoFlow"
    override fun getDescription(): String = "DrakoFlow diagram file"
    override fun getDefaultExtension(): String = "drako"
    override fun getIcon(): Icon = DrakoIcons.FILE
}
