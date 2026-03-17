/*
  # Android Helmet Intercom Project Reference

  1. New Tables
    - `project_versions`
      - `id` (uuid, primary key)
      - `version` (text) - version label e.g. "1.0.0"
      - `description` (text) - short description
      - `created_at` (timestamptz)
    - `project_files`
      - `id` (uuid, primary key)
      - `version_id` (uuid, fk to project_versions)
      - `file_path` (text) - full path like "app/src/main/java/.../MainActivity.java"
      - `file_name` (text) - just the filename
      - `language` (text) - "java", "cpp", "xml", "gradle", "cmake", "text"
      - `content` (text) - full file content
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access (reference app, no auth needed)
    - No write access from client (data seeded via migration)
*/

CREATE TABLE IF NOT EXISTS project_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES project_versions(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  language text NOT NULL DEFAULT 'text',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read project versions"
  ON project_versions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read project files"
  ON project_files FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_project_files_version_id ON project_files(version_id);
CREATE INDEX IF NOT EXISTS idx_project_files_file_path ON project_files(file_path);
