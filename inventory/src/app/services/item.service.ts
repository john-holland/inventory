import {UserService} from "~/app/services/user.service";
import {ItemModel} from "~/app/models/item.model";
import {Injectable} from "@angular/core";
import {UserModel} from "~/app/models/user.model";
import {ApiAdapterService} from "~/app/services/api-adapter.service";

@Injectable()
export class ItemService {
    constructor(
        private userService: UserService,
        private networkAdapterService: ApiAdapterService
    ) { }

    public fromResponse(response: object): Promise<ItemModel> {
        let itemModel = new ItemModel();

        //@ts-ignore: response object
        itemModel.id = response.id;
        //@ts-ignore: response object
        itemModel.name = response.name;

        return new Promise<ItemModel>((resolve, reject) => {
            //we need to wait for both the holder and owner objects to get back
            let promises = [];

            if (itemModel.id == this.userService.getLocalUser().id) {
                itemModel.holder = this.userService.getLocalUser();
            } else {
                //@ts-ignore: response object
                promises.push(this.userService.getRemoteUser(response.holderid).then((user: UserModel) => {
                    // if the item is owned by the local user, then set the owner to the local user
                    itemModel.holder = user;
                }).catch(error => reject(error)));
            }

            if (itemModel.id == this.userService.getLocalUser().id) {
                itemModel.owner = this.userService.getLocalUser();
            } else {
                //@ts-ignore: response object
                promises.push(this.userService.getRemoteUser(response.ownerid).then((user: UserModel) => {
                    // if the item is owned by the local user, then set the owner to the local user
                    itemModel.owner = user;
                }).catch(error => reject(error)));
            }

            Promise.all(promises).then(() => resolve(itemModel));
        });
    }

    public getOwnedItems(user: UserModel) {
        return this.networkAdapterService.post("/items/owned-items", "", { id: user.id })
            //@ts-ignore: request object
            .then(response => response.items.map(item => this.fromResponse(item)));
    }

    public getItemById(id: string) {
        return this.networkAdapterService.post("/items/id", "", { id }).then(this.fromResponse)
    }

    public requestItem(id: string) {
        return this.networkAdapterService.post("/items/request", "", { id })
    }

    returnItem(id: string) {
        return this.networkAdapterService.post("/items/return", "", { id })
    }

    itemReturned(id: string) {
        return this.networkAdapterService.post("/items/confirm-return", "",
            { itemId: id, returnerId: this.userService.getLocalUser().id })
    }

    getBrowseableItems() {
        return this.networkAdapterService.post("/items/browseable", "", {})
        //@ts-ignore: request object
            .then(response => response.items.map(item => this.fromResponse(item)));
    }
}
