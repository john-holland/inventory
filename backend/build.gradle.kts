plugins {
    kotlin("jvm") version "1.9.0"
    kotlin("plugin.serialization") version "1.9.0"
    id("org.springframework.boot") version "3.1.0"
    id("io.spring.dependency-management") version "1.1.0"
}

repositories {
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(20))
    }
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "20"
    }
}

tasks.withType<JavaCompile> {
    options.release.set(20)
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    
    // Spring Boot
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    
    // Servlet API
    implementation("jakarta.servlet:jakarta.servlet-api:6.0.0")
    
    // Jersey
    implementation("org.glassfish.jersey.containers:jersey-container-servlet:3.1.1")
    implementation("org.glassfish.jersey.inject:jersey-hk2:3.1.1")
    implementation("org.glassfish.jersey.media:jersey-media-json-jackson:3.1.1")
    
    // Ethereum
    implementation("org.web3j:core:4.9.8")
    
    // Database
    implementation("org.jetbrains.exposed:exposed-core:0.44.0")
    implementation("org.jetbrains.exposed:exposed-dao:0.44.0")
    implementation("org.jetbrains.exposed:exposed-jdbc:0.44.0")
    implementation("org.postgresql:postgresql:42.6.0")
    implementation("com.h2database:h2")
    
    // Logging
    implementation("ch.qos.logback:logback-classic:1.4.11")
    
    // Testing
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("org.glassfish.jersey.test-framework:jersey-test-framework-core:3.1.1")
    testImplementation("org.glassfish.jersey.test-framework.providers:jersey-test-framework-provider-grizzly2:3.1.1")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
} 