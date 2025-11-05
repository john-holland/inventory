package com.inventory.api.service

import org.springframework.stereotype.Service
import java.io.BufferedReader
import java.io.InputStreamReader
import java.util.concurrent.TimeUnit

/**
 * Python Script Executor
 * Executes Python scripts via ProcessBuilder with output capture and error handling
 */
@Service
class PythonScriptExecutor {

    private val pythonCommand = "python3" // or "python" depending on system
    private val baseDirectory = System.getProperty("user.dir")

    /**
     * Execute Python script with arguments
     */
    fun executePythonScript(scriptPath: String, args: List<String>): ScriptExecutionResult {
        try {
            println("🐍 Executing Python script: $scriptPath")
            println("   Args: $args")
            
            // Build command
            val command = mutableListOf(pythonCommand, scriptPath)
            command.addAll(args)
            
            // Create process builder
            val processBuilder = ProcessBuilder(command)
            processBuilder.directory(java.io.File(baseDirectory))
            processBuilder.redirectErrorStream(true)
            
            // Start process
            val process = processBuilder.start()
            
            // Capture output
            val output = StringBuilder()
            val errorOutput = StringBuilder()
            
            // Read stdout
            BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    output.appendLine(line)
                    println("   Python: $line")
                }
            }
            
            // Wait for process to complete (with timeout)
            val completed = process.waitFor(60, TimeUnit.SECONDS)
            
            if (!completed) {
                process.destroyForcibly()
                return ScriptExecutionResult(
                    success = false,
                    output = "",
                    error = "Script execution timed out after 60 seconds",
                    exitCode = -1
                )
            }
            
            val exitCode = process.exitValue()
            
            return if (exitCode == 0) {
                println("✅ Python script executed successfully")
                ScriptExecutionResult(
                    success = true,
                    output = output.toString(),
                    error = null,
                    exitCode = exitCode
                )
            } else {
                println("❌ Python script failed with exit code: $exitCode")
                ScriptExecutionResult(
                    success = false,
                    output = output.toString(),
                    error = "Script exited with code $exitCode",
                    exitCode = exitCode
                )
            }
            
        } catch (e: Exception) {
            println("❌ Exception executing Python script: ${e.message}")
            e.printStackTrace()
            
            return ScriptExecutionResult(
                success = false,
                output = "",
                error = "Exception: ${e.message}",
                exitCode = -1
            )
        }
    }

    /**
     * Execute Python script asynchronously (returns immediately)
     */
    fun executePythonScriptAsync(
        scriptPath: String,
        args: List<String>,
        callback: (ScriptExecutionResult) -> Unit
    ) {
        Thread {
            val result = executePythonScript(scriptPath, args)
            callback(result)
        }.start()
    }

    /**
     * Check if Python is available
     */
    fun isPythonAvailable(): Boolean {
        return try {
            val process = ProcessBuilder(pythonCommand, "--version").start()
            process.waitFor(5, TimeUnit.SECONDS)
            process.exitValue() == 0
        } catch (e: Exception) {
            false
        }
    }

    /**
     * Get Python version
     */
    fun getPythonVersion(): String? {
        return try {
            val process = ProcessBuilder(pythonCommand, "--version").start()
            val output = BufferedReader(InputStreamReader(process.inputStream)).use { it.readText() }
            process.waitFor(5, TimeUnit.SECONDS)
            output.trim()
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Install Python dependencies
     */
    fun installPythonDependencies(requirementsPath: String): ScriptExecutionResult {
        println("📦 Installing Python dependencies from: $requirementsPath")
        
        return try {
            val command = listOf(pythonCommand, "-m", "pip", "install", "-r", requirementsPath)
            val processBuilder = ProcessBuilder(command)
            processBuilder.directory(java.io.File(baseDirectory))
            processBuilder.redirectErrorStream(true)
            
            val process = processBuilder.start()
            
            val output = StringBuilder()
            BufferedReader(InputStreamReader(process.inputStream)).use { reader ->
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    output.appendLine(line)
                    println("   pip: $line")
                }
            }
            
            val completed = process.waitFor(300, TimeUnit.SECONDS) // 5 minutes timeout
            
            if (!completed) {
                process.destroyForcibly()
                ScriptExecutionResult(
                    success = false,
                    output = "",
                    error = "Dependency installation timed out",
                    exitCode = -1
                )
            } else {
                val exitCode = process.exitValue()
                ScriptExecutionResult(
                    success = exitCode == 0,
                    output = output.toString(),
                    error = if (exitCode != 0) "Installation failed with exit code $exitCode" else null,
                    exitCode = exitCode
                )
            }
        } catch (e: Exception) {
            ScriptExecutionResult(
                success = false,
                output = "",
                error = "Exception: ${e.message}",
                exitCode = -1
            )
        }
    }
}

/**
 * Script execution result
 */
data class ScriptExecutionResult(
    val success: Boolean,
    val output: String,
    val error: String?,
    val exitCode: Int
)

