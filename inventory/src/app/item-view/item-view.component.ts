import { Component, OnInit } from '@angular/core';
import {ItemService} from "~/app/services/item.service";
import {ActivatedRoute} from "@angular/router";
import {ItemModel} from "~/app/models/item.model";
import {UserService} from "~/app/services/user.service";

/**
 * todo: we should display return status using shipping tracking
 */
@Component({
  selector: 'ns-item-view',
  templateUrl: './item-view.component.html',
  styleUrls: ['./item-view.component.css'],
  moduleId: module.id,
})
export class ItemViewComponent implements OnInit {
    item: ItemModel;
  constructor(
      private itemService: ItemService,
      private userService: UserService,
      private route: ActivatedRoute
  ) { }

  ngOnInit() {
      let id = this.route.snapshot.paramMap.get('id');

      this.itemService.getItemById(id).then((item: ItemModel) => this.item = item)
  }

    itemReturned() {
      this.itemService.itemReturned(this.item.id);
    }
}
