"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const operators_1 = require("rxjs/operators");
const address = require('address');
const Client = require('node-rest-client').Client;
class UploadLocalIp {
    constructor() {
        // private local_ip = null;
        this.client = new Client();
        this.initial();
    }
    initial() {
        address.mac((err, addr) => {
            if (err)
                throw console.log('MacAddress has : %s', err);
            this.macAddress = addr;
        });
        this.event$ = Observable_1.Observable.create(observer => {
            const interval = setInterval(() => {
                observer.next(address.ip());
            }, 1000); // 1 min.
            return () => clearInterval(interval);
        });
        this.event$.pipe(operators_1.distinctUntilChanged()).subscribe(ip => {
            this.uploadToCloud(ip);
        });
    }
    uploadToCloud(localIp) {
        if (localIp !== undefined || localIp !== null) {
            let args = {
                parameters: { mac: this.macAddress, ip: localIp, port: 3030 },
                headers: { "Content-Type": "application/json" }
            };
            this.client.post('https://us-central1-tst-application.cloudfunctions.net/updateIpDevice', args, function (data, response) {
                // parsed response body as js object
                // console.log(data);
                // raw response
                // console.log(response);
            });
            // this.local_ip = localIp;
            console.log('%s has change ip to %s', this.macAddress, localIp);
        }
    }
    stop() {
        this.event$.unsubscribe();
    }
}
exports.UploadLocalIp = UploadLocalIp;
