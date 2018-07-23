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
        this.serialport = new SerialPort(this.portName, {
            // autoOpen: false,
            autoOpen: true,
            baudRate: this.baudRate,
            dataBits: this.dataBits,
            stopBits: this.stopBits,
            parity: this.parity,
        });
        this.parser = this.serialport.pipe(new Readline({ delimiter: '\r\n' }));
        console.log(this.serialport.isOpen);
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
        // this.serialport.on('close', () => {
        //   console.log('[SerialPort] is close');
        // });
        // // Open errors will be emitted as an error event
        // this.serialport.on('error', err => {
        //   console.log('[SerialPort] is %s', err);
        // });
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
    isOpen() {
        return this._isOpen;
    }
    closePort() {
        clearInterval(this.NodeTime);
        this._isOpen = false;
        this.serialport.close();
    }
}
exports.tstSerialPort = tstSerialPort;
