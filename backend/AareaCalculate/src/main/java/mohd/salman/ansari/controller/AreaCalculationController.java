package mohd.salman.ansari.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mohd.salman.ansari.dto.*;
import mohd.salman.ansari.service.AreaCalculationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/calculate")
@RequiredArgsConstructor
public class AreaCalculationController {

    private final AreaCalculationService calculationService;

    @PostMapping("/convert")
    public ResponseEntity<ApiResponse<ConvertResponse>> convert(
            @Valid @RequestBody ConvertRequest request) {
        try {
            double result = calculationService.convertArea(
                    request.getValue(), request.getFromUnit(), request.getToUnit(), request.getBighaPerAcre(), request.getBiswaPerBigha());
            return ResponseEntity.ok(ApiResponse.success(
                    "Conversion successful", new ConvertResponse(result)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/triangle-area")
    public ResponseEntity<ApiResponse<TriangleAreaResponse>> triangleArea(
            @Valid @RequestBody TriangleAreaRequest request) {
        try {
            // Under Heron's formula unit conversion is performed by client beforehand
            double area = calculationService.triangleArea(
                    request.getSideA(), request.getSideB(), request.getSideC());
            return ResponseEntity.ok(ApiResponse.success(
                    "Area calculated successfully", new TriangleAreaResponse(area)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/bigha-breakdown")
    public ResponseEntity<ApiResponse<BighaBreakdownResponse>> bighaBreakdown(
            @Valid @RequestBody BighaBreakdownRequest request) {
        try {
            List<Integer> breakdown = calculationService.bighaBiswaBiswansiBreakdown(
                    request.getAreaInSqMetres(), request.getBighaPerAcre(), request.getBiswaPerBigha());
            BighaBreakdownResponse response = new BighaBreakdownResponse(
                    breakdown.get(0), breakdown.get(1), breakdown.get(2));
            return ResponseEntity.ok(ApiResponse.success(
                    "Breakdown computed successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/length-breadth-breakdown")
    public ResponseEntity<ApiResponse<LengthBreadthResponse>> lengthBreadthBreakdown(
            @Valid @RequestBody LengthBreadthRequest request) {
        try {
            int[] breakdown = calculationService.lengthBreadthBreakdown(
                    request.getLength(), request.getBreadth(), request.getBighaPerAcre(), request.getBiswaPerBigha());
            LengthBreadthResponse response = new LengthBreadthResponse(
                    breakdown[0], breakdown[1], breakdown[2], breakdown[3]);
            return ResponseEntity.ok(ApiResponse.success(
                    "Breakdown computed successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/length-convert")
    public ResponseEntity<ApiResponse<LengthConvertResponse>> lengthConvert(
            @Valid @RequestBody LengthConvertRequest request) {
        try {
            double result = calculationService.convertLength(
                    request.getValue(), request.getFromUnit(), request.getToUnit(), request.getGattaInch());
            return ResponseEntity.ok(ApiResponse.success(
                    "Conversion successful", new LengthConvertResponse(result)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
