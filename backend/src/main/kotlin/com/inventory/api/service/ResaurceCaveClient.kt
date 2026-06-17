package com.inventory.api.service

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.inventory.api.config.SoaProperties
import org.springframework.stereotype.Service
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

/**
 * Server-side POST to resaurce Cave (`/cave/route`) when [SoaProperties.resaurceUrl] is set.
 */
@Service
class ResaurceCaveClient(
    private val soa: SoaProperties,
) {
    private val mapper = ObjectMapper()
    private val http: HttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20))
        .build()

    fun postCaveRoute(body: Map<String, Any>): JsonNode? {
        val base = soa.resaurceUrl.trim().trimEnd('/')
        if (base.isEmpty()) return null
        return postToCave(base, body)
    }

    fun postCaveMessage(message: String, payload: Map<String, Any>, traceId: String): JsonNode? {
        val base = soa.resaurceUrl.trim().trimEnd('/')
        if (base.isEmpty()) return null
        val body = mapOf(
            "schema_version" to "2.0",
            "message" to message,
            "service" to "resaurce",
            "payload" to payload,
            "trace_id" to traceId,
            "reply_mode" to "sync_http",
        )
        return postToCave(base, body)
    }

    private fun postToCave(base: String, body: Map<String, Any>): JsonNode? {
        val uri = URI.create("$base/cave/route")
        val json = mapper.writeValueAsString(body)
        val req = HttpRequest.newBuilder(uri)
            .timeout(Duration.ofSeconds(45))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build()
        val res = http.send(req, HttpResponse.BodyHandlers.ofString())
        if (res.statusCode() / 100 != 2) return null
        return mapper.readTree(res.body())
    }
}
