package com.inventory.api.config

import com.inventory.api.resources.InventoryResource
import org.glassfish.jersey.server.ResourceConfig
import org.springframework.context.annotation.Configuration
import jakarta.ws.rs.ApplicationPath

@Configuration
@ApplicationPath("/api")
open class JerseyConfig : ResourceConfig() {
    init {
        register(InventoryResource::class.java)
    }
}
