/**
 * @fileoverview HTTP client for the RAG backend. The single place that knows
 * the API endpoints; components and stores depend on this service, not on URLs.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DocumentSummary,
  IngestResponse,
  QueryResponse,
} from '../models/rag.models';

/**
 * Thin wrapper over the RAG REST API.
 */
@Injectable({ providedIn: 'root' })
export class RagApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api`;

  /**
   * Uploads a document for ingestion.
   *
   * @param file - The file to ingest (PDF, TXT or MD).
   * @returns An observable of the ingestion result.
   */
  public ingestDocument(file: File): Observable<IngestResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<IngestResponse>(`${this.baseUrl}/documents`, form);
  }

  /**
   * Lists the documents currently in the knowledge base.
   *
   * @returns An observable of the document summaries.
   */
  public listDocuments(): Observable<DocumentSummary[]> {
    return this.http.get<DocumentSummary[]>(`${this.baseUrl}/documents`);
  }

  /**
   * Deletes a document and all of its chunks.
   *
   * @param documentId - The id of the document to remove.
   * @returns An observable that completes when the deletion succeeds.
   */
  public deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/documents/${documentId}`);
  }

  /**
   * Asks a question grounded in the stored documents.
   *
   * @param question - The natural-language question.
   * @returns An observable of the answer and its sources.
   */
  public query(question: string): Observable<QueryResponse> {
    return this.http.post<QueryResponse>(`${this.baseUrl}/query`, { question });
  }
}
