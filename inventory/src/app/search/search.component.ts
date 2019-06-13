import { Component, OnInit } from "@angular/core";
import { RadSideDrawer } from "nativescript-ui-sidedrawer";
import * as app from "tns-core-modules/application";
import {SearchService} from "~/app/services/search.service";
import {Router} from "@angular/router";
import {ItemModel} from "~/app/models/item.model";

@Component({
    selector: "Search",
    moduleId: module.id,
    templateUrl: "./search.component.html"
})
export class SearchComponent implements OnInit {
    itemName: string;
    results: ItemModel[] = [];
    constructor(
        private searchService: SearchService,
        public router: Router
    ) {
        // Use the component constructor to inject providers.
    }

    ngOnInit(): void {
        // Init your component properties here.
    }

    search() {
        this.searchService.searchItems(this.itemName);
    }

    viewItem(item) {
        this.router.navigate(["item-view", { id: item.id }])
    }

    onDrawerButtonTap(): void {
        const sideDrawer = <RadSideDrawer>app.getRootView();
        sideDrawer.showDrawer();
    }
}
