import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './supervisor-dashboard.html',
  styleUrl: './supervisor-dashboard.css',
})
export class SupervisorDashboard {
  stats = {
    demandesEnAttente: 3,
    effectif: 8,
    absencesAujourdhui: 2,
    tauxPresence: 87,
  };

  pendingRequests = [
    { initials: 'SB', name: 'Sana Belhaj', type: 'Congé annuel', dates: '15 Jan 2025 → 22 Jan 2025', days: 6 },
    { initials: 'LM', name: 'Leila Mansour', type: 'Congé exceptionnel', dates: '20 Jan 2025 → 21 Jan 2025', days: 1 },
  ];

  team = [
    { initials: 'SB', name: 'Sana Belhaj', role: 'Développeur Senior', status: 'Actif', statusColor: 'green' },
    { initials: 'MT', name: 'Mehdi Trabelsi', role: 'Analyste Financier', status: 'Actif', statusColor: 'green' },
    { initials: 'LM', name: 'Leila Mansour', role: 'Chargée RH', status: 'Congé', statusColor: 'orange' },
    { initials: 'KZ', name: 'Karim Zouari', role: 'Chef de Projet', status: 'Actif', statusColor: 'green' },
  ];
}