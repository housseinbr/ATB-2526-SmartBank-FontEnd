import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Icon } from '../../shared/components/icon/icon';

@Component({
  selector: 'app-mobilite-page',
  standalone: true,
  imports: [CommonModule, Icon],
  template: `
    <section class="page-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Espace mobilité</p>
          <h1>Gérer les mobilités internes</h1>
          <p>Un espace simple pour suivre les demandes, les validations et les changements de poste.</p>
        </div>
        <button class="hero-action"><app-icon name="plus" [size]="16" /> Nouvelle demande</button>
      </header>

      <div class="stats">
        @for (stat of stats; track stat.label) {
          <article class="stat-card">
            <app-icon [name]="stat.icon" [size]="18" />
            <div>
              <strong>{{ stat.value }}</strong>
              <span>{{ stat.label }}</span>
            </div>
          </article>
        }
      </div>

      <div class="grid">
        <article class="card">
          <div class="card__head">
            <div>
              <h2>Demandes de mobilité</h2>
              <p>Les demandes en attente de traitement.</p>
            </div>
          </div>
          <div class="list">
            @for (item of requests; track item.title) {
              <div class="list-item">
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.meta }}</p>
                </div>
                <span class="pill">{{ item.status }}</span>
              </div>
            }
          </div>
        </article>

        <article class="card">
          <div class="card__head">
            <div>
              <h2>Traitement rapide</h2>
              <p>Validation simple et lisible pour le superviseur.</p>
            </div>
          </div>
          <div class="quick-stack">
            <div class="quick-item">Vérifier l’éligibilité du collaborateur</div>
            <div class="quick-item">Confirmer le poste d’accueil</div>
            <div class="quick-item">Décider et notifier le collaborateur</div>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    :host { display:block; min-height: calc(100vh - 64px); background: radial-gradient(circle at top left, rgba(201, 43, 65, 0.08), transparent 36%), #f5f6fb; color:#0f172a; }
    .page-shell { padding: 28px; display: grid; gap: 18px; }
    .hero, .card, .stat-card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; box-shadow: 0 18px 48px rgba(15,23,42,.06); }
    .hero { padding: 28px; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; }
    .eyebrow { margin:0 0 8px; text-transform:uppercase; letter-spacing:.18em; font-size:12px; font-weight:800; color:#c0263f; }
    h1, h2 { margin:0; }
    h1 { font-size: clamp(28px, 4vw, 42px); line-height:1.05; }
    .hero p { margin:10px 0 0; color:#64748b; max-width: 60ch; }
    .hero-action { border:0; border-radius:16px; padding:14px 18px; background:#c6233d; color:#fff; font-weight:800; display:inline-flex; align-items:center; gap:8px; box-shadow:0 14px 30px rgba(198,35,61,.22); }
    .stats { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
    .stat-card { padding:18px; display:flex; gap:14px; align-items:center; }
    .stat-card app-icon { color:#c6233d; }
    .stat-card strong { display:block; font-size:28px; line-height:1; }
    .stat-card span { color:#64748b; font-size:14px; }
    .grid { display:grid; grid-template-columns: 1.4fr .9fr; gap:14px; }
    .card { padding: 18px; }
    .card__head p { margin:6px 0 0; color:#64748b; }
    .list { margin-top:16px; display:grid; gap:10px; }
    .list-item, .quick-item { border:1px solid rgba(15,23,42,.08); border-radius:16px; background:#fafafa; padding:14px 16px; }
    .list-item { display:flex; justify-content:space-between; gap:12px; align-items:center; }
    .list-item p { margin:4px 0 0; color:#64748b; font-size:13px; }
    .pill { border-radius:999px; background:#fff1f3; color:#9f1239; padding:6px 10px; font-weight:700; font-size:12px; }
    .quick-stack { margin-top:16px; display:grid; gap:10px; }
    .quick-item { color:#334155; font-weight:600; }
    @media (max-width: 1100px) { .stats, .grid { grid-template-columns: 1fr; } .hero { flex-direction:column; } }
  `],
})
export class MobilitePage {
  readonly stats = [
    { label: 'Demandes suivies', value: '0', icon: 'file-text' as const },
    { label: 'En attente', value: '0', icon: 'inbox' as const },
    { label: 'Validées', value: '0', icon: 'check' as const },
  ];

  readonly requests = [
    { title: 'Demande de mobilité interne', meta: 'Poste cible, date souhaitée et validation hiérarchique', status: 'En attente' },
    { title: 'Changement d’affectation', meta: 'Suivi administratif et décision finale', status: 'À traiter' },
  ];
}
