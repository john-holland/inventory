import { Logger } from "./logger.service"
import { ApiAdapterService } from "./api-adapter.service"
import {ItemModel} from "~/app/models/item.model";
import {ItemService} from "~/app/services/item.service";
import {Injectable} from "@angular/core";

@Injectable()
export class SearchService {
    constructor(
        private logger: Logger,
        private networkAdapter: ApiAdapterService,
        private itemService: ItemService
    ) { }

    public searchItems(name: string): Promise<ItemModel[]> {
        return this.networkAdapter.post("/search", "", { name })
        // @ts-ignore
            .then((response) => response.results.map(result => this.itemService.fromResults(result)));
    }
}
