package com.inventory.api.model

import kotlinx.serialization.Serializable
import kotlinx.serialization.Contextual
import java.math.BigDecimal
import java.time.LocalDateTime

@Serializable
data class InventoryItem(
    val id: String,
    val name: String,
    val description: String,
    val ownerId: String,
    val currentHolderId: String?,
    val status: ItemStatus,
    @Contextual val shippingCost: BigDecimal,
    @Contextual val buyoutPrice: BigDecimal?,
    @Contextual val createdAt: LocalDateTime,
    @Contextual val updatedAt: LocalDateTime,
    val contractAddress: String?,
    val location: Location
)

@Serializable
data class Location(
    val latitude: Double,
    val longitude: Double,
    val address: String
)

enum class ItemStatus {
    AVAILABLE,
    LENT,
    SOLD,
    RETURNED,
    LOST
} 