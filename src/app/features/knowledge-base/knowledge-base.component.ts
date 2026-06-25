/**
 * @fileoverview Knowledge-base screen: upload documents on the left, ask
 * questions on the right, and read answers with their cited sources. The
 * sources are first-class here — they show *where* each answer came from.
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnowledgeBaseStore } from '../../core/services/knowledge-base.store';

/**
 * The single screen of the RAG app.
 */
@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './knowledge-base.component.html',
  styleUrl: './knowledge-base.component.css',
})
export class KnowledgeBaseComponent implements OnInit {
  /** The store backing this screen. */
  protected readonly store = inject(KnowledgeBaseStore);

  /** The current question text bound to the input. */
  protected readonly draft = signal<string>('');

  /** Which source lists are expanded, keyed by turn id. */
  protected readonly expanded = signal<Record<string, boolean>>({});

  /** Loads the document list on first render. */
  public ngOnInit(): void {
    void this.store.loadDocuments();
  }

  /**
   * Handles a file chosen from the file input.
   *
   * @param event - The change event from the file input.
   */
  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void this.store.uploadDocument(file);
    }
    // Reset so selecting the same file again still fires a change event.
    input.value = '';
  }

  /**
   * Submits the current question and clears the input.
   */
  protected onAsk(): void {
    const question = this.draft();
    if (!question.trim() || !this.store.hasDocuments()) {
      return;
    }
    void this.store.ask(question);
    this.draft.set('');
  }

  /**
   * Submits on Enter (without Shift, which inserts a newline).
   *
   * @param event - The keyboard event from the textarea.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onAsk();
    }
  }

  /**
   * Deletes a document by id.
   *
   * @param documentId - The id of the document to remove.
   */
  protected onDelete(documentId: string): void {
    void this.store.deleteDocument(documentId);
  }

  /**
   * Toggles the visibility of a turn's source list.
   *
   * @param turnId - The id of the turn whose sources to toggle.
   */
  protected toggleSources(turnId: string): void {
    this.expanded.update((state) => ({ ...state, [turnId]: !state[turnId] }));
  }

  /**
   * Whether a turn's sources are currently expanded.
   *
   * @param turnId - The turn id to check.
   * @returns `true` when expanded.
   */
  protected isExpanded(turnId: string): boolean {
    return !!this.expanded()[turnId];
  }

  /**
   * Formats a similarity score (0–1) as a percentage label.
   *
   * @param score - The similarity score.
   * @returns A string like `"87%"`.
   */
  protected scoreLabel(score: number): string {
    return `${Math.round(score * 100)}%`;
  }
}
