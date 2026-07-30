package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NativeGoogleLoginRequest {
    @NotBlank(message = "idToken cannot be blank")
    private String idToken;
}
