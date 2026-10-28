-- Un schema por bounded context. Facilita extraer un modulo a su propia base.
-- Aqui solo vive dato estructurado. Binarios van a object storage.
-- Embeddings van a la base vectorial, no a este motor.

CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS booking;
CREATE SCHEMA IF NOT EXISTS scheduling;
CREATE SCHEMA IF NOT EXISTS payments;
CREATE SCHEMA IF NOT EXISTS clinical;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS loyalty;
CREATE SCHEMA IF NOT EXISTS presence;
CREATE SCHEMA IF NOT EXISTS reporting;
CREATE SCHEMA IF NOT EXISTS assistant;

COMMENT ON SCHEMA clinical IS
  'Metadatos de expediente (alergias, historial, consentimiento). El archivo binario vive en object storage; aqui solo la object key.';

COMMENT ON SCHEMA assistant IS
  'Historial relacional de chats (mensajes y usuarios). Embeddings y contexto RAG viven en la base vectorial.';

COMMENT ON SCHEMA catalog IS
  'Servicios, precios, duracion y metadatos de galeria. Las imagenes viven en object storage.';
