import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LandingComponent } from '../core/pages/landing/landing.component';
import { AppBarComponent } from '../core/components/app-bar/app-bar.component';

export const SHARED_IMPORTS = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  LandingComponent,
  AppBarComponent,
];
