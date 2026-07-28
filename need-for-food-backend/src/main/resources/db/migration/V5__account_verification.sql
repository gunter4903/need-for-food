ALTER TABLE app_user
    ADD COLUMN verified                     BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN verification_code            VARCHAR(6),
    ADD COLUMN verification_code_expires_at TIMESTAMP;
