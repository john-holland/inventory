package com.inventory.api

import org.glassfish.jersey.server.ResourceConfig
import org.glassfish.jersey.server.ServerProperties

class InventoryApplication : ResourceConfig() {
    init {
        // Enable automatic discovery of resources
        property(ServerProperties.BV_SEND_ERROR_IN_RESPONSE, true)
        property(ServerProperties.RESPONSE_SET_STATUS_OVER_SEND_ERROR, true)
        
        // Register packages to scan for resources
        packages("com.inventory.api.resources")
        
        // Register exception mappers
        register(GenericExceptionMapper::class.java)
    }
} 