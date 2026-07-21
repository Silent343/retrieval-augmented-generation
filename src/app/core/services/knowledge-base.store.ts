import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { ConversationTurn, DocumentSummary } from '../models/rag.models';
import { RagApiService } from './rag-api.service';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.md'];

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseStore {
  private readonly api = inject(RagApiService);
  private readonly _documents = signal<DocumentSummary[]>([]);
  private readonly _turns = signal<ConversationTurn[]>([]);
  private readonly _uploading = signal(false);
  private readonly _asking = signal(false);
  private readonly _loadingDocs = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _notice = signal<string | null>(null);

  public readonly documents = this._documents.asReadonly();
  public readonly turns = this._turns.asReadonly();
  public readonly uploading = this._uploading.asReadonly();
  public readonly asking = this._asking.asReadonly();
  public readonly loadingDocs = this._loadingDocs.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly notice = this._notice.asReadonly();
  public readonly hasDocuments = computed(() => this._documents().length > 0);
  public readonly totalChunks = computed(() => this._documents().reduce((sum, doc) => sum + doc.chunks, 0));

  public async loadDocuments(): Promise<void> {
    this._loadingDocs.set(true);
    try {
      this._documents.set(await firstValueFrom(this.api.listDocuments()));
    } catch (error) {
      this._error.set(this.describeError(error, 'Could not load documents. Is the backend running?'));
    } finally {
      this._loadingDocs.set(false);
    }
  }

  public async uploadDocument(file: File): Promise<void> {
    this._error.set(null);
    this._notice.set(null);
    if (!ALLOWED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))) {
      this._error.set('Only PDF, TXT and Markdown files are supported.');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      this._error.set('Files must be at most 10 MB.');
      return;
    }

    this._uploading.set(true);
    try {
      const result = await firstValueFrom(this.api.ingestDocument(file));
      this._notice.set(result.already_indexed ? `"${file.name}" was already indexed.` : `"${file.name}" is ready to query.`);
      await this.loadDocuments();
    } catch (error) {
      this._error.set(this.describeError(error, `Could not ingest "${file.name}". Check the file and try again.`));
    } finally {
      this._uploading.set(false);
    }
  }

  public async deleteDocument(documentId: string): Promise<void> {
    this._error.set(null);
    this._notice.set(null);
    try {
      await firstValueFrom(this.api.deleteDocument(documentId));
      await this.loadDocuments();
    } catch (error) {
      this._error.set(this.describeError(error, 'Could not delete the document.'));
    }
  }

  public async ask(question: string): Promise<void> {
    const trimmed = question.trim();
    if (!trimmed || this._asking()) {
      return;
    }
    this._error.set(null);
    const turnId = `turn_${Date.now().toString(36)}`;
    this._turns.update((turns) => [...turns, { id: turnId, question: trimmed, answer: null, sources: [], pending: true, error: null }]);
    this._asking.set(true);
    try {
      const response = await firstValueFrom(this.api.query(trimmed));
      this.patchTurn(turnId, { answer: response.answer, sources: response.sources, pending: false });
    } catch (error) {
      this.patchTurn(turnId, { pending: false, error: this.describeError(error, 'Something went wrong answering this question. Try again.') });
    } finally {
      this._asking.set(false);
    }
  }

  public clearNotice(): void {
    this._notice.set(null);
  }

  private patchTurn(turnId: string, patch: Partial<ConversationTurn>): void {
    this._turns.update((turns) => turns.map((turn) => (turn.id === turnId ? { ...turn, ...patch } : turn)));
  }

  private describeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.detail === 'string') {
      return error.error.detail;
    }
    return fallback;
  }
}
