import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import {LoginComponent} from "~/app/login/login.component";
import {
    AuthGuardService as AuthGuard
} from "~/app/services/auth-guard.service";
import {HomeComponent} from "~/app/home/home.component";
import {BrowseComponent} from "~/app/browse/browse.component";
import {SearchComponent} from "~/app/search/search.component";
import {FeaturedComponent} from "~/app/featured/featured.component";
import {SettingsComponent} from "~/app/settings/settings.component";
import {ItemViewComponent} from "~/app/item-view/item-view.component";
import {ReturnItemComponent} from "~/app/return-item/return-item.component";
import {RequestItemComponent} from "~/app/request-item/request-item.component";

const routes: Routes = [
    { path: "", redirectTo: "/home", pathMatch: "full" },
    { path: "home", loadChildren: "~/app/home/home.module#HomeModule", canActivate: [AuthGuard] },
    { path: "browse", loadChildren: "~/app/browse/browse.module#BrowseModule", canActivate: [AuthGuard] },
    { path: "search", loadChildren: "~/app/search/search.module#SearchModule", canActivate: [AuthGuard] },
    { path: "featured", loadChildren: "~/app/featured/featured.module#FeaturedModule", canActivate: [AuthGuard] },
    { path: "settings", loadChildren: "~/app/settings/settings.module#SettingsModule", canActivate: [AuthGuard] },
    { path: "item-view/:id", loadChildren: "~/app/item-view/item-view.module#ItemViewModule", canActivate: [AuthGuard] },
    { path: "return-item/:id", loadChildren: "~/app/return-item/return-item.module#ReturnItemModule", canActivate: [AuthGuard] },
    { path: "request-item/:id", loadChildren: "~/app/request-item/request-item.module#RequestItemModule", canActivate: [AuthGuard] }
    // { path: "login", component: LoginComponent },
    // { path: "home", component: HomeComponent, canActivate: [AuthGuard] },
    // { path: "browse", component: BrowseComponent, canActivate: [AuthGuard] },
    // { path: "search", component: SearchComponent, canActivate: [AuthGuard] },
    // { path: "featured", component: FeaturedComponent, canActivate: [AuthGuard] },
    // { path: "settings", component: SettingsComponent, canActivate: [AuthGuard] },
    // { path: "item-view/:id", component: ItemViewComponent, canActivate: [AuthGuard] },
    // { path: "return-item/:id", component: ReturnItemComponent, canActivate: [AuthGuard] },
    // { path: "request-item/:id", component: RequestItemComponent, canActivate: [AuthGuard] }
];

/**
 * { path: "home", loadChildren: "~/app/home/home.module#HomeModule", canActivate: [AuthGuard] },
 { path: "browse", loadChildren: "~/app/browse/browse.module#BrowseModule", canActivate: [AuthGuard] },
 { path: "search", loadChildren: "~/app/search/search.module#SearchModule", canActivate: [AuthGuard] },
 { path: "featured", loadChildren: "~/app/featured/featured.module#FeaturedModule", canActivate: [AuthGuard] },
 { path: "settings", loadChildren: "~/app/settings/settings.module#SettingsModule", canActivate: [AuthGuard] },
 { path: "item-view/:id", loadChildren: "~/app/item-view/item-view.module#ItemViewModule", canActivate: [AuthGuard] },
 { path: "return-item/:id", loadChildren: "~/app/return-item/return-item.module#ReturnItemModule", canActivate: [AuthGuard] },
 { path: "request-item/:id", loadChildren: "~/app/request-item/request-item.module#RequestItemModule", canActivate: [AuthGuard] }
 */

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }
