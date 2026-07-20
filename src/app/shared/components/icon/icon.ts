import { Component, input } from '@angular/core';

export type IconName =
  | 'grid'
  | 'user'
  | 'user-plus'
  | 'calendar'
  | 'bar-chart'
  | 'award'
  | 'book-open'
  | 'briefcase'
  | 'star'
  | 'bell'
  | 'users'
  | 'inbox'
  | 'shield'
  | 'log-out'
  | 'chevron-left'
  | 'chevron-down'
  | 'search'
  | 'trash'
  | 'pencil'
  | 'eye'
  | 'x'
  | 'check'
  | 'toggle-on'
  | 'toggle-off'
  | 'chart-pie'
  | 'trending-up'
  | 'trending-down'
  | 'activity'
  | 'filter'
  | 'download'
  | 'upload'
  | 'lock'
  | 'mail'
  | 'plus';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.html',
  styleUrl: './icon.css',
})
export class Icon {
  name = input.required<IconName>();
  size = input<number>(20);
}
