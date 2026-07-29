CREATE TABLE recipe_favorite (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    recipe_id   BIGINT NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_recipe_favorite UNIQUE (user_id, recipe_id)
);

CREATE INDEX idx_recipe_favorite_user ON recipe_favorite (user_id);
CREATE INDEX idx_recipe_favorite_recipe ON recipe_favorite (recipe_id);
