import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface IMenuItem {
  title: string,
  path: string,
  external: boolean
};

function mi(title: string, path: string, external = false): IMenuItem {
  return {
    title, path, external
  };
}

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  menu: IMenuItem[] = [
    mi("Home", "/"),
    mi("Services", "/services"),
    mi("All Units", "/units"),
    mi("Journal", "/journal"),
    mi("Dragon API", "https://github.com/ScuroGuardiano/dragon-api", true),
  ];
}
