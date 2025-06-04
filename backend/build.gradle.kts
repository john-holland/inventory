plugins {
    kotlin("jvm") version "1.9.0"
    kotlin("plugin.serialization") version "1.9.0"
    id("org.gretty") version "4.0.3"
    war
}

repositories {
    mavenCentral()
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}

tasks.withType<org.jetbrains.kotlin.gradle.tasks.KotlinCompile> {
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("org.jetbrains.kotlin:kotlin-stdlib")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
    
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
    
    // Logging
    implementation("ch.qos.logback:logback-classic:1.4.11")
    
    // Testing
    testImplementation("org.jetbrains.kotlin:kotlin-test")
    testImplementation("org.glassfish.jersey.test-framework:jersey-test-framework-core:3.1.1")
    testImplementation("org.glassfish.jersey.test-framework.providers:jersey-test-framework-provider-grizzly2:3.1.1")
}

gretty {
    servletContainer = "tomcat10"
    contextPath = "/api"
} 