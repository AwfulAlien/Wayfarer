import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SHARED_IMPORTS } from './shared/shared-imports';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ...SHARED_IMPORTS],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'DateTime';
}
