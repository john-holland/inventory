package com.inventory.api.config

import org.springframework.boot.context.properties.ConfigurationProperties

/**
 * SOA / Cave discovery for server-side (BFF) calls to resaurce and saurce.
 * Mirrors Python env: SOA_REGISTRY_PATH, SOA_*_URL, CAVE_BASE_URL.
 */
@ConfigurationProperties(prefix = "soa")
open class SoaProperties {
    var registryPath: String = ""
    var resaurceUrl: String = ""
    var saurceUrl: String = ""
    var inventoryUrl: String = ""
    var useAwsDiscovery: Boolean = false
}
