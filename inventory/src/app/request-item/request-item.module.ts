import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptCommonModule } from "nativescript-angular/common";

import {RequestItemRoutingModule} from "~/app/request-item/request-item-routing.module";
import {RequestItemComponent} from "~/app/request-item/request-item.component";

@NgModule({
    imports: [
        NativeScriptCommonModule,
        RequestItemRoutingModule
    ],
    declarations: [
        RequestItemComponent
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class RequestItemModule { }
