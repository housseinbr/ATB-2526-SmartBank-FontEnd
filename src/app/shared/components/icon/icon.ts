import { Component, Input } from '@angular/core';

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
  | 'search';

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.html',
})
export class Icon {
  @Input() name: IconName = 'grid';
  @Input() size = 18;
}
