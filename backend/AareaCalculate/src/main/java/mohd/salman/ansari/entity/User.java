package mohd.salman.ansari.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "email", unique = true, nullable = false)
    private String email;

    /** BCrypt hash — null for Google-only accounts */
    @Column(name = "password_hash")
    private String passwordHash;

    /** Profile picture — Google URL for OAuth users, base64 data URL for uploaded pics */
    @Column(name = "picture_url", columnDefinition = "TEXT")
    private String pictureUrl;

    /** LOCAL = email/password, GOOGLE = OAuth2 */
    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false)
    @Builder.Default
    private Provider provider = Provider.LOCAL;

    @Column(name = "is_verified")
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "is_profile_setup")
    @Builder.Default
    private boolean isProfileSetup = true;

    @Column(name = "is_admin")
    @Builder.Default
    private boolean isAdmin = false;

    @Column(name = "is_suspended")
    @Builder.Default
    private boolean isSuspended = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
