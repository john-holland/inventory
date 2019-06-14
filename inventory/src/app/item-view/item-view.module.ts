import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";
import {ItemViewComponent} from "~/app/item-view/item-view.component";
import {ItemViewRoutingModule} from "~/app/item-view/item-view-routing.module";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        ItemViewRoutingModule
    ],
    declarations: [
        ItemViewComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class ItemViewModule { }
