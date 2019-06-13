import { Component, OnInit } from '@angular/core';
import {ItemService} from "~/app/services/item.service";
import {ItemModel} from "~/app/models/item.model";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'ns-return-item',
  templateUrl: './return-item.component.html',
  styleUrls: ['./return-item.component.css'],
  moduleId: module.id,
})
export class ReturnItemComponent implements OnInit {
    item: ItemModel;

  constructor(
      private itemService: ItemService,
      private route: ActivatedRoute
  ) { }

  ngOnInit() {
      let id = this.route.snapshot.paramMap.get('id');

      this.itemService.getItemById(id).then((item: ItemModel) => this.item = item)
  }

  returnItem() {
      this.itemService.returnItem(this.item.id)
  }
}
