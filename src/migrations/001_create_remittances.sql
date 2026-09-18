-- Legacy Vault x Pollar bridge: remittances table
-- Tracks a beneficiary's claim from the moment the Starknet event fires
-- through Stellar settlement to the Pollar SEP-24 off-ramp.

CREATE TABLE IF NOT EXISTS remittances (
    remittance_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity / linkage
    beneficiary_identifier  TEXT NOT NULL,        -- hashed email or internal user UUID from the contract
    owner_address           TEXT,                 -- Starknet address of the vault owner (from event)
    beneficiary_stellar_public_key TEXT,          -- destination for the real Stellar payout (set before settlement)

    -- Chain references
    starknet_tx_hash        TEXT,
    stellar_tx_hash         TEXT,
    sep24_id                TEXT,

    -- Amounts
    amount_usdc             NUMERIC(20, 7),        -- amount claimed on Starknet / paid out on Stellar

    -- State machine:
    -- VAULT_FUNDED -> STARKNET_CLAIMED -> STELLAR_SUBMITTED -> STELLAR_CONFIRMED -> COMPLETED
    -- (or -> FAILED at any point)
    status                  TEXT NOT NULL DEFAULT 'VAULT_FUNDED'
                             CHECK (status IN (
                               'VAULT_FUNDED',
                               'STARKNET_CLAIMED',
                               'STELLAR_SUBMITTED',
                               'STELLAR_CONFIRMED',
                               'COMPLETED',
                               'FAILED'
                             )),
    failure_reason           TEXT,

    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_remittances_beneficiary ON remittances (beneficiary_identifier);
CREATE INDEX IF NOT EXISTS idx_remittances_owner ON remittances (owner_address);
CREATE INDEX IF NOT EXISTS idx_remittances_status ON remittances (status);

-- Keep updated_at fresh on every write
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_remittances_updated_at ON remittances;
CREATE TRIGGER trg_remittances_updated_at
BEFORE UPDATE ON remittances
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
