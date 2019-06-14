import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { NativeScriptUISideDrawerModule } from "nativescript-ui-sidedrawer/angular";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import {HomeComponent} from "~/app/home/home.component";
import {LoginComponent} from "~/app/login/login.component";
import {AuthService} from "~/app/services/auth.service";
import {ItemService} from "~/app/services/item.service";
import {Logger} from "~/app/services/logger.service";
import {ApiAdapterService} from "~/app/services/api-adapter.service";
import {SearchService} from "~/app/services/search.service";
import {UserService} from "~/app/services/user.service";
import { ItemViewComponent } from './item-view/item-view.component';
import { RequestItemComponent } from './request-item/request-item.component';
import { ReturnItemComponent } from './return-item/return-item.component';
import {BrowseComponent} from "~/app/browse/browse.component";
import {FeaturedComponent} from "~/app/featured/featured.component";
import {SearchComponent} from "~/app/search/search.component";
import {SettingsComponent} from "~/app/settings/settings.component";

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        AppRoutingModule,
        NativeScriptModule,
        NativeScriptUISideDrawerModule
    ],
    declarations: [
        AppComponent,
        ItemViewComponent,
        RequestItemComponent,
        ReturnItemComponent,
        LoginComponent,
        BrowseComponent,
        FeaturedComponent,
        SearchComponent,
        SettingsComponent,
        HomeComponent
    ],
    providers: [
      AuthService,
      ItemService,
      Logger,
      ApiAdapterService,
      SearchService,
      UserService
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
export class AppModule { }
