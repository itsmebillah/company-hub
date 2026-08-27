import java.nio.charset.StandardCharsets
import java.net.URI
import java.util.Base64

plugins {
    id("com.android.application")
    id("com.google.gms.google-services")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "io.github.itsmebillah.companyhub.employee"
    compileSdk = flutter.compileSdkVersion
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildFeatures {
        resValues = true
    }

    defaultConfig {
        // Permanent Production application identity.
        applicationId = "io.github.itsmebillah.companyhub.employee"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

signingConfigs {
        create("productionRelease") {
            val keystorePath = providers.environmentVariable("COMPANY_HUB_KEYSTORE_PATH").orNull
            val keystorePassword = providers.environmentVariable("COMPANY_HUB_KEYSTORE_PASSWORD").orNull
            val signingAlias = providers.environmentVariable("COMPANY_HUB_KEY_ALIAS").orNull
            val signingPassword = providers.environmentVariable("COMPANY_HUB_KEY_PASSWORD").orNull
            if (!keystorePath.isNullOrBlank()) storeFile = file(keystorePath)
            if (!keystorePassword.isNullOrBlank()) storePassword = keystorePassword
            if (!signingAlias.isNullOrBlank()) keyAlias = signingAlias
            if (!signingPassword.isNullOrBlank()) keyPassword = signingPassword
            enableV1Signing = true
            enableV2Signing = true
            enableV3Signing = true
            enableV4Signing = true
        }
    }

    flavorDimensions += "environment"
    productFlavors {
        create("qa") {
            dimension = "environment"
            applicationIdSuffix = ".qa"
            resValue("string", "app_name", "Company Hub QA")
            val qaDefines = decodedDartDefines()
            versionName = qaDefines["QA_VERSION_NAME"] ?: flutter.versionName
            versionCode = qaDefines["QA_VERSION_CODE"]?.toIntOrNull() ?: flutter.versionCode
        }
        create("production") {
            dimension = "environment"
            signingConfig = signingConfigs.getByName("productionRelease")
            resValue("string", "app_name", "Company Hub")
        }
    }


    buildTypes {
        release {
            // The Production flavor supplies its environment-backed signing config.
        }
    }
}

data class EnvironmentContract(val apiBaseUrl: String, val supabaseUrl: String)

val environmentContracts = mapOf(
    "qa" to EnvironmentContract(
        "https://company-hub-qa.onrender.com",
        "https://qa-project.supabase.co",
    ),
    "production" to EnvironmentContract(
        "https://company-hub-zeta.vercel.app",
        "https://jjfktbgfwvekhlvyjlww.supabase.co",
    ),
)

val prohibitedClientDefines = setOf(
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_DB_URL",
    "DATABASE_URL",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_DRIVE_REFRESH_TOKEN",
    "OAUTH_CLIENT_SECRET",
    "SIGNING_KEY",
    "SIGNING_PASSWORD",
)

fun decodedDartDefines(): Map<String, String> {
    val encodedDefines = providers.gradleProperty("dart-defines").orNull.orEmpty()
    if (encodedDefines.isBlank()) return emptyMap()
    return encodedDefines.split(",").associate { encoded ->
        val decoded = String(
            Base64.getDecoder().decode(encoded),
            StandardCharsets.UTF_8,
        )
        val separator = decoded.indexOf('=')
        require(separator > 0) { "Invalid Dart environment definition." }
        decoded.substring(0, separator) to decoded.substring(separator + 1)
    }
}

fun registerEnvironmentValidation(flavor: String) =
    tasks.register("validate${flavor.replaceFirstChar(Char::uppercase)}Environment") {
        group = "verification"
        description = "Validates the $flavor Android environment contract."
        doLast {
            val defines = decodedDartDefines()
            val contract = environmentContracts.getValue(flavor)
            val required = listOf(
                "APP_FLAVOR",
                "API_BASE_URL",
                "SUPABASE_URL",
                "SUPABASE_ANON_KEY",
            ) + if (flavor == "qa") listOf("QA_VERSION_NAME", "QA_VERSION_CODE") else emptyList()
            val missing = required.filter { defines[it].isNullOrBlank() }
            if (missing.isNotEmpty()) {
                throw GradleException(
                    "Missing required $flavor configuration: ${missing.joinToString()}.",
                )
            }
            if (flavor == "production") {
                val signingValues = mapOf(
                    "COMPANY_HUB_KEYSTORE_PATH" to providers.environmentVariable("COMPANY_HUB_KEYSTORE_PATH").orNull,
                    "COMPANY_HUB_KEYSTORE_PASSWORD" to providers.environmentVariable("COMPANY_HUB_KEYSTORE_PASSWORD").orNull,
                    "COMPANY_HUB_KEY_ALIAS" to providers.environmentVariable("COMPANY_HUB_KEY_ALIAS").orNull,
                    "COMPANY_HUB_KEY_PASSWORD" to providers.environmentVariable("COMPANY_HUB_KEY_PASSWORD").orNull,
                )
                val missingSigning = signingValues.filterValues { it.isNullOrBlank() }.keys
                if (missingSigning.isNotEmpty()) {
                    throw GradleException(
                        "Missing secure Production signing configuration: ${missingSigning.sorted().joinToString()}.",
                    )
                }
                if (!file(signingValues.getValue("COMPANY_HUB_KEYSTORE_PATH")!!).isFile) {
                    throw GradleException("The Production keystore file is unavailable.")
                }
            }

            val prohibited = prohibitedClientDefines.intersect(defines.keys)
            if (prohibited.isNotEmpty()) {
                throw GradleException(
                    "Privileged configuration is prohibited in the Android client: " +
                        prohibited.sorted().joinToString(),
                )
            }
            if (defines.getValue("APP_FLAVOR") != flavor) {
                throw GradleException("The $flavor build requires APP_FLAVOR=$flavor.")
            }
            if (flavor == "qa") {
                val qaVersionCode = defines.getValue("QA_VERSION_CODE").toIntOrNull()
                if (qaVersionCode == null || qaVersionCode <= 0) {
                    throw GradleException("QA_VERSION_CODE must be a positive integer.")
                }
                if (defines.getValue("QA_VERSION_NAME").isBlank()) {
                    throw GradleException("QA_VERSION_NAME is required.")
                }
            }
            if (defines.getValue("API_BASE_URL") != contract.apiBaseUrl) {
                throw GradleException(
                    "The $flavor build API_BASE_URL does not match its approved contract.",
                )
            }
            if (defines.getValue("SUPABASE_URL") != contract.supabaseUrl) {
                throw GradleException(
                    "The $flavor build SUPABASE_URL does not match its approved contract.",
                )
            }
            for (key in listOf("API_BASE_URL", "SUPABASE_URL")) {
                val uri = URI(defines.getValue(key))
                if (uri.scheme != "https" || uri.host.isNullOrBlank()) {
                    throw GradleException("$key must be a valid HTTPS URL.")
                }
            }
        }
    }

val validateQaEnvironment = registerEnvironmentValidation("qa")
val validateProductionEnvironment = registerEnvironmentValidation("production")

tasks.configureEach {
    when (name) {
        "preQaDebugBuild", "preQaReleaseBuild", "preQaProfileBuild" ->
            dependsOn(validateQaEnvironment)
        "preProductionDebugBuild",
        "preProductionReleaseBuild",
        "preProductionProfileBuild",
        -> dependsOn(validateProductionEnvironment)
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}

dependencies {
    testImplementation("junit:junit:4.13.2")
}
