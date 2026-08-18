import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AiConversation, AiService } from '../../core/services/ai.service';
import { AbsenceApiService } from '../../core/services/absence.service';
import { Absence, TypeAbsence } from '../../core/models/absence';

interface Message { role: 'user' | 'assistant'; text: string; }

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css',
})
export class AiAssistant {
  private readonly ai = inject(AiService);
  private readonly absenceApi = inject(AbsenceApiService);
  readonly messages = signal<Message[]>([{ role: 'assistant', text: 'Bonjour. Je peux vous aider à expliquer une situation RH ou préparer une analyse. Je ne valide aucune demande.' }]);
  readonly conversations = signal<AiConversation[]>([]);
  readonly conversationId = signal<number | null>(null);
  readonly absenceDraft = signal<Partial<Absence> | null>(null);
  readonly waitingConfirmation = signal(false);
  readonly loading = signal(false);
  prompt = '';
  constructor() { this.loadConversations(); }

  newConversation(): void {
    this.prompt = '';
    this.messages.set([{ role: 'assistant', text: 'Nouvelle conversation. Comment puis-je vous aider ?' }]);
    this.conversationId.set(null);
  }

  ask(question: string): void { this.prompt = question; this.send(); }

  send(): void {
    const message = this.prompt.trim();
    if (!message || this.loading()) return;
    this.messages.update((items) => [...items, { role: 'user', text: message }]);
    this.prompt = '';
    if (this.handleAbsenceDraft(message)) return;
    this.loading.set(true);
    this.ai.conversationChat(message, this.conversationId()).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (reply) => { this.conversationId.set(reply.conversationId); this.messages.update((items) => [...items, { role: 'assistant', text: reply.response }]); this.loadConversations(); },
      error: () => this.messages.update((items) => [...items, { role: 'assistant', text: 'Le service IA est indisponible. Vérifiez FastAPI et Ollama.' }]),
    });
  }
  confirmAbsence(): void {
    const draft = this.absenceDraft();
    if (!draft?.dateStart || !draft.dateEnd || !draft.type) return;
    this.loading.set(true);
    this.absenceApi.create({ type: draft.type, dateStart: draft.dateStart, dateEnd: draft.dateEnd, comment: 'Demande créée depuis l’assistant IA' }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => { this.messages.update(items => [...items, { role: 'assistant', text: 'Votre demande a été envoyée avec succès. Elle est maintenant en attente de validation.' }]); this.absenceDraft.set(null); this.waitingConfirmation.set(false); },
      error: error => this.messages.update(items => [...items, { role: 'assistant', text: error?.error?.message ?? 'La demande ne peut pas être créée : vérifiez les dates.' }]),
    });
  }
  cancelAbsence(): void { this.absenceDraft.set(null); this.waitingConfirmation.set(false); this.messages.update(items => [...items, { role: 'assistant', text: 'La demande d’absence a été annulée.' }]); }
  private handleAbsenceDraft(message: string): boolean {
    const normalized = message.toLowerCase();
    const current = this.absenceDraft();
    const wantsAbsence = current || /(demande|faire|créer|creer).*(absence|congé|conge)|(absence|congé|conge).*(demande|faire|créer|creer)/.test(normalized);
    if (!wantsAbsence) return false;
    const type = normalized.includes('sans solde') ? TypeAbsence.NON_PAYE : normalized.includes('malad') ? TypeAbsence.MALADE : normalized.includes('pay') ? TypeAbsence.PAYE : normalized.includes('cong') ? TypeAbsence.CONGE : undefined;
    const dates = this.parseDates(normalized);
    const draft: Partial<Absence> = { ...current, ...(type ? { type } : {}), ...(dates ?? {}) };
    this.absenceDraft.set(draft);
    const missing = [!draft.dateStart || !draft.dateEnd ? 'les dates de début et de fin' : '', !draft.type ? 'le type d’absence' : ''].filter(Boolean);
    if (missing.length) { this.messages.update(items => [...items, { role: 'assistant', text: `Pour préparer la demande, il manque ${missing.join(' et ')}. Exemple : « du 18 août au 21 août, congé payé ». ` }]); return true; }
    this.waitingConfirmation.set(true);
    this.messages.update(items => [...items, { role: 'assistant', text: `Récapitulatif : ${draft.type === TypeAbsence.PAYE ? 'congé payé' : 'congé'} du ${draft.dateStart} au ${draft.dateEnd}. Vérifiez le récapitulatif puis utilisez Confirmer ou Annuler.` }]);
    return true;
  }
  private parseDates(text: string): Partial<Absence> | null {
    const iso = text.match(/(\d{4}-\d{2}-\d{2})\s*(?:à|a|au|jusqu.?au|-)\s*(\d{4}-\d{2}-\d{2})/); if (iso) return { dateStart: iso[1], dateEnd: iso[2] };
    const french = text.match(/(\d{1,2})\s*ao[uû]t\s*(?:à|a|au|jusqu.?au|-)\s*(\d{1,2})\s*ao[uû]t/); if (!french) return null;
    const year = new Date().getFullYear(); const date = (day: string) => `${year}-08-${day.padStart(2, '0')}`; return { dateStart: date(french[1]), dateEnd: date(french[2]) };
  }
  openConversation(conversation: AiConversation): void { this.conversationId.set(conversation.id); this.ai.conversationMessages(conversation.id).subscribe(items => this.messages.set(items.map(item => ({role:item.role,text:item.content})))); }
  private loadConversations(): void { this.ai.conversations().subscribe({next: items => this.conversations.set(items), error: () => {}}); }
}
