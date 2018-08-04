"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
class tstSerialPort {
    constructor() {
        this.ports = [];
        this._isOpen = false;
        // this.listPort();
    }
    openPort(setup) {
        return new Observable_1.Observable(observer => {
            SerialPort.list()
                .then(ports => {
                this.ports = [];
                ports.forEach(port => {
                    if (port.comName === setup.portName) {
                        this.serialport = new SerialPort(setup.portName, {
                            autoOpen: true,
                            baudRate: setup.option.baudRate,
                            dataBits: setup.option.dataBits,
                            stopBits: setup.option.stopBits,
                            parity: setup.option.parity,
                        });
                        this.parser = this.serialport.pipe(new Readline({ delimiter: '\r\n' }));
                        this.serialport.on('open', () => {
                            this._isOpen = true;
                            console.log('[Serialport] is opening');
                        });
                        this.serialport.on('close', () => {
                            clearInterval(NodeTimeX);
                            console.log('[SerialPort] is closing');
                            this._isOpen = false;
                            observer.complete();
                        });
                        // Open errors will be emitted as an error event
                        this.serialport.on('error', err => {
                            console.log('[SerialPort] ' + err);
                            observer.error('[SerialPort] ' + err);
                        });
                        this.parser.on('data', (data) => {
                            // let buff = new Buffer(data, 'ascii');
                            observer.next(data);
                        });
                        let x = 0;
                        let NodeTimeX = setInterval(() => {
                            x++;
                            observer.next(x);
                            console.log('srp ' + x);
                        }, 1000);
                    }
                    // collect list port
                    this.ports.push(port);
                });
                // waiting 500 milisec. for get state this._isOpen
                setTimeout(() => {
                    if (!this._isOpen) {
                        console.log("Don't found port name :" + setup.portName);
                        observer.error("Don't found port name :" + setup.portName);
                    }
                }, 500);
            })
                .catch(error => {
                console.log('[SerailPort] catch ' + error);
            });
        });
    }
    getPortConfig() {
        return {
            portName: this.portName,
            baudRate: this.baudRate,
            dataBits: this.dataBits,
            stopBits: this.stopBits,
            parity: this.parity,
        };
    }
    listPort() {
        return this.ports;
    }
    closePort() {
        try {
            this.serialport.close();
            this._isOpen = false;
        }
        catch (error) {
            console.log(error);
        }
    }
    isOpen() {
        return this._isOpen;
    }
}
exports.tstSerialPort = tstSerialPort;
