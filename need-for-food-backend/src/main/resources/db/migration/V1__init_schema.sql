-- Coeur métier : utilisateurs, recettes, ingrédients, étapes de préparation

CREATE TABLE app_user (
    id            BIGSERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username      VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE ingredient (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL
);

CREATE TABLE recipe (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    type              VARCHAR(100),
    diet              VARCHAR(100),
    preparation_time  INTEGER,
    created_at        TIMESTAMP NOT NULL DEFAULT now(),
    user_id           BIGINT NOT NULL REFERENCES app_user (id) ON DELETE CASCADE
);

CREATE INDEX idx_recipe_user_id ON recipe (user_id);

CREATE TABLE recipe_ingredient (
    recipe_id     BIGINT NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES ingredient (id) ON DELETE CASCADE,
    quantity      REAL NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id)
);

CREATE INDEX idx_recipe_ingredient_ingredient_id ON recipe_ingredient (ingredient_id);

CREATE TABLE preparation_step (
    id           BIGSERIAL PRIMARY KEY,
    recipe_id    BIGINT NOT NULL REFERENCES recipe (id) ON DELETE CASCADE,
    step_number  INTEGER NOT NULL,
    description  TEXT NOT NULL,
    UNIQUE (recipe_id, step_number)
);
