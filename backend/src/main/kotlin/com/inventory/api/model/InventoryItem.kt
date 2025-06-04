package com.inventory.api.model

import kotlinx.serialization.Serializable
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
    val shippingCost: BigDecimal,
    val buyoutPrice: BigDecimal?,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
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