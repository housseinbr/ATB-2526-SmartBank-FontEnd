import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'danger' | 'warning' | 'info';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert.html',
  styleUrl: './alert.css',
})
export class AlertComponent {
  visible = input.required<boolean>();
  title = input.required<string>();
  message = input<string>('');
  type = input<AlertType>('danger');
  confirmText = input<string>('Confirmer');
  cancelText = input<string>('Annuler');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}