-- 002_create_enums.sql
-- PostgreSQL native ENUMs (NOT VARCHAR + CHECK)
-- supabase gen types will produce TypeScript union types from these

CREATE TYPE classification_result AS ENUM ('A_VOIR', 'FILTRE', 'BLOQUE');
CREATE TYPE queue_status AS ENUM ('pending', 'processing', 'completed', 'failed');
