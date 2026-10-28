-- Almacen de embeddings. Separado del PostgreSQL transaccional
-- para poder sustituirlo por Milvus o Pinecone sin tocar el dominio.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS assistant;

COMMENT ON SCHEMA assistant IS
  'Vectores de contexto RAG. El historial de mensajes permanece en PostgreSQL relacional.';
