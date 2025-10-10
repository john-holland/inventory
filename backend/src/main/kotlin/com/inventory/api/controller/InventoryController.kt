package com.inventory.api.controller

import com.inventory.api.model.InventoryItem
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api")
class InventoryController {
    
    @GetMapping("/inventory")
    fun getAllItems(): List<InventoryItem> {
        // TODO: Implement item retrieval
        return emptyList()
    }
    
    @GetMapping("/inventory/{id}")
    fun getItem(@PathVariable id: String): InventoryItem? {
        // TODO: Implement item retrieval by ID
        return null
    }
    
    @PostMapping("/inventory")
    fun createItem(@RequestBody item: InventoryItem): InventoryItem {
        // TODO: Implement item creation
        return item
    }
    
    @PutMapping("/inventory/{id}")
    fun updateItem(@PathVariable id: String, @RequestBody item: InventoryItem): InventoryItem {
        // TODO: Implement item update
        return item
    }
    
    @DeleteMapping("/inventory/{id}")
    fun deleteItem(@PathVariable id: String): String {
        // TODO: Implement item deletion
        return "Item deleted"
    }
}

