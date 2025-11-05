package com.inventory.api.controller

import com.inventory.api.service.DocumentJobQueueService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import jakarta.servlet.http.HttpSession
import java.util.UUID

/**
 * Document Generation Controller
 * REST API for triggering document generation with async job queue
 */
@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = ["http://localhost:3000"])
class DocumentController(
    private val documentJobQueueService: DocumentJobQueueService
) {

    /**
     * Generate tax documents (W2, 1099-C, investment gains/losses)
     * POST /api/documents/tax/generate
     */
    @PostMapping("/tax/generate")
    fun generateTaxDocument(
        @RequestBody request: TaxDocumentRequest,
        session: HttpSession
    ): ResponseEntity<DocumentJobResponse> {
        
        // Create session ID for tracking
        val sessionId = UUID.randomUUID().toString()
        session.setAttribute("document_session_$sessionId", sessionId)
        
        // Queue the document generation job
        val jobId = documentJobQueueService.queueTaxDocumentGeneration(
            userId = request.userId,
            year = request.year,
            documentType = request.documentType,
            sessionId = sessionId
        )
        
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(
            DocumentJobResponse(
                sessionId = sessionId,
                jobId = jobId,
                status = "queued",
                message = "Tax document generation queued. Use session ID to check status.",
                estimatedCompletionSeconds = 30
            )
        )
    }

    /**
     * Generate legal documents (ToS, Mission Statement, Privacy Policy)
     * POST /api/documents/legal/generate
     */
    @PostMapping("/legal/generate")
    fun generateLegalDocument(
        @RequestBody request: LegalDocumentRequest,
        session: HttpSession
    ): ResponseEntity<DocumentJobResponse> {
        
        val sessionId = UUID.randomUUID().toString()
        session.setAttribute("document_session_$sessionId", sessionId)
        
        val jobId = documentJobQueueService.queueLegalDocumentGeneration(
            documentType = request.documentType,
            platformFeatures = request.platformFeatures,
            legalRequirements = request.legalRequirements,
            sessionId = sessionId
        )
        
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(
            DocumentJobResponse(
                sessionId = sessionId,
                jobId = jobId,
                status = "queued",
                message = "Legal document generation queued. Use session ID to check status.",
                estimatedCompletionSeconds = 20
            )
        )
    }

    /**
     * Generate inventory reports
     * POST /api/documents/inventory/generate
     */
    @PostMapping("/inventory/generate")
    fun generateInventoryReport(
        @RequestBody request: InventoryReportRequest,
        session: HttpSession
    ): ResponseEntity<DocumentJobResponse> {
        
        val sessionId = UUID.randomUUID().toString()
        session.setAttribute("document_session_$sessionId", sessionId)
        
        val jobId = documentJobQueueService.queueInventoryReportGeneration(
            includePrices = request.includePrices,
            organizeBy = request.organizeBy,
            piiLevel = request.piiLevel,
            userRole = request.userRole,
            sessionId = sessionId
        )
        
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(
            DocumentJobResponse(
                sessionId = sessionId,
                jobId = jobId,
                status = "queued",
                message = "Inventory report generation queued. Use session ID to check status.",
                estimatedCompletionSeconds = 25
            )
        )
    }

    /**
     * Check document generation status with exponential backoff
     * GET /api/documents/status/{sessionId}
     */
    @GetMapping("/status/{sessionId}")
    fun checkDocumentStatus(
        @PathVariable sessionId: String,
        @RequestParam(defaultValue = "0") attempt: Int,
        session: HttpSession
    ): ResponseEntity<DocumentStatusResponse> {
        
        // Verify session ownership
        val storedSessionId = session.getAttribute("document_session_$sessionId")
        if (storedSessionId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                DocumentStatusResponse(
                    status = "error",
                    message = "Invalid or expired session",
                    progress = 0,
                    backoffSeconds = null
                )
            )
        }
        
        // Get job status
        val jobStatus = documentJobQueueService.getJobStatus(sessionId)
        
        // Calculate exponential backoff
        val backoffSeconds = when {
            jobStatus.status == "completed" -> null
            jobStatus.status == "failed" -> null
            attempt < 5 -> 2 // 2 seconds for first 5 attempts
            attempt < 10 -> 5 // 5 seconds for next 5 attempts
            else -> 10 // 10 seconds thereafter
        }
        
        return ResponseEntity.ok(
            DocumentStatusResponse(
                status = jobStatus.status,
                message = jobStatus.message,
                progress = jobStatus.progress,
                backoffSeconds = backoffSeconds,
                documentReady = jobStatus.status == "completed"
            )
        )
    }

    /**
     * Download completed document
     * GET /api/documents/download/{sessionId}
     */
    @GetMapping("/download/{sessionId}")
    fun downloadDocument(
        @PathVariable sessionId: String,
        session: HttpSession
    ): ResponseEntity<ByteArray> {
        
        // Verify session ownership
        val storedSessionId = session.getAttribute("document_session_$sessionId")
        if (storedSessionId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        }
        
        // Get document data
        val documentData = documentJobQueueService.getDocumentData(sessionId)
        
        if (documentData == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
        
        // Clear session after download
        session.removeAttribute("document_session_$sessionId")
        documentJobQueueService.clearDocumentParking(sessionId)
        
        return ResponseEntity.ok()
            .header("Content-Type", "application/pdf")
            .header("Content-Disposition", "attachment; filename=\"document_$sessionId.pdf\"")
            .body(documentData)
    }

    /**
     * Cancel document generation job
     * DELETE /api/documents/cancel/{sessionId}
     */
    @DeleteMapping("/cancel/{sessionId}")
    fun cancelDocumentGeneration(
        @PathVariable sessionId: String,
        session: HttpSession
    ): ResponseEntity<Map<String, String>> {
        
        val storedSessionId = session.getAttribute("document_session_$sessionId")
        if (storedSessionId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build()
        }
        
        val cancelled = documentJobQueueService.cancelJob(sessionId)
        
        if (cancelled) {
            session.removeAttribute("document_session_$sessionId")
            return ResponseEntity.ok(mapOf("message" to "Job cancelled successfully"))
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(mapOf("message" to "Job could not be cancelled"))
    }
}

// Request/Response Data Classes

data class TaxDocumentRequest(
    val userId: String,
    val year: Int,
    val documentType: String // "w2", "1099c", "investment_gains_losses"
)

data class LegalDocumentRequest(
    val documentType: String, // "terms_of_service", "mission_statement", "privacy_policy"
    val platformFeatures: List<String>,
    val legalRequirements: List<String>
)

data class InventoryReportRequest(
    val includePrices: Boolean,
    val organizeBy: String, // "category", "size", "location"
    val piiLevel: String, // "none", "partial", "full"
    val userRole: String // "customer", "csr", "employee"
)

data class DocumentJobResponse(
    val sessionId: String,
    val jobId: String,
    val status: String,
    val message: String,
    val estimatedCompletionSeconds: Int
)

data class DocumentStatusResponse(
    val status: String, // "queued", "processing", "completed", "failed"
    val message: String,
    val progress: Int, // 0-100
    val backoffSeconds: Int?,
    val documentReady: Boolean = false
)

