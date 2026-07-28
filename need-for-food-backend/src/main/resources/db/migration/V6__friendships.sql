CREATE TABLE friendship (
    id             BIGSERIAL PRIMARY KEY,
    requester_id   BIGINT      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    addressee_id   BIGINT      NOT NULL REFERENCES app_user (id) ON DELETE CASCADE,
    status         VARCHAR(20) NOT NULL,
    created_at     TIMESTAMP   NOT NULL,
    responded_at   TIMESTAMP,
    CONSTRAINT uq_friendship_pair UNIQUE (requester_id, addressee_id),
    CONSTRAINT chk_friendship_not_self CHECK (requester_id <> addressee_id)
);

CREATE INDEX idx_friendship_requester ON friendship (requester_id);
CREATE INDEX idx_friendship_addressee ON friendship (addressee_id);
