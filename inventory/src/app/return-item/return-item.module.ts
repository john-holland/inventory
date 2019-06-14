import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import {ReturnItemComponent} from "~/app/return-item/return-item.component";
import {ReturnItemRoutingModule} from "~/app/return-item/return-item-routing.module";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        ReturnItemRoutingModule
    ],
    declarations: [
        ReturnItemComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class ReturnItemModule { }
