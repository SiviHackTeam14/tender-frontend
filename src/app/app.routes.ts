import { Routes } from '@angular/router';
import { ProfileSelect } from './components/profile-select/profile-select';
import { TriageBoard } from './components/triage-board/triage-board';

export const routes: Routes = [
  { path: '', component: ProfileSelect },
  { path: 'board', component: TriageBoard },
  { path: '**', redirectTo: '' },
];
