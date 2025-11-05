package com.inventory.api.service

import org.springframework.stereotype.Service
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.CompletableFuture
import java.util.UUID
import java.time.LocalDateTime

/**
 * Document Job Queue Service
 * Manages async document generation jobs with session-based tracking
 */
@Service
class DocumentJobQueueService(
    private val pythonScriptExecutor: PythonScriptExecutor
) {

    // In-memory job queue (in production, use Redis or database)
    private val jobQueue = ConcurrentHashMap<String, DocumentJob>()
    
    // Document parking for session-based downloads
    private val documentParking = ConcurrentHashMap<String, ByteArray>()

    /**
     * Queue tax document generation job
     */
    fun queueTaxDocumentGeneration(
        userId: String,
        year: Int,
        documentType: String,
        sessionId: String
    ): String {
        val jobId = UUID.randomUUID().toString()
        
        val job = DocumentJob(
            jobId = jobId,
            sessionId = sessionId,
            type = "tax_document",
            status = "queued",
            progress = 0,
            createdAt = LocalDateTime.now()
        )
        
        jobQueue[sessionId] = job
        
        // Execute Python script asynchronously
        CompletableFuture.runAsync {
            executeTaxDocumentGeneration(sessionId, userId, year, documentType)
        }
        
        println("📋 Queued tax document generation: jobId=$jobId, sessionId=$sessionId")
        return jobId
    }

    /**
     * Queue legal document generation job
     */
    fun queueLegalDocumentGeneration(
        documentType: String,
        platformFeatures: List<String>,
        legalRequirements: List<String>,
        sessionId: String
    ): String {
        val jobId = UUID.randomUUID().toString()
        
        val job = DocumentJob(
            jobId = jobId,
            sessionId = sessionId,
            type = "legal_document",
            status = "queued",
            progress = 0,
            createdAt = LocalDateTime.now()
        )
        
        jobQueue[sessionId] = job
        
        CompletableFuture.runAsync {
            executeLegalDocumentGeneration(sessionId, documentType, platformFeatures, legalRequirements)
        }
        
        println("⚖️ Queued legal document generation: jobId=$jobId, sessionId=$sessionId")
        return jobId
    }

    /**
     * Queue inventory report generation job
     */
    fun queueInventoryReportGeneration(
        includePrices: Boolean,
        organizeBy: String,
        piiLevel: String,
        userRole: String,
        sessionId: String
    ): String {
        val jobId = UUID.randomUUID().toString()
        
        val job = DocumentJob(
            jobId = jobId,
            sessionId = sessionId,
            type = "inventory_report",
            status = "queued",
            progress = 0,
            createdAt = LocalDateTime.now()
        )
        
        jobQueue[sessionId] = job
        
        CompletableFuture.runAsync {
            executeInventoryReportGeneration(sessionId, includePrices, organizeBy, piiLevel, userRole)
        }
        
        println("📦 Queued inventory report generation: jobId=$jobId, sessionId=$sessionId")
        return jobId
    }

    /**
     * Get job status
     */
    fun getJobStatus(sessionId: String): JobStatus {
        val job = jobQueue[sessionId]
        
        return if (job != null) {
            JobStatus(
                status = job.status,
                message = job.message ?: "Processing...",
                progress = job.progress
            )
        } else {
            JobStatus(
                status = "not_found",
                message = "Job not found",
                progress = 0
            )
        }
    }

    /**
     * Get document data for download
     */
    fun getDocumentData(sessionId: String): ByteArray? {
        return documentParking[sessionId]
    }

    /**
     * Clear document parking after download
     */
    fun clearDocumentParking(sessionId: String) {
        documentParking.remove(sessionId)
        jobQueue.remove(sessionId)
        println("🗑️ Cleared document parking for session: $sessionId")
    }

    /**
     * Cancel job
     */
    fun cancelJob(sessionId: String): Boolean {
        val job = jobQueue[sessionId]
        
        return if (job != null && job.status in listOf("queued", "processing")) {
            job.status = "cancelled"
            job.message = "Job cancelled by user"
            jobQueue[sessionId] = job
            true
        } else {
            false
        }
    }

    /**
     * Queue service performance requirements document generation
     */
    fun queueServicePerformanceGeneration(sessionId: String, userId: String): String {
        val jobId = UUID.randomUUID().toString()
        
        val job = DocumentJob(
            jobId = jobId,
            sessionId = sessionId,
            userId = userId,
            documentType = "service-performance-requirements",
            status = "queued",
            progress = 0,
            message = "Queued for generation",
            createdAt = LocalDateTime.now()
        )
        
        jobQueue[sessionId] = job
        
        // Execute Python script asynchronously
        CompletableFuture.runAsync {
            executeServicePerformanceGeneration(sessionId)
        }
        
        println("📋 Queued service performance requirements generation: jobId=$jobId, sessionId=$sessionId")
        return jobId
    }
    
    /**
     * Execute service performance requirements document generation
     */
    private fun executeServicePerformanceGeneration(sessionId: String) {
        try {
            updateJobStatus(sessionId, "processing", "Generating service performance requirements...", 10)
            
            val args = listOf("generate_service_performance")
            
            updateJobStatus(sessionId, "processing", "Executing Python script...", 30)
            val result = pythonScriptExecutor.executePythonScript(
                scriptPath = "backend/python-apis/service-performance/service_performance.py",
                args = args
            )
            
            updateJobStatus(sessionId, "processing", "Processing results...", 70)
            
            if (result.success) {
                val documentData = result.output.toByteArray()
                documentParking[sessionId] = documentData
                
                updateJobStatus(sessionId, "completed", "Service performance document generated successfully", 100)
                println("✅ Service performance document generated for session: $sessionId")
            } else {
                updateJobStatus(sessionId, "failed", "Failed to generate document: ${result.error}", 0)
                println("❌ Service performance document generation failed for session: $sessionId")
            }
        } catch (e: Exception) {
            updateJobStatus(sessionId, "failed", "Error: ${e.message}", 0)
            println("❌ Service performance document generation error: ${e.message}")
        }
    }
    
    /**
     * Execute tax document generation
     */
    private fun executeTaxDocumentGeneration(
        sessionId: String,
        userId: String,
        year: Int,
        documentType: String
    ) {
        try {
            // Update status to processing
            updateJobStatus(sessionId, "processing", "Generating tax document...", 10)
            
            // Build Python script arguments
            val args = listOf(
                "generate_tax_document",
                "--user-id", userId,
                "--year", year.toString(),
                "--document-type", documentType
            )
            
            // Execute Python script
            updateJobStatus(sessionId, "processing", "Executing Python script...", 30)
            val result = pythonScriptExecutor.executePythonScript(
                scriptPath = "backend/python-apis/tax-processing/tax_documents.py",
                args = args
            )
            
            // Process result
            updateJobStatus(sessionId, "processing", "Processing results...", 70)
            
            if (result.success) {
                // Store document in parking
                val documentData = result.output.toByteArray()
                documentParking[sessionId] = documentData
                
                updateJobStatus(sessionId, "completed", "Tax document generated successfully", 100)
                println("✅ Tax document generated for session: $sessionId")
            } else {
                updateJobStatus(sessionId, "failed", "Failed to generate tax document: ${result.error}", 0)
                println("❌ Tax document generation failed for session: $sessionId")
            }
            
        } catch (e: Exception) {
            updateJobStatus(sessionId, "failed", "Error: ${e.message}", 0)
            println("❌ Exception in tax document generation: ${e.message}")
        }
    }

    /**
     * Execute legal document generation
     */
    private fun executeLegalDocumentGeneration(
        sessionId: String,
        documentType: String,
        platformFeatures: List<String>,
        legalRequirements: List<String>
    ) {
        try {
            updateJobStatus(sessionId, "processing", "Generating legal document...", 10)
            
            val args = listOf(
                "generate_legal_document",
                "--document-type", documentType,
                "--platform-features", platformFeatures.joinToString(","),
                "--legal-requirements", legalRequirements.joinToString(",")
            )
            
            updateJobStatus(sessionId, "processing", "Executing Python script...", 30)
            val result = pythonScriptExecutor.executePythonScript(
                scriptPath = "backend/python-apis/legal-documents/legal_docs.py",
                args = args
            )
            
            updateJobStatus(sessionId, "processing", "Processing results...", 70)
            
            if (result.success) {
                val documentData = result.output.toByteArray()
                documentParking[sessionId] = documentData
                
                updateJobStatus(sessionId, "completed", "Legal document generated successfully", 100)
                println("✅ Legal document generated for session: $sessionId")
            } else {
                updateJobStatus(sessionId, "failed", "Failed to generate legal document: ${result.error}", 0)
            }
            
        } catch (e: Exception) {
            updateJobStatus(sessionId, "failed", "Error: ${e.message}", 0)
        }
    }

    /**
     * Execute inventory report generation
     */
    private fun executeInventoryReportGeneration(
        sessionId: String,
        includePrices: Boolean,
        organizeBy: String,
        piiLevel: String,
        userRole: String
    ) {
        try {
            updateJobStatus(sessionId, "processing", "Generating inventory report...", 10)
            
            val args = listOf(
                "generate_inventory_report",
                "--include-prices", includePrices.toString(),
                "--organize-by", organizeBy,
                "--pii-level", piiLevel,
                "--user-role", userRole
            )
            
            updateJobStatus(sessionId, "processing", "Executing Python script...", 30)
            val result = pythonScriptExecutor.executePythonScript(
                scriptPath = "backend/python-apis/inventory-reports/inventory_reports.py",
                args = args
            )
            
            updateJobStatus(sessionId, "processing", "Processing results...", 70)
            
            if (result.success) {
                val documentData = result.output.toByteArray()
                documentParking[sessionId] = documentData
                
                updateJobStatus(sessionId, "completed", "Inventory report generated successfully", 100)
                println("✅ Inventory report generated for session: $sessionId")
            } else {
                updateJobStatus(sessionId, "failed", "Failed to generate inventory report: ${result.error}", 0)
            }
            
        } catch (e: Exception) {
            updateJobStatus(sessionId, "failed", "Error: ${e.message}", 0)
        }
    }

    /**
     * Update job status
     */
    private fun updateJobStatus(sessionId: String, status: String, message: String, progress: Int) {
        val job = jobQueue[sessionId]
        if (job != null) {
            job.status = status
            job.message = message
            job.progress = progress
            job.updatedAt = LocalDateTime.now()
            jobQueue[sessionId] = job
        }
    }
}

// Data Classes

data class DocumentJob(
    val jobId: String,
    val sessionId: String,
    val type: String,
    var status: String,
    var message: String? = null,
    var progress: Int,
    val createdAt: LocalDateTime,
    var updatedAt: LocalDateTime? = null
)

data class JobStatus(
    val status: String,
    val message: String,
    val progress: Int
)

