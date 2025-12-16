# Database Migrations

This directory contains database migration scripts for schema changes.

## Running Migrations

### Add Diagrams Column to Chat Messages

To add the `diagrams` column to the `chat_messages` table:

```bash
cd backend
python migrations/add_diagrams_to_chat_messages.py
```

This migration:
- Adds a `diagrams` JSON column to the `chat_messages` table
- The column is nullable and positioned after the `sources` column
- Safe to run multiple times (checks if column exists before adding)

## Migration Details

### add_diagrams_to_chat_messages.py

**Purpose**: Store diagram URLs and metadata in the database so they persist after page refresh.

**Changes**:
- Adds `diagrams` JSON column to `chat_messages` table
- Allows storing diagram presigned URLs (with 1-month expiration) in the database
- Enables diagrams to be displayed when loading chat history

**Before running**: Ensure MySQL is running and `DATABASE_URL` is correctly configured in `.env`.

