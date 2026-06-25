/**
 * @fileoverview Signals-based store for the knowledge base screen. Coordinates
 * the API service and exposes reactive state to the components, keeping them
 * free of HTTP and orchestration concerns.
 */

import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RagApiService } from './rag-api.service';
import {
  ConversationTurn,
  DocumentSummary,
} from '../models/rag.models';

/**
 * Reactive store backing the knowledge-base feature.
 */
@Injectable({ providedIn: 'root' })
export class KnowledgeBaseStore {
  private readonly api = inject(RagApiService);

  // ── Private writable state ────────────────────────────────────────────────
  private readonly _documents = signal<DocumentSummary[]>([]);
  private readonly _turns = signal<ConversationTurn[]>([]);
  private readonly _uploading = signal<boolean>(false);
  private readonly _loadingDocs = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // ── Public read-only signals ──────────────────────────────────────────────

  /** The documents currently in the knowledge base. */
  public readonly documents = this._documents.asReadonly();
  /** The conversation turns, oldest first. */
  public readonly turns = this._turns.asReadonly();
  /** Whether an upload is in progress. */
  public readonly uploading = this._uploading.asReadonly();
  /** Whether the document list is loading. */
  public readonly loadingDocs = this._loadingDocs.asReadonly();
  /** The last error message, or `null`. */
  public readonly error = this._error.asReadonly();

  /** Whether the knowledge base has at least one document. */
  public readonly hasDocuments = computed(() => this._documents().length > 0);
  /** Total number of chunks across all documents. */
  public readonly totalChunks = computed(() =>
    this._documents().reduce((sum, doc) => sum + doc.chunks, 0),
  );

  // ── Commands ──────────────────────────────────────────────────────────────

  /**
   * Loads the list of stored documents into the store.
   *
   * @returns A promise that resolves when the load completes.
   */
  public async loadDocuments(): Promise<void> {
    this._loadingDocs.set(true);
    this._error.set(null);
    try {
      const docs = await firstValueFrom(this.api.listDocuments());
      this._documents.set(docs);
    } catch {
      this._error.set('Could not load documents. Is the backend running?');
    } finally {
      this._loadingDocs.set(false);
    }
  }

  /**
   * Uploads and ingests a file, then refreshes the document list.
   *
   * @param file - The file to ingest.
   * @returns A promise that resolves when ingestion completes.
   */
  public async uploadDocument(file: File): Promise<void> {
    this._uploading.set(true);
    this._error.set(null);
    try {
      await firstValueFrom(this.api.ingestDocument(file));
      await this.loadDocuments();
    } catch {
      this._error.set(`Could not ingest "${file.name}". Check the file type and try again.`);
    } finally {
      this._uploading.set(false);
    }
  }

  /**
   * Deletes a document and refreshes the list.
   *
   * @param documentId - The id of the document to delete.
   * @returns A promise that resolves when deletion completes.
   */
  public async deleteDocument(documentId: string): Promise<void> {
    this._error.set(null);
    try {
      await firstValueFrom(this.api.deleteDocument(documentId));
      await this.loadDocuments();
    } catch {
      this._error.set('Could not delete the document.');
    }
  }

  /**
   * Asks a question. Appends a pending turn immediately for snappy UI, then
   * fills in the answer (or an error) when the response arrives.
   *
   * @param question - The question to ask.
   * @returns A promise that resolves when the answer is in.
   */
  public async ask(question: string): Promise<void> {
    const trimmed = question.trim();
    if (!trimmed) {
      return;
    }

    const turnId = `turn_${Date.now().toString(36)}`;
    const pendingTurn: ConversationTurn = {
      id: turnId,
      question: trimmed,
      answer: null,
      sources: [],
      pending: true,
      error: null,
    };
    this._turns.update((turns) => [...turns, pendingTurn]);

    try {
      const response = await firstValueFrom(this.api.query(trimmed));
      this.patchTurn(turnId, {
        answer: response.answer,
        sources: response.sources,
        pending: false,
      });
    } catch {
      this.patchTurn(turnId, {
        pending: false,
        error: 'Something went wrong answering this question. Try again.',
      });
    }
  }

  /**
   * Updates one conversation turn by id, re-emitting the turns signal.
   *
   * @param turnId - The id of the turn to update.
   * @param patch - The fields to overwrite on that turn.
   */
  private patchTurn(turnId: string, patch: Partial<ConversationTurn>): void {
    this._turns.update((turns) =>
      turns.map((turn) => (turn.id === turnId ? { ...turn, ...patch } : turn)),
    );
  }
}
