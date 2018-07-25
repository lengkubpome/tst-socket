"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Observable_1 = require("rxjs/Observable");
require("rxjs/add/observable/of");
const SerialPort = require("serialport");
const Readline = require('@serialport/parser-readline');
class tstSerialPort {
    constructor() {
        this.ports = [];
        this._isOpen = false;
        this.timeInterval = 0;
        this.listPort();
    }
    setup() {
        try {
            this.serialport = new SerialPort(this.portName, {
                // autoOpen: false,
                autoOpen: true,
                baudRate: this.baudRate,
                dataBits: this.dataBits,
                stopBits: this.stopBits,
                parity: this.parity,
            }, error => {
                if (error !== null) {
                    console.log('[SerialPort] setup : %s', error);
                }
            });
            if (!this.serialport.isOpen) {
                this._isOpen = true;
            }
            this.parser = this.serialport.pipe(new Readline({ delimiter: '\r\n' }));
        }
        catch (error) {
            console.log('[SerialPort] setup get catch : %s', error);
        }
    }
    openPort(config) {
        this.portName = config.portName;
        this.baudRate = config.option.baudRate;
        this.dataBits = config.option.dataBits;
        this.stopBits = config.option.stopBits;
        this.parity = config.option.parity;
        this.setup();
        this.serialport.on('open', () => {
            console.log('[Serialport] is open');
        });
    }
    getData() {
        return new Observable_1.Observable(observer => {
            this.serialport.on('close', () => {
                console.log('[SerialPort] is close');
                observer.complete();
            });
            // Open errors will be emitted as an error event
            this.serialport.on('error', err => {
                console.log('[SerialPort] is %s', err);
                observer.error(err);
            });
            this.parser.on('data', (data) => {
                // let buff = new Buffer(data, 'ascii');
                observer.next(data);
            });
            this.NodeTime = setInterval(() => {
                this.timeInterval++;
                observer.next(this.timeInterval);
                console.log(this.timeInterval);
            }, 1000);
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
        SerialPort.list()
            .then(ports => {
            this.ports = [];
            ports.forEach(port => {
                this.ports.push(port);
            });
        })
            .catch(err => {
            console.log(err);
        });
        return this.ports;
    }
    closePort() {
        try {
            clearInterval(this.NodeTime);
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
