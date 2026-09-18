import { Routes } from '@angular/router';
import { TenderExtraction } from './components/tender-extraction/tender-extraction';

export const routes: Routes = [
  { path: '', component: TenderExtraction },
  { path: 'board', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
