import { Formation } from './formation';
import { UserResponse } from './user-response';

export interface Competance {
  idCompetance: number;
  user: UserResponse;
  formation: Formation;
}
