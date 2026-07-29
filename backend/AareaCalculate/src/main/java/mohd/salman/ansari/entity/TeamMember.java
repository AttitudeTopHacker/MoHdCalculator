package mohd.salman.ansari.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "team_members")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "about", columnDefinition = "TEXT")
    private String about;

    @Column(name = "picture_url", columnDefinition = "TEXT")
    private String pictureUrl; // Store base64 or URL

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
