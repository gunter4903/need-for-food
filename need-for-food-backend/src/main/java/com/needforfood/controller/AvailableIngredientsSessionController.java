package com.needforfood.controller;

import com.needforfood.dto.request.AvailableIngredientsSessionRequest;
import com.needforfood.dto.response.AvailableIngredientsSessionResponse;
import com.needforfood.mapper.AvailableIngredientsSessionMapper;
import com.needforfood.mapper.IngredientQuantityMapper;
import com.needforfood.service.AvailableIngredientsSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ingredient-sessions")
@RequiredArgsConstructor
public class AvailableIngredientsSessionController {

    private final AvailableIngredientsSessionService sessionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AvailableIngredientsSessionResponse save(@AuthenticationPrincipal Long userId,
                                                      @Valid @RequestBody AvailableIngredientsSessionRequest request) {
        return AvailableIngredientsSessionMapper.toResponse(
                sessionService.save(userId, IngredientQuantityMapper.toDocuments(request.getIngredients())));
    }

    @GetMapping("/mine")
    public List<AvailableIngredientsSessionResponse> getMine(@AuthenticationPrincipal Long userId) {
        return sessionService.getHistory(userId).stream()
                .map(AvailableIngredientsSessionMapper::toResponse)
                .toList();
    }
}
