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

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .provider(user.getProvider())
                .verified(user.isVerified())
                .profileSetup(user.isProfileSetup())
                .build();
    }
}
