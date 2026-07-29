package mohd.salman.ansari.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalculationHistoryDto {
    private UUID id;
    private String calculationType;
    private String inputData;
    private String resultData;
    private Instant createdAt;
}
