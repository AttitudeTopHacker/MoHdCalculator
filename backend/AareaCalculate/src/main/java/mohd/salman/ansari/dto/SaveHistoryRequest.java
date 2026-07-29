package mohd.salman.ansari.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SaveHistoryRequest {

    @NotBlank(message = "Calculation type is required")
    private String calculationType;

    @NotBlank(message = "Input data is required")
    private String inputData;

    @NotBlank(message = "Result data is required")
    private String resultData;
}
