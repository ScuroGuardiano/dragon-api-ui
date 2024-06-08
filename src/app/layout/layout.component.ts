import { Component } from '@angular/core';
import { MenuComponent } from "../menu/menu.component";

@Component({
    selector: 'app-layout',
    standalone: true,
    templateUrl: './layout.component.html',
    styleUrl: './layout.component.scss',
    imports: [MenuComponent]
})
export class LayoutComponent {

}
