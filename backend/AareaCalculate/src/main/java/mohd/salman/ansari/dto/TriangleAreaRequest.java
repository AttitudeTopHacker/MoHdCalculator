package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TriangleAreaRequest {
    @NotNull(message = "sideA cannot be null")
    @Positive(message = "sideA must be positive")
    private Double sideA;

    @NotNull(message = "sideB cannot be null")
    @Positive(message = "sideB must be positive")
    private Double sideB;

    @NotNull(message = "sideC cannot be null")
    @Positive(message = "sideC must be positive")
    private Double sideC;

    private Double gattaInch;
}
