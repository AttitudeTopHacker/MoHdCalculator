package mohd.salman.ansari.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mohd.salman.ansari.dto.ApiResponse;
import mohd.salman.ansari.dto.CalculationHistoryDto;
import mohd.salman.ansari.dto.SaveHistoryRequest;
import mohd.salman.ansari.service.CalculationHistoryService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calculate/history")
@RequiredArgsConstructor
public class CalculationHistoryController {

    private final CalculationHistoryService historyService;

    @PostMapping
    public ResponseEntity<ApiResponse<CalculationHistoryDto>> saveHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody SaveHistoryRequest request) {
        CalculationHistoryDto saved = historyService.saveHistory(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("History saved successfully", saved));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CalculationHistoryDto>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<CalculationHistoryDto> history = historyService.getHistory(userDetails.getUsername(), page, size);
        return ResponseEntity.ok(ApiResponse.success("History fetched successfully", history));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHistoryItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        historyService.deleteHistoryItem(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("History item deleted successfully", null));
    }
}
