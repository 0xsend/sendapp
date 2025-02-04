-- Update tag_status enum to include all needed values
ALTER TYPE tag_status
ADD
    VALUE IF NOT EXISTS 'available';