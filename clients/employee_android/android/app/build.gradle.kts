import java.nio.charset.StandardCharsets
import java.net.URI
import java.util.Base64

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

android {
    namespace = "dev.companyhub.provisional.employee"
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
        // Provisional only; ADR-016 requires a final approved namespace.
        applicationId = "dev.companyhub.provisional.employee"
        minSdk = flutter.minSdkVersion
        targetSdk = flutter.targetSdkVersion
        // Uses the version code from pubspec.yaml. When using split APKs, 1000 * ABI_VERSION
        // is added automatically by Flutter. (https://developer.android.com/studio/build/configure-apk-splits#configure-APK-versions)
        // You can force using the value of versionCode by specifying the `-P force-version-code-ignoring-abi=true`
        // flag during build.
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    flavorDimensions += "environment"
    productFlavors {
        create("qa") {
            dimension = "environment"
            applicationIdSuffix = ".qa"
            resValue("string", "app_name", "Company Hub QA")
        }
        create("production") {
            dimension = "environment"
            applicationIdSuffix = ".production"
            resValue("string", "app_name", "Company Hub")
        }
    }

    buildTypes {
        release {
            // Signing is intentionally unconfigured pending ADR-016 ownership.
        }
    }
}

data class EnvironmentContract(val apiBaseUrl: String, val supabaseUrl: String)

val environmentContracts = mapOf(
    "qa" to EnvironmentContract(
        "https://qa-api.company-hub.invalid",
        "https://qa-project.supabase.co",
    ),
    "production" to EnvironmentContract(
        "https://api.company-hub.invalid",
        "https://production-project.supabase.co",
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
            )
            val missing = required.filter { defines[it].isNullOrBlank() }
            if (missing.isNotEmpty()) {
                throw GradleException(
                    "Missing required $flavor configuration: ${missing.joinToString()}.",
                )
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
