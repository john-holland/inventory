import {ApiAdapterService} from "~/app/services/api-adapter.service";
import {UserModel, UserType} from "~/app/models/user.model";
import {Injectable} from "@angular/core";
import {ITnsOAuthTokenResult} from "nativescript-oauth2";
import {AuthService} from "~/app/services/auth.service";
import {RouterExtensions} from "nativescript-angular";

@Injectable()
export class UserService {
    private isLoggedIn: boolean;

    constructor(
        private readonly localUser: UserModel,
        private readonly networkAdapter: ApiAdapterService,
        private readonly authService: AuthService,
        private readonly routerExtensions: RouterExtensions
    ) {
        this.localUser = new UserModel();
        this.localUser.userType = UserType.LOCAL;
    }

    /**
     * @summary: just a user without a password or personally identifiable information
     */
    getRemoteUser(id: string): Promise<UserModel> {
        return this.networkAdapter.post("/remote-user", "", { id })
            .then(response => UserService.remoteFromResponse(response))
    }

    register(user: UserModel) {
        if (user.userType != UserType.LOCAL) {
            return Promise.reject(new Error("cannot register remote user"));
        }

        return this.networkAdapter.post("/register-user", "", { email: user.email })
            .then(response => this.updateLocalFromResponse(response))
    }

    login(user: UserModel) {
        return new Promise((resolve, reject) => {
            this.authService
                .tnsOauthLogin("google")
                .then((result: ITnsOAuthTokenResult) => {
                    console.log("back to login component with token " + result.accessToken);
                    this.networkAdapter.post("/user/local", "", { id: user.id }).then(response => {
                        this.updateLocalFromResponse(response);
                        this.isLoggedIn = true;
                        this.routerExtensions
                            .navigate(["../home"])
                            .then(() => resolve(this.localUser))
                            .catch(err => console.log("error navigating to /home: " + err));
                    });
                })
                .catch(e => {
                    this.isLoggedIn = false;
                    console.log("Error: " + e)
                });
        });
    }

    resetPassword(email: string) {
        return this.networkAdapter.post("/reset-password", { email })
    }

    getLocalUser() {
        if (this.localUser) {
            return this.localUser
        } else {
            throw new Error("local user should be initialized regardless of validity")
        }
    }

    private static remoteFromResponse(response: Object) {
        let user = new UserModel();

        //@ts-ignore: response object
        user.username = response.username;
        user.userType = UserType.REMOTE;

        return user;
    }

    private updateLocalFromResponse(response: Object) {
        //@ts-ignore: response object
        this.localUser.username = response.username;
        //@ts-ignore: response object
        this.localUser.id = response.id;
        //@ts-ignore: response object
        this.localUser.email = response.email;
        //@ts-ignore: response object
        this.localUser.name = response.name;
    }
}
