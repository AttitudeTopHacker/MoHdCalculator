package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LengthBreadthRequest {
    @NotNull(message = "length cannot be null")
    @PositiveOrZero(message = "length must be positive or zero")
    private Double length;

    @NotNull(message = "breadth cannot be null")
    @PositiveOrZero(message = "breadth must be positive or zero")
    private Double breadth;

    private Double bighaPerAcre;
    private Double gattaInch;
}
