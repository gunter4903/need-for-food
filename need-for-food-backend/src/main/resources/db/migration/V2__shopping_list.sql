CREATE TABLE shopping_list (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopping_list_user_id ON shopping_list (user_id);

CREATE TABLE shopping_list_item (
    shopping_list_id BIGINT NOT NULL REFERENCES shopping_list (id) ON DELETE CASCADE,
    ingredient_id    BIGINT NOT NULL REFERENCES ingredient (id) ON DELETE CASCADE,
    quantity         REAL NOT NULL,
    checked          BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (shopping_list_id, ingredient_id)
);

CREATE INDEX idx_shopping_list_item_ingredient_id ON shopping_list_item (ingredient_id);
