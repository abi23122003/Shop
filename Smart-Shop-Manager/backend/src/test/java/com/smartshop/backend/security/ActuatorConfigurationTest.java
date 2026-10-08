package com.smartshop.backend.security;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

class ActuatorConfigurationTest {

    @Test
    void exposesOnlySafeActuatorEndpoints() throws Exception {
        String properties = StreamUtils.copyToString(
                new ClassPathResource("application.properties").getInputStream(),
                StandardCharsets.UTF_8);

        assertTrue(properties.contains(
                "management.endpoints.web.exposure.include=health,info,metrics"));
        assertTrue(properties.contains("management.endpoint.health.show-details=never"));
        assertTrue(properties.contains("management.info.env.enabled=false"));
    }

    @Test
    void enablesKubernetesStyleHealthProbes() throws Exception {
        String properties = StreamUtils.copyToString(
                new ClassPathResource("application.properties").getInputStream(),
                StandardCharsets.UTF_8);

        assertTrue(properties.contains("management.endpoint.health.probes.enabled=true"));
    }
}
