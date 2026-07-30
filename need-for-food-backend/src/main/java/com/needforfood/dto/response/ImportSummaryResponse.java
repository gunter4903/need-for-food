package com.needforfood.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ImportSummaryResponse {

    private boolean profileUpdated;
    private boolean preferencesImported;
    private int recipesImported;
    private int recipesSkipped;
    private int favoritesImported;
    private int favoritesSkipped;
    private int shoppingListsImported;
    private int shoppingListsSkipped;
}
