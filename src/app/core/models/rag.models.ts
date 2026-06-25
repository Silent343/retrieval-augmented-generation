/**
 * @fileoverview Type definitions mirroring the FastAPI backend contract.
 * These describe the JSON exchanged with the RAG API.
 */

/** Returned after a document is ingested. */
export interface IngestResponse {
  /** Stable id assigned to the document. */
  document_id: string;
  /** Original file name. */
  filename: string;
  /** Number of chunks the document was split into. */
  chunks_created: number;
}

/** A document summary as listed by the backend. */
export interface DocumentSummary {
  /** Stable document id. */
  document_id: string;
  /** Original file name. */
  filename: string;
  /** Number of chunks stored for this document. */
  chunks: number;
}

/** A single retrieved chunk that supported an answer. */
export interface SourceChunk {
  /** Id of the source document. */
  document_id: string;
  /** Name of the source document. */
  filename: string;
  /** Position of the chunk within its document. */
  chunk_index: number;
  /** The chunk's text content. */
  text: string;
  /** Similarity score against the question (0–1, higher = closer). */
  score: number;
}

/** The answer to a question plus the sources that grounded it. */
export interface QueryResponse {
  /** The generated answer. */
  answer: string;
  /** The chunks the model was given as context. */
  sources: SourceChunk[];
}

/**
 * A single turn in the conversation view. Modeled on the frontend so the UI
 * can render the user's question and the assistant's grounded answer together.
 */
export interface ConversationTurn {
  /** Unique id for tracking in the template. */
  id: string;
  /** The question the user asked. */
  question: string;
  /** The answer, or `null` while it is still being fetched. */
  answer: string | null;
  /** The sources backing the answer. */
  sources: SourceChunk[];
  /** Whether this turn is still awaiting a response. */
  pending: boolean;
  /** An error message if the request failed, otherwise `null`. */
  error: string | null;
}
