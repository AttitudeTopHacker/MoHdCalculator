package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import mohd.salman.ansari.entity.Provider;
import mohd.salman.ansari.entity.User;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private UUID id;
    private String fullName;
    private String email;
    private Provider provider;
    private boolean verified;
    private boolean profileSetup;
    private boolean hasPassword; // true if user has a password set (even for Google users)
    private String pictureUrl;   // Google profile picture URL (if available)
    private boolean isAdmin;
    private boolean isSuspended;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .provider(user.getProvider())
                .verified(user.isVerified())
                .profileSetup(user.isProfileSetup())
                .hasPassword(user.getPasswordHash() != null)
                .pictureUrl(user.getPictureUrl())
                .isAdmin(user.isAdmin())
                .isSuspended(user.isSuspended())
                .build();
    }
}
