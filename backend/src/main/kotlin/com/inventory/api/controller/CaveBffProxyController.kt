package com.inventory.api.controller

import com.fasterxml.jackson.databind.ObjectMapper
import com.inventory.api.config.SoaProperties
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.CrossOrigin
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.time.Duration

/**
 * Optional BFF: forwards POST JSON to ``{resolved base}/cave/route`` for browser CORS or secret handling.
 * Enable with ``soa.cave-bff-proxy-enabled=true``.
 */
@RestController
@RequestMapping("/bff")
@CrossOrigin(origins = ["http://localhost:3000"])
@ConditionalOnProperty(name = ["soa.cave-bff-proxy-enabled"], havingValue = "true")
open class CaveBffProxyController(
    private val soa: SoaProperties,
) {
    private val mapper = ObjectMapper()
    private val httpClient: HttpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(20))
        .build()

    @PostMapping("/cave/route", consumes = [MediaType.APPLICATION_JSON_VALUE], produces = [MediaType.APPLICATION_JSON_VALUE])
    fun forwardCaveRoute(@RequestBody body: Map<String, Any>): ResponseEntity<String> {
        val route = body["route"] as? String
        val message = body["message"] as? String
        val service = body["service"] as? String
        if (route.isNullOrBlank() && message.isNullOrBlank()) {
            return ResponseEntity.badRequest().body("""{"ok":false,"error":"route_or_message_required"}""")
        }
        val base = when {
            !route.isNullOrBlank() -> baseForRoute(route).trim().trimEnd('/')
            service == "saurce" -> soa.saurceUrl.trim().trimEnd('/')
            service == "inventory" -> soa.inventoryUrl.trim().trimEnd('/')
            else -> soa.resaurceUrl.trim().trimEnd('/')
        }
        if (base.isEmpty()) {
            return ResponseEntity.status(502).body("""{"ok":false,"skipped":true,"reason":"no_base_url"}""")
        }
        val target = URI.create("$base/cave/route")
        val json = mapper.writeValueAsString(body)
        val req = HttpRequest.newBuilder(target)
            .timeout(Duration.ofSeconds(45))
            .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .POST(HttpRequest.BodyPublishers.ofString(json))
            .build()
        val res = httpClient.send(req, HttpResponse.BodyHandlers.ofString())
        return ResponseEntity.status(res.statusCode()).contentType(MediaType.APPLICATION_JSON).body(res.body())
    }

    private fun baseForRoute(route: String): String {
        val idx = route.indexOf(':')
        val prefix = if (idx > 0) route.substring(0, idx).trim().lowercase() else ""
        return when (prefix) {
            "resaurce" -> soa.resaurceUrl
            "saurce" -> soa.saurceUrl
            "inventory" -> soa.inventoryUrl
            else -> soa.resaurceUrl.ifEmpty { soa.inventoryUrl }
        }
    }
}
