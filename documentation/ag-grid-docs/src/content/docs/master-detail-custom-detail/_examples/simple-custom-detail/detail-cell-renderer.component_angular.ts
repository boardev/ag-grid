import { ICellRendererAngularComp } from '@ag-grid-community/angular';
import { Component } from '@angular/core';

@Component({
    standalone: true,
    template: `<h1 style="padding: 20px;">My Custom Detail</h1>`,
})
export class DetailCellRenderer implements ICellRendererAngularComp {
    agInit(params: any): void {}

    refresh(params: any): boolean {
        return false;
    }
}
