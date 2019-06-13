export class UserModel {
    public id: string;
    public name: string;
    public email: string;
    public username: string;
    public password: string;
    public userType: UserType = UserType.REMOTE;
}

export enum UserType {
    /**
     * @summary: the local user
     */
    LOCAL,

    /**
     * @summary: the remote user, without personally identifiable information
     */
    REMOTE
}
