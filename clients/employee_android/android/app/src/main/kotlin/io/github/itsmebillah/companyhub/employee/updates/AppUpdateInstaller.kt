package io.github.itsmebillah.companyhub.employee.updates
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.util.concurrent.Executors

class AppUpdateInstaller(private val context: Context) {
    private val executor = Executors.newSingleThreadExecutor()
    fun installedInfo(): Map<String, Any> {
        val info = context.packageManager.getPackageInfo(context.packageName, 0)
        return mapOf("applicationId" to context.packageName, "versionName" to (info.versionName ?: ""), "versionCode" to longVersionCode(info))
    }
    fun downloadAndInstall(rawUrl: String, expectedSha256: String, expectedVersionCode: Long, callback: (Map<String, Any?>) -> Unit) {
        executor.execute {
            val result = try { prepareInstaller(rawUrl, expectedSha256, expectedVersionCode) } catch (_: Exception) { failure("download_failed") }
            context.mainExecutor.execute { callback(result) }
        }
    }
    fun close() = executor.shutdownNow()
    private fun prepareInstaller(rawUrl: String, expectedSha256: String, expectedVersionCode: Long): Map<String, Any?> {
        val initial = Uri.parse(rawUrl)
        if (!isOfficialReleaseUrl(initial)) return failure("untrusted_url")
        val updates = File(context.cacheDir, "verified-updates").apply { mkdirs() }
        val apk = File(updates, "company-hub-$expectedVersionCode.apk")
        download(initial.toString(), apk)
        if (!constantTimeEquals(sha256(apk), expectedSha256.lowercase())) { apk.delete(); return failure("hash_mismatch") }
        val archive = packageArchive(apk) ?: return failure("package_unreadable")
        if (archive.packageName != context.packageName) return failure("package_mismatch")
        if (longVersionCode(archive) != expectedVersionCode || expectedVersionCode <= installedVersionCode()) return failure("version_mismatch")
        if (!sameSigningCertificate(apk)) return failure("signature_mismatch")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !context.packageManager.canRequestPackageInstalls()) {
            context.startActivity(Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            return failure("install_permission_required")
        }
        val contentUri = FileProvider.getUriForFile(context, "${context.packageName}.update-files", apk)
        context.startActivity(Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(contentUri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
        })
        return mapOf("ok" to true)
    }
    private fun download(rawUrl: String, destination: File) {
        var current = URL(rawUrl)
        repeat(MAX_REDIRECTS + 1) { redirectCount ->
            val connection = current.openConnection() as HttpURLConnection
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 15_000
            connection.readTimeout = 30_000
            connection.setRequestProperty("User-Agent", "CompanyHub-Employee-Android")
            try {
                val code = connection.responseCode
                if (code in 300..399) {
                    if (redirectCount == MAX_REDIRECTS) throw IllegalStateException("redirect_limit")
                    val location = connection.getHeaderField("Location") ?: throw IllegalStateException("missing_redirect")
                    val next = Uri.parse(URL(current, location).toString())
                    if (!isTrustedDownloadHost(next)) throw SecurityException("untrusted_redirect")
                    current = URL(next.toString())
                    return@repeat
                }
                if (code != HttpURLConnection.HTTP_OK) throw IllegalStateException("download_http_$code")
                destination.outputStream().use { output -> connection.inputStream.use { it.copyTo(output) } }
                return
            } finally { connection.disconnect() }
        }
        throw IllegalStateException("download_failed")
    }
    @Suppress("DEPRECATION")
    private fun packageArchive(apk: File) = context.packageManager.getPackageArchiveInfo(apk.absolutePath, if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES)
    @Suppress("DEPRECATION")
    private fun sameSigningCertificate(apk: File): Boolean {
        val archive = packageArchive(apk) ?: return false
        val installed = context.packageManager.getPackageInfo(context.packageName, if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES)
        fun certificates(info: android.content.pm.PackageInfo): Set<String> {
            val signatures = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) info.signingInfo?.apkContentsSigners.orEmpty() else info.signatures.orEmpty()
            return signatures.map { digest(it.toByteArray()) }.toSet()
        }
        return certificates(archive).isNotEmpty() && certificates(archive) == certificates(installed)
    }
    private fun installedVersionCode(): Long = longVersionCode(context.packageManager.getPackageInfo(context.packageName, 0))
    @Suppress("DEPRECATION")
    private fun longVersionCode(info: android.content.pm.PackageInfo): Long = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) info.longVersionCode else info.versionCode.toLong()
    private fun sha256(file: File): String = file.inputStream().use { input ->
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(DEFAULT_BUFFER_SIZE)
        while (true) { val count = input.read(buffer); if (count < 0) break; digest.update(buffer, 0, count) }
        digest.digest().joinToString("") { "%02x".format(it) }
    }
    private fun digest(bytes: ByteArray) = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
    private fun constantTimeEquals(left: String, right: String) = MessageDigest.isEqual(left.toByteArray(), right.toByteArray())
    private fun isOfficialReleaseUrl(uri: Uri) = uri.scheme == "https" && uri.host == "github.com" && uri.pathSegments.size == 6 && uri.pathSegments[0] == "itsmebillah" && uri.pathSegments[1] == "company-hub" && uri.pathSegments[2] == "releases" && uri.pathSegments[3] == "download" && uri.pathSegments[5] == APK_ASSET_NAME
    private fun isTrustedDownloadHost(uri: Uri) = uri.scheme == "https" && (uri.host == "github.com" || uri.host == "release-assets.githubusercontent.com" || uri.host == "objects.githubusercontent.com")
    private fun failure(code: String): Map<String, Any?> = mapOf("ok" to false, "code" to code)
    companion object { private const val APK_ASSET_NAME = "app-production-release.apk"; private const val MAX_REDIRECTS = 5 }
}