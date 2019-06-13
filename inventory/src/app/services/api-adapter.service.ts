/**
 * the network adapter provides a simple service for making authenticated network requests,
 *  specifically to inventory api
 *
 *  not sure this is actually useful with the advent of request auth interceptor
 *   though i think it likely will be handy for configuration purposes
 */
import {Injectable} from "@angular/core";

const API_PREFIX = "some gnarly url";

@Injectable()
export class ApiAdapterService {

    constructor(
    ) {}

    getAuthenticationHeaders() {
    }

    static addSlashIfNecessary(path) {
        return path && path.indexOf("/") == 0 ? path : "/" + (path ? path : "");
    }

    get(path: string, queryString?): Promise<Object> {
        let requestUrl = this.getRequestUrl(path);
        return new Promise<Object>((resolve, reject) => {
            let headers = this.getAuthenticationHeaders();
           reject("not implemented!")
        });
    }

    post(path: string, queryString?, postBody: Object={}): Promise<Object> {
        let requestUrl = this.getRequestUrl(path);
        return new Promise<Object>((resolve, reject) => {
            let headers = this.getAuthenticationHeaders();
            reject("not implemented!")
        });
    }

    put(path: string, queryString?, postBody: Object={}): Promise<Object> {
        let requestUrl = this.getRequestUrl(path);
        return new Promise<Object>((resolve, reject) => {
            let headers = this.getAuthenticationHeaders();
            reject("not implemented!")
        });
    }

    delete(path: string, queryString?): Promise<Object> {
        let requestUrl = this.getRequestUrl(path);
        return new Promise<Object>((resolve, reject) => {
            let headers = this.getAuthenticationHeaders();
            reject("not implemented!")
        });
    }

    private getRequestUrl(path: string) {
        return API_PREFIX + ApiAdapterService.addSlashIfNecessary(path);
    }
}
