import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  message = input.required<string>();
  type = input<ToastType>('success');
  visible = input<boolean>(false);
}