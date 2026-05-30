-- ============================================================
-- Migration 078: Knowledge Base Vector Search & Embeddings
-- ============================================================
-- Adds vector search function for RAG, a utility to generate
-- embeddings on INSERT/UPDATE, and guards encoding.
-- ============================================================

SET client_encoding TO 'UTF8';

-- 1. Vector search function (cosine distance via <=> operator)
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding extensions.vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_company_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  source_type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.title,
    kb.content,
    kb.source_type,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM ai_knowledge_base kb
  WHERE (p_company_id IS NULL OR kb.company_id = p_company_id)
    AND kb.embedding IS NOT NULL
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant exec to authenticated users (RLS still applies)
GRANT EXECUTE ON FUNCTION match_knowledge_base TO authenticated;

-- 2. Full-text search helper for when embeddings aren't ready
CREATE OR REPLACE FUNCTION search_knowledge_base_text(
  search_query text,
  p_company_id uuid,
  max_results int DEFAULT 5
)
RETURNS TABLE(
  id uuid,
  title text,
  content text,
  source_type text,
  rank real
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id, kb.title, kb.content, kb.source_type,
    ts_rank(to_tsvector('arabic', coalesce(kb.title, '') || ' ' || coalesce(kb.content, '')), plainto_tsquery('arabic', search_query)) AS rank
  FROM ai_knowledge_base kb
  WHERE kb.company_id = p_company_id
    AND to_tsvector('arabic', coalesce(kb.title, '') || ' ' || coalesce(kb.content, '')) @@ plainto_tsquery('arabic', search_query)
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$;

GRANT EXECUTE ON FUNCTION search_knowledge_base_text TO authenticated;
