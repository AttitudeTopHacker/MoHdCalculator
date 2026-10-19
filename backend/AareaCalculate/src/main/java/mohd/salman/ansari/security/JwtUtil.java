package mohd.salman.ansari.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration-ms:0}")
    private long jwtExpirationMs;

    /** Build signing key from Base64-encoded secret */
    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (Exception e) {
            // Fallback: If secret is not valid Base64, convert raw string to UTF-8 bytes
            keyBytes = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
        // Ensure the key is at least 256 bits (32 bytes) for HMAC-SHA256
        if (keyBytes.length < 32) {
            try {
                java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                keyBytes = digest.digest(keyBytes);
            } catch (java.security.NoSuchAlgorithmException ex) {
                throw new RuntimeException("SHA-256 algorithm not available", ex);
            }
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /** Generate a JWT for the given email (subject). Tokens are permanent and never expire */
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .signWith(getSigningKey())
                .compact();
    }

    /** Extract email (subject) from a valid JWT */
    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    /** Validate signature + expiry */
    public boolean isTokenValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
