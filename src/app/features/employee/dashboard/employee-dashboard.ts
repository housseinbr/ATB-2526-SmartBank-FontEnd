import { Component, computed } from '@angular/core';
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
    refusees: 2,
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

  statusChartData = computed(() => [
    { label: 'Approuvées', value: this.stats.approuvees, color: '#16a34a' },
    { label: 'En attente', value: this.stats.enAttente, color: '#d97706' },
    { label: 'Refusées', value: this.stats.refusees, color: '#a4182a' },
  ]);

  get statusTotal(): number {
    return this.statusChartData().reduce((total, item) => total + item.value, 0) || 1;
  }

  get lineChartWidth(): number {
    return 640;
  }

  get lineChartHeight(): number {
    return 220;
  }

  private chartPadding = { top: 20, right: 12, bottom: 36, left: 12 };

  get lineChartMax(): number {
    return Math.max(...this.absencesHistory.map((item) => item.value), 1);
  }

  get lineChartYGrid(): number[] {
    return [0, 25, 50, 75, 100];
  }

  get linePath(): string {
    const points = this.linePoints();
    if (points.length === 0) return '';
    return points.reduce((path, point, index) => `${path}${index === 0 ? 'M' : 'L'} ${point.x} ${point.y} `, '').trim();
  }

  get areaPath(): string {
    const points = this.linePoints();
    if (points.length === 0) return '';
    const first = points[0];
    const last = points[points.length - 1];
    return `${this.linePath} L ${last.x} ${this.lineChartHeight - this.chartPadding.bottom} L ${first.x} ${this.lineChartHeight - this.chartPadding.bottom} Z`;
  }

  linePoints(): Array<{ x: number; y: number; month: string; value: number }> {
    const chartWidth = this.lineChartWidth - this.chartPadding.left - this.chartPadding.right;
    const chartHeight = this.lineChartHeight - this.chartPadding.top - this.chartPadding.bottom;
    const step = this.absencesHistory.length > 1 ? chartWidth / (this.absencesHistory.length - 1) : 0;

    return this.absencesHistory.map((item, index) => {
      const x = this.chartPadding.left + index * step;
      const y = this.chartPadding.top + chartHeight * (1 - item.value / this.lineChartMax);
      return { x, y, month: item.month, value: item.value };
    });
  }

  getPieOffset(index: number): number {
    const cumulative = this.statusChartData()
      .slice(0, index)
      .reduce((total, item) => total + item.value, 0);
    return 25 - (cumulative / this.statusTotal) * 100;
  }
}
