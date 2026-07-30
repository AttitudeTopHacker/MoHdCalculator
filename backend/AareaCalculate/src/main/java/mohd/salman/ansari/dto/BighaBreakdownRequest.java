package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BighaBreakdownRequest {
    @NotNull(message = "areaInSqMetres cannot be null")
    @PositiveOrZero(message = "areaInSqMetres must be positive or zero")
    private Double areaInSqMetres;

    private Double bighaPerAcre;
}
