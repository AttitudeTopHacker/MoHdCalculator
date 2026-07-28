package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String fullName;
    private String currentPassword;
    private String newPassword;
    private String confirmNewPassword;
    private String pictureUrl; // base64 data URL or null to keep existing
}
