package com.needforfood.mapper;

import com.needforfood.dto.request.IngredientQuantityRequest;
import com.needforfood.dto.response.IngredientQuantityResponse;
import com.needforfood.model.document.IngredientQuantity;

import java.util.List;

public final class IngredientQuantityMapper {

    private IngredientQuantityMapper() {
    }

    public static IngredientQuantity toDocument(IngredientQuantityRequest request) {
        return IngredientQuantity.builder()
                .name(request.getName())
                .quantity(request.getQuantity())
                .unit(request.getUnit())
                .build();
    }

    public static List<IngredientQuantity> toDocuments(List<IngredientQuantityRequest> requests) {
        return requests.stream().map(IngredientQuantityMapper::toDocument).toList();
    }

    public static IngredientQuantityResponse toResponse(IngredientQuantity document) {
        return new IngredientQuantityResponse(document.getName(), document.getQuantity(), document.getUnit());
    }

    public static List<IngredientQuantityResponse> toResponses(List<IngredientQuantity> documents) {
        return documents.stream().map(IngredientQuantityMapper::toResponse).toList();
    }
}
