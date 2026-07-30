package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConvertRequest {
    @NotNull(message = "Value cannot be null")
    private Double value;

    @NotNull(message = "fromUnit cannot be null")
    private String fromUnit;

    @NotNull(message = "toUnit cannot be null")
    private String toUnit;

    private Double bighaPerAcre;
}
