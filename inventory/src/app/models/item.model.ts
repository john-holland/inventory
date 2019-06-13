import {UserModel} from "~/app/models/user.model";

export class ItemModel {
    id: string;
    name: string;
    owner: UserModel;
    holder: UserModel;
    isBeingReturned: boolean;
}
