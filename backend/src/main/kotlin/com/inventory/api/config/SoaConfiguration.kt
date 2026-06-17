package com.inventory.api.config

import org.springframework.boot.context.properties.EnableConfigurationProperties
import org.springframework.context.annotation.Configuration

@Configuration
@EnableConfigurationProperties(SoaProperties::class)
open class SoaConfiguration
