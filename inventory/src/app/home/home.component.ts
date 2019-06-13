import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import {ItemModel} from "~/app/models/item.model";
import {UserService} from "~/app/services/user.service";
import {ItemService} from "~/app/services/item.service";

@Component({
    selector: "Home",
    moduleId: module.id,
    templateUrl: "./home.component.html"
})
export class HomeComponent implements OnInit {
    inventory: ItemModel[];

    constructor(private userService: UserService,
                private itemService: ItemService) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.
        this.itemService.getOwnedItems(this.userService.getLocalUser()).then(items => this.inventory = items);
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }
}
