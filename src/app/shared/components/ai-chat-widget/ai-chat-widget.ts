import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AiService } from '../../../core/services/ai.service';

interface ChatMessage { role: 'user' | 'assistant'; text: string; }

@Component({
  selector: 'app-ai-chat-widget', standalone: true, imports: [FormsModule],
  templateUrl: './ai-chat-widget.html', styleUrl: './ai-chat-widget.css',
})
export class AiChatWidget {
  private readonly ai = inject(AiService);
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly messages = signal<ChatMessage[]>([{ role: 'assistant', text: 'Bonjour, je suis l’assistant SmartBank. Je peux expliquer et analyser, sans prendre de décision à votre place.' }]);
  prompt = '';

  send(): void {
    const text = this.prompt.trim();
    if (!text || this.loading()) return;
    this.messages.update((items) => [...items, { role: 'user', text }]);
    this.prompt = '';
    this.loading.set(true);
    this.ai.chat(text).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (reply) => this.messages.update((items) => [...items, { role: 'assistant', text: reply.response }]),
      error: () => this.messages.update((items) => [...items, { role: 'assistant', text: 'Service IA indisponible. Démarrez FastAPI sur le port 8000 et vérifiez Ollama.' }]),
    });
  }
}
