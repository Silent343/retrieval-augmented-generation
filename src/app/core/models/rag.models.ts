/** Type definitions mirroring the FastAPI backend contract. */

export interface IngestResponse {
  document_id: string;
  filename: string;
  chunks_created: number;
  already_indexed: boolean;
}

export interface DocumentSummary {
  document_id: string;
  filename: string;
  chunks: number;
}

export interface SourceChunk {
  document_id: string;
  filename: string;
  chunk_index: number;
  page_number: number | null;
  text: string;
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
}

export interface ConversationTurn {
  id: string;
  question: string;
  answer: string | null;
  sources: SourceChunk[];
  pending: boolean;
  error: string | null;
}
