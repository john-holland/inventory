import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import {ItemViewComponent} from "~/app/item-view/item-view.component";

const routes: Routes = [
    { path: "item-view/:id", component: ItemViewComponent }
];

@NgModule({
    imports: [NativeScriptRouterModule.forChild(routes)],
    exports: [NativeScriptRouterModule]
})
export class ItemViewRoutingModule { }
