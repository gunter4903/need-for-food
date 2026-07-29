CREATE TABLE recipe_image (
    id          BIGSERIAL PRIMARY KEY,
    recipe_id   BIGINT NOT NULL REFERENCES recipe(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    position    INTEGER NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_recipe_image_recipe_id ON recipe_image(recipe_id);

ALTER TABLE recipe DROP COLUMN image_url;
