"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const operators_1 = require("rxjs/operators");
const address = require('address');
const got = require('got');
class Device {
    constructor() {
        address.mac((err, addr) => {
            if (err)
                throw console.log('MacAddress has : %s', err);
            this.macAddress = addr;
        });
        this.ip$ = Observable_1.Observable.create(observer => {
            const interval = setInterval(() => {
                observer.next(address.ip());
            }, 1000); // 1 min.
            return () => clearInterval(interval);
        });
        this.ip$.pipe(operators_1.distinctUntilChanged()).subscribe(ip => {
            this.uploadLocalIp(ip);
        });
    }
    uploadLocalIp(localIp) {
        if (localIp !== undefined || localIp !== null) {
            (() => __awaiter(this, void 0, void 0, function* () {
                try {
                    const response = yield got.post('http://localhost:5000/tst-application/us-central1/updateIpDevice', {
                        // const response = await got.post('https://us-central1-tst-application.cloudfunctions.net/updateIpDevice', {
                        query: {
                            mac: this.macAddress,
                            ip: localIp,
                        },
                    });
                    const data = response.body;
                    console.log(data);
                    return data;
                }
                catch (error) {
                    console.log('Error :' + error.response.body);
                    return 'Error :' + error.response.body;
                }
            }))();
            console.log('%s has change ip to %s', this.macAddress, localIp);
        }
    }
    fetchSetup() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield got.get('http://localhost:5000/tst-application/us-central1/getDeviceSetup', {
                    // const response = await got.get('https://us-central1-tst-application.cloudfunctions.net/getDeviceSetup', {
                    query: {
                        mac: this.macAddress,
                    },
                });
                if (response.body !== '') {
                    const data = JSON.parse(response.body);
                    //  { status: string,
                    //    client_limit: number,
                    //    local_ip: string ,
                    //    serial_port:
                    //      { port_name: string,
                    //        parity: string,
                    //        data_bits: number,
                    //        baud_rate: number,
                    //        stop_bits: number
                    //      }
                    // }
                    return data;
                }
                else {
                    console.log('Not found');
                    return null;
                }
            }
            catch (error) {
                console.log('Error ' + error.response.body);
                return 'Error ' + error.response.body;
            }
        });
    }
    stop() {
        this.ip$.unsubscribe();
    }
}
exports.Device = Device;
