import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AiAction, AiConversation, AiService } from '../../core/services/ai.service';
import { Absence, TypeAbsence } from '../../core/models/absence';

interface StructuredLine { label?: string; value: string; heading?: boolean; }
interface Message { role: 'user' | 'assistant'; text: string; formatted?: boolean; }

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css',
})
export class AiAssistant {
  private readonly ai = inject(AiService);
  private readonly router = inject(Router);
  readonly messages = signal<Message[]>([{ role: 'assistant', text: 'Bonjour, je suis votre assistant SmartBank. Je peux vous aider à comprendre vos informations RH, vos absences et vos démarches.' }]);
  readonly conversations = signal<AiConversation[]>([]);
  readonly conversationId = signal<number | null>(null);
  readonly absenceDraft = signal<Partial<Absence> | null>(null);
  readonly waitingConfirmation = signal(false);
  readonly loading = signal(false);
  readonly editingIndex = signal<number | null>(null);
  prompt = '';
  constructor() { this.loadConversations(); }

  newConversation(): void {
    this.prompt = '';
    this.messages.set([{ role: 'assistant', text: 'Nouvelle conversation. Comment puis-je vous aider ?' }]);
    this.conversationId.set(null);
    this.editingIndex.set(null);
  }

  ask(question: string): void { this.prompt = question; this.send(); }

  send(): void {
    const message = this.prompt.trim();
    if (!message || this.loading()) return;
    this.messages.update((items) => [...items, { role: 'user', text: message }]);
    this.prompt = '';
    this.editingIndex.set(null);
    if (this.waitingConfirmation() && /^(oui\s+)?(je\s+)?(confirme|confirmer|confirm|confirmed|yes)(\s+la\s+demande)?\s*$/i.test(message)) {
      this.confirmAbsence(message);
      return;
    }
    if (this.waitingConfirmation() && /(détail|detail|résumé|resume|ma demande|la demande)/i.test(message)) {
      const draft = this.absenceDraft();
      if (draft?.dateStart && draft.dateEnd && draft.type) {
        this.messages.update((items) => [...items, { role: 'assistant', text: this.requestSummary(draft) }]);
        return;
      }
    }
    this.loading.set(true);
    this.ai.conversationChat(message, this.conversationId()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (reply) => {
        this.conversationId.set(reply.conversationId);
        this.messages.update((items) => [...items, { role: 'assistant', text: reply.response, formatted: this.isStructuredResponse(reply.response) }]);
        if (reply.action?.start_date && reply.action.end_date && reply.action.leave_type) {
          this.absenceDraft.set(this.actionToDraft(reply.action));
          if (reply.state === 'CONFIRMED') {
            this.openOfficialForm(reply.action);
          } else {
            this.waitingConfirmation.set(reply.state === 'WAITING_FOR_CONFIRMATION');
          }
        }
        this.loadConversations();
      },
      error: () => this.messages.update((items) => [...items, { role: 'assistant', text: 'Le service IA est indisponible. Vérifiez FastAPI et Ollama.' }]),
    });
  }
  editMessage(index: number): void {
    const message = this.messages()[index];
    if (!message || message.role !== 'user' || this.loading()) return;
    this.prompt = message.text;
    this.editingIndex.set(index);
  }
  cancelEdit(): void { this.prompt = ''; this.editingIndex.set(null); }
  deleteConversation(conversation: AiConversation, event: Event): void {
    event.stopPropagation();
    this.ai.deleteConversation(conversation.id).subscribe({
      next: () => {
        this.conversations.update(items => items.filter(item => item.id !== conversation.id));
        if (this.conversationId() === conversation.id) this.newConversation();
      },
      error: () => this.messages.update(items => [...items, { role: 'assistant', text: 'Impossible de supprimer cette conversation.' }]),
    });
  }
  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }
  confirmAbsence(confirmation = 'oui'): void {
    const draft = this.absenceDraft();
    if (!draft?.dateStart || !draft.dateEnd || !draft.type) return;
    this.loading.set(true);
    this.ai.confirmAction(String(this.conversationId() ?? 'default'), confirmation).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (reply) => {
        if (reply.state !== 'CONFIRMED') {
          this.messages.update(items => [...items, { role: 'assistant', text: reply.response, formatted: this.isStructuredResponse(reply.response) }]);
          return;
        }
        this.messages.update(items => [...items, { role: 'assistant', text: reply.response, formatted: this.isStructuredResponse(reply.response) }]);
        this.openOfficialForm({ leave_type: draft.type, start_date: draft.dateStart, end_date: draft.dateEnd });
      },
      error: () => this.messages.update(items => [...items, { role: 'assistant', text: 'La confirmation n’a pas pu être traitée par le service IA.' }]),
    });
  }
  cancelAbsence(): void { this.absenceDraft.set(null); this.waitingConfirmation.set(false); this.messages.update(items => [...items, { role: 'assistant', text: 'La demande d’absence a été annulée.' }]); }
  private actionToDraft(action: AiAction): Partial<Absence> {
    const type = (action.leave_type ?? '').toLowerCase();
    const typeValue = type.includes('sans solde') || type.includes('non pay')
      ? TypeAbsence.NON_PAYE
      : type.includes('malad')
        ? TypeAbsence.MALADE
        : type.includes('pay')
          ? TypeAbsence.PAYE
          : TypeAbsence.CONGE;
    return { type: typeValue, dateStart: action.start_date, dateEnd: action.end_date };
  }
  private openOfficialForm(action: AiAction): void {
    const draft = this.actionToDraft(action);
    if (!draft.dateStart || !draft.dateEnd || !draft.type) return;
    this.router.navigate(['/dashboard/absences'], { queryParams: { ai: '1', type: draft.type, dateStart: draft.dateStart, dateEnd: draft.dateEnd }});
    this.absenceDraft.set(null);
    this.waitingConfirmation.set(false);
  }
  private requestSummary(draft: Partial<Absence>): string {
    return `Voici le détail de votre demande :\nType : ${draft.type}\nDu : ${draft.dateStart}\nAu : ${draft.dateEnd}\nDurée : ${this.daysBetween(draft.dateStart, draft.dateEnd)} jour(s)\n\nConfirmez-vous cette demande ?`;
  }
  private isStructuredResponse(text: string): boolean {
    return /^Voici vos informations\s*:/i.test(text.trim()) || /^Voici le détail/i.test(text.trim()) || /détails? de (vos|mes) absences/i.test(text);
  }
  structuredLines(text: string): StructuredLine[] {
    return text.split('\n').map(line => line.trim()).filter(Boolean).map((line, index) => {
      const clean = line.replace(/\*\*/g, '').replace(/^[-•]\s*/, '');
      const separator = clean.indexOf(':');
      if (index === 0 || separator < 0) return { value: clean, heading: index === 0 };
      return { label: clean.slice(0, separator).trim(), value: clean.slice(separator + 1).trim() };
    });
  }
  private daysBetween(start?: string, end?: string): number {
    if (!start || !end) return 0;
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000) + 1;
  }
  openConversation(conversation: AiConversation): void { this.conversationId.set(conversation.id); this.ai.conversationMessages(conversation.id).subscribe(items => this.messages.set(items.map(item => ({role:item.role,text:item.content})))); }
  private loadConversations(): void { this.ai.conversations().subscribe({next: items => this.conversations.set(items), error: () => {}}); }

}
