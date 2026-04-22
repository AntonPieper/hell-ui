import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  HellAppShell,
  HellAppTopbar,
  HellAppSidenav,
  HellAppContent,
  HellButton,
} from 'hell';

@Component({
  selector: 'hd-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    HellAppShell,
    HellAppTopbar,
    HellAppSidenav,
    HellAppContent,
    HellButton,
  ],
  templateUrl: './app.html',
})
export class App {}
