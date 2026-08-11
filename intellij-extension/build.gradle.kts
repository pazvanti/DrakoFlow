plugins {
    id("java")
    id("org.jetbrains.kotlin.jvm") version "1.9.22"
    id("org.jetbrains.intellij") version "1.17.4"
}

group = "com.drakoflow.intellij"
version = "1.0.0"

repositories {
    mavenCentral()
}

intellij {
    version.set("2023.2.5")
    type.set("IC")
}

tasks {
    withType<JavaCompile> {
        sourceCompatibility = "17"
        targetCompatibility = "17"
    }
    withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
        kotlinOptions.jvmTarget = "17"
    }

    patchPluginXml {
        sinceBuild.set("232")
        untilBuild.set(provider { null })
    }

    buildSearchableOptions {
        enabled = false
    }

    val copyWebviewDist = register("copyWebviewDist", Exec::class) {
        workingDir = rootDir.parentFile
        if (System.getProperty("os.name").lowercase().contains("windows")) {
            commandLine("cmd", "/c", "node scripts/copy-intellij-dist.js")
        } else {
            commandLine("node", "scripts/copy-intellij-dist.js")
        }
    }

    processResources {
        dependsOn(copyWebviewDist)
    }
}
