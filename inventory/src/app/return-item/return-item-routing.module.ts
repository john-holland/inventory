import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import {ReturnItemComponent} from "~/app/return-item/return-item.component";

const routes: Routes = [
    { path: "return-item/:id", component: ReturnItemComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class ReturnItemRoutingModule { }
