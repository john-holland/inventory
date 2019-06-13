import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import {RequestItemComponent} from "~/app/request-item/request-item.component";

const routes: Routes = [
    { path: "request-item/:id", component: RequestItemComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class RequestItemRoutingModule { }
