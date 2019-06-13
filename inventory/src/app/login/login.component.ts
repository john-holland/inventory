import {Component, OnInit} from "@angular/core";
import { alert, prompt } from "tns-core-modules/ui/dialogs";
import {UserModel} from "~/app/models/user.model";
import {UserService} from "~/app/services/user.service";

@Component({
    moduleId: module.id,
    templateUrl: "./login.component.html"
})
export class LoginComponent implements OnInit {
    isLoggingIn = true;
    user: UserModel;

    constructor(
        private userService: UserService
    ) { }

    ngOnInit(): void {
        this.user = this.userService.getLocalUser();
    }

    toggleForm() {
        this.isLoggingIn = !this.isLoggingIn;
    }

    submit() {
        if (!this.user.email || !this.user.password) {
            alert({ message: "Please provide both an email address and password." });
            return;
        }

        if (this.isLoggingIn) {
            // Perform the login
            this.userService.login(this.user);
        } else {
            // Perform the registration
            this.userService.register(this.user);
        }
    }

    forgotPassword() {
        prompt({
            title: "Forgot Password",
            message: "Enter the email address you used to register for APP NAME to reset your password.",
            defaultText: "",
            okButtonText: "Ok",
            cancelButtonText: "Cancel"
        }).then((data) => {
            if (data.result) {
                // Call the backend to reset the password
                this.userService.resetPassword(data.text).then(() => alert({
                    title: "APP NAME",
                    message: "Please check your email for instructions on choosing a new password.",
                    okButtonText: "Ok"
                }))
            }
        });
    }
}
