package dev.companyhub.provisional.employee.tracking

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile
import java.nio.charset.StandardCharsets
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import org.json.JSONArray
import org.json.JSONObject

/** A Keystore-backed, application-private queue with transport safety bounds. */
internal class EncryptedLocationQueue(context: Context) {
    private val file = AtomicFile(context.noBackupFilesDir.resolve(FILE_NAME))
    private val lock = Any()

    fun enqueue(point: QueuedLocationPoint): Boolean = synchronized(lock) {
        val points = readLocked().toMutableList()
        if (points.size >= MAX_POINTS) return false
        points += point
        writeLocked(points)
        true
    }

    fun peek(sessionId: String, limit: Int): List<QueuedLocationPoint> = synchronized(lock) {
        readLocked()
            .filter { it.trackingSessionId == sessionId }
            .sortedWith(compareBy(QueuedLocationPoint::observedAtEpochMillis, QueuedLocationPoint::idempotencyKey))
            .take(limit.coerceIn(1, MAX_BATCH_POINTS))
    }

    fun removeKeys(sessionId: String, keys: Set<String>) = synchronized(lock) {
        val retained = readLocked().filterNot {
            it.trackingSessionId == sessionId && it.idempotencyKey in keys
        }
        writeLocked(retained)
    }

    fun clearSession(sessionId: String) = synchronized(lock) {
        writeLocked(readLocked().filterNot { it.trackingSessionId == sessionId })
    }

    fun clearAll() = synchronized(lock) { writeLocked(emptyList()) }

    fun retainSession(sessionId: String) = synchronized(lock) {
        writeLocked(readLocked().filter { it.trackingSessionId == sessionId })
    }

    fun count(sessionId: String? = null): Int = synchronized(lock) {
        val points = readLocked()
        if (sessionId == null) points.size else points.count { it.trackingSessionId == sessionId }
    }

    private fun readLocked(): List<QueuedLocationPoint> {
        if (!file.baseFile.exists()) return emptyList()
        return try {
            val encrypted = file.openRead().use { it.readBytes() }
            if (encrypted.size <= IV_BYTES) return emptyList()
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(
                Cipher.DECRYPT_MODE,
                secretKey(),
                GCMParameterSpec(TAG_BITS, encrypted.copyOfRange(0, IV_BYTES)),
            )
            val plaintext = cipher.doFinal(encrypted.copyOfRange(IV_BYTES, encrypted.size))
            val array = JSONArray(String(plaintext, StandardCharsets.UTF_8))
            buildList {
                for (index in 0 until array.length()) {
                    val value = array.getJSONObject(index)
                    add(
                        QueuedLocationPoint(
                            trackingSessionId = value.getString("session"),
                            idempotencyKey = value.getString("key"),
                            observedAtEpochMillis = value.getLong("observedAt"),
                            latitude = value.getDouble("latitude"),
                            longitude = value.getDouble("longitude"),
                            accuracyMeters = value.getDouble("accuracy").toFloat(),
                        ),
                    )
                }
            }
        } catch (_: Exception) {
            // Corrupt or undecryptable local data is unusable and must fail closed.
            file.delete()
            emptyList()
        }
    }

    private fun writeLocked(points: List<QueuedLocationPoint>) {
        if (points.isEmpty()) {
            file.delete()
            return
        }
        val array = JSONArray()
        points.forEach { point ->
            array.put(
                JSONObject()
                    .put("session", point.trackingSessionId)
                    .put("key", point.idempotencyKey)
                    .put("observedAt", point.observedAtEpochMillis)
                    .put("latitude", point.latitude)
                    .put("longitude", point.longitude)
                    .put("accuracy", point.accuracyMeters.toDouble()),
            )
        }
        val plaintext = array.toString().toByteArray(StandardCharsets.UTF_8)
        require(plaintext.size <= MAX_PLAINTEXT_BYTES) { "Encrypted location queue capacity reached." }
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey())
        val encrypted = cipher.iv + cipher.doFinal(plaintext)
        val output = file.startWrite()
        try {
            output.write(encrypted)
            file.finishWrite(output)
        } catch (error: Exception) {
            file.failWrite(output)
            throw error
        }
    }

    private fun secretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(KEYSTORE).apply { load(null) }
        (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE)
        generator.init(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build(),
        )
        return generator.generateKey()
    }

    companion object {
        const val MAX_BATCH_POINTS = 100
        const val MAX_POINTS = 500
        const val MAX_PLAINTEXT_BYTES = 512 * 1024
        private const val FILE_NAME = "duty-location-queue.bin"
        private const val KEY_ALIAS = "company_hub_duty_location_queue_v1"
        private const val KEYSTORE = "AndroidKeyStore"
        private const val TRANSFORMATION = "AES/GCM/NoPadding"
        private const val IV_BYTES = 12
        private const val TAG_BITS = 128
    }
}
