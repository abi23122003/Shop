package com.smartshop.backend.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private SecretKey key;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured.");
        }
        String normalizedSecret = jwtSecret.trim();
        if (normalizedSecret.contains("REPLACE_WITH")
                || normalizedSecret.contains("replace-with")
                || normalizedSecret.equalsIgnoreCase("changeme")
                || normalizedSecret.equalsIgnoreCase("default-secret")) {
            throw new IllegalStateException("JWT secret must be replaced with a unique production secret.");
        }
        byte[] keyBytes = normalizedSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException("Configured JWT secret is too short: must be at least 256 bits (32 bytes).");
        }
        if (jwtExpirationMs < 300_000L || jwtExpirationMs > 604_800_000L) {
            throw new IllegalStateException("JWT expiration must be between 5 minutes and 7 days.");
        }
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    // Generate JWT Token
    public String generateToken(String username) {
        return generateToken(username, null);
    }

    public String generateToken(String username, String passwordHash) {
        var builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs));

        if (passwordHash != null && !passwordHash.isEmpty()) {
            builder.claim("pwd", passwordHash.substring(0, Math.min(16, passwordHash.length())));
        }

        return builder.signWith(key).compact();
    }

    // Extract username from JWT
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extract expiration date
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Generic claim extractor
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claimsResolver.apply(claims);
    }

    // Check if token expired
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Validate token
    public boolean validateToken(String token, String username) {
        return validateToken(token, username, null);
    }

    public boolean validateToken(String token, String username, String currentPasswordHash) {
        try {
            String extractedUsername = extractUsername(token);
            if (!extractedUsername.equals(username) || isTokenExpired(token)) {
                return false;
            }

            if (currentPasswordHash != null && !currentPasswordHash.isEmpty()) {
                String tokenPwd = extractClaim(token, claims -> claims.get("pwd", String.class));
                if (tokenPwd != null) {
                    String expected = currentPasswordHash.substring(0, Math.min(16, currentPasswordHash.length()));
                    if (!expected.equals(tokenPwd)) {
                        return false;
                    }
                }
            }
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}