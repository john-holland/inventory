import { Component, OnInit } from '@angular/core';
import {ItemModel} from "~/app/models/item.model";
import {ItemService} from "~/app/services/item.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'ns-request-item',
  templateUrl: './request-item.component.html',
  styleUrls: ['./request-item.component.scss'],
  moduleId: module.id,
})
export class RequestItemComponent implements OnInit {
    item: ItemModel;

  constructor(
      private itemService: ItemService,
      private route: ActivatedRoute
  ) { }

    ngOnInit() {
        let id = this.route.snapshot.paramMap.get('id');

        this.itemService.getItemById(id).then((item: ItemModel) => this.item = item)
    }

    request() {
      this.itemService.requestItem(this.item.id);
    }
}
