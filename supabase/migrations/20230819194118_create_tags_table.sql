-- Enum type for tag status
CREATE TYPE public.tag_status AS ENUM('pending', 'confirmed');

-- Create tags table with constraints on the name, status, user_id, and a timestamp
CREATE TABLE public.tags (
    name citext PRIMARY KEY CHECK (
        LENGTH(name) BETWEEN 1 AND 20
        AND name ~ '^[A-Za-z0-9_]+$'
    ),
    status public.tag_status NOT NULL DEFAULT 'pending'::public.tag_status,
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Creating an index on the user_id column to optimize queries that filter or join on this column.
CREATE INDEX tags_user_id_idx ON public.tags(user_id);
