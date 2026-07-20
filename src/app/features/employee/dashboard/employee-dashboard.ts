import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '../../../shared/components/icon/icon';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [CommonModule, Icon],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css',
})
export class EmployeeDashboard {
  stats = {
    soldeAnnuel: 18,
    totalJours: 30,
    approuvees: 12,
    enAttente: 1,
    notifications: 2,
  };

  soldes = {
    conges: { used: 18, total: 30 },
    maladie: { used: 5, total: 15 },
    exceptionnel: { used: 2, total: 5 },
  };

  recentRequests = [
    { type: 'Congé annuel', dates: '02 Déc 2024 → 09 Déc 2024', days: 6, status: 'Approuvé', statusColor: 'green', ref: 'REQ-2024-089' },
    { type: 'Attestation de travail', dates: '15 Nov 2024 → 15 Nov 2024', days: 1, status: 'Approuvé', statusColor: 'green', ref: 'REQ-2024-074' },
    { type: 'Congé annuel', dates: '15 Jan 2025 → 22 Jan 2025', days: 6, status: 'En attente', statusColor: 'orange', ref: 'REQ-2025-001' },
  ];

  absencesHistory = [
    { month: 'Jan', value: 8 },
    { month: 'Fév', value: 6 },
    { month: 'Mar', value: 10 },
    { month: 'Avr', value: 7 },
    { month: 'Mai', value: 9 },
    { month: 'Juin', value: 5 },
  ];

  notifications = [
    { text: 'Votre demande REQ-2025-001 est en cours de traitement', time: 'Il y a 2h', unread: true },
    { text: 'Votre solde de congés a été mis à jour (+2 jours)', time: 'Il y a 1j', unread: true },
    { text: 'Rappel : Entretien d évaluation le 20 Janvier 2025', time: 'Il y a 2j', unread: false },
  ];
}