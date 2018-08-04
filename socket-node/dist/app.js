"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const device_1 = require("./device");
const http_1 = require("http");
const serial_port_1 = require("./serial-port");
const express = require("express");
const bodyPasrser = require("body-parser");
const socketIo = require("socket.io");
const rxjs_1 = require("rxjs");
class MyServer {
    constructor() {
        // Device
        this.device = new device_1.Device();
        // Serial Port
        this._serialPort = new serial_port_1.tstSerialPort();
        this.clientLimit = 3;
        this._serialport_state$ = new rxjs_1.Subject();
        this._serialport_data$ = new rxjs_1.Subject();
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
        this.setSerialPort();
    }
    createApp() {
        this.app = express();
        // add option
        this.app.use(bodyPasrser.json());
        this.app.use(bodyPasrser.urlencoded({ extended: false }));
        this.app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
            next();
        });
    }
    createServer() {
        this.server = http_1.createServer(this.app);
    }
    config() {
        this._serverPort = process.env.PORT || MyServer.PORT;
    }
    sockets() {
        this.io = socketIo(this.server);
    }
    setSerialPort() {
        if (this._serialPort.isOpen()) {
            this.closeSerialPort();
        }
        this.device.fetchSetup().then(setup => {
            const setupOptionSerialPort = {
                portName: setup.serial_port.port_name,
                option: {
                    baudRate: setup.serial_port.baud_rate,
                    dataBits: setup.serial_port.data_bits,
                    stopBits: setup.serial_port.stop_bits,
                    parity: setup.serial_port.parity,
                },
            };
            const setupClientLimit = setup.client_limit;
            // setup new config
            this._serialPort_setup = setupOptionSerialPort;
            this.clientLimit = setupClientLimit;
            this.openSerialPort();
        });
    }
    openSerialPort() {
        if (!this._serialPort.isOpen() || this._serialPort_setup === null) {
            this._serialPort.openPort(this._serialPort_setup).subscribe(data => {
                this._serialport_state$.next('SerialPort is opening');
                this._serialport_data$.next(data);
            }, error => {
                this._serialport_state$.next(error);
            }, () => {
                this._serialport_state$.next('SerialPort is closing');
                let restart = setInterval(() => {
                    this.openSerialPort();
                    if (this._serialPort.isOpen()) {
                        clearInterval(restart);
                    }
                }, 2000);
            });
        }
        else {
            console.log('[SerialPort] is opening or maybe setup is null');
        }
    }
    closeSerialPort() {
        if (this._serialPort.isOpen()) {
            this._serialPort.closePort();
        }
    }
    listen() {
        this.server.listen(this._serverPort, () => {
            console.log('Running server on port %s', this._serverPort);
        });
        let clients = [];
        let socket_reserve = '';
        this.io.on('connection', (socket) => {
            // Client Limit
            if (clients.length < this.clientLimit) {
                let subscription_state = this._serialport_state$.subscribe(state => {
                    this.io.sockets.emit('broadcast_serialport', state);
                });
                let subscriptoion_data = this._serialport_data$.subscribe(data => {
                    // check if have another reserve
                    if (socket_reserve === socket.id) {
                        socket.emit('serialport_get_data', data);
                    }
                });
                socket.on('serialport_start_data', () => {
                    if (socket_reserve === '') {
                        const client_reserve = clients.filter(client => client.socketId === socket.id)[0];
                        console.log('[Client] ' + client_reserve.username + ' start get data');
                        socket_reserve = client_reserve.socketId;
                    }
                    else {
                        // TODO: สร้างช่องทางการแจ้งเตือนให้กับ Client
                    }
                });
                socket.on('serialport_stop_data', () => {
                    if (socket_reserve === socket.id) {
                        console.log('[Client] stop get data');
                        socket_reserve = '';
                    }
                });
                // Client register first
                socket.emit('client_register');
                socket.on('client_register', (client) => {
                    clients.push(Object.assign({}, client, { status: '', socketId: socket.id }));
                    // sending to all clients except sender
                    this.io.sockets.emit('broadcast_users', clients);
                    console.log('[Client] %s connected on port %s.', client.username, this._serverPort);
                });
                // Check client disconnect
                socket.on('disconnect', () => {
                    clients = clients.filter(client => client.socketId !== socket.id);
                    this.io.sockets.emit('broadcast_users', clients);
                    console.log('some client leave. : ' + socket.id);
                    if (socket_reserve === socket.id) {
                        socket_reserve = '';
                    }
                    subscription_state.unsubscribe();
                    subscriptoion_data.unsubscribe();
                });
                //END Check client disconnect
                // TODO: ตรงส่วนนี้อาจจะไม่ได้ใช่
                socket.on('serialport_open', () => {
                    console.log('[Client] open SerialPort');
                    this.setSerialPort();
                });
                socket.on('serialport_close', () => {
                    console.log('[Client] close SerialPort');
                    this.closeSerialPort();
                });
                socket.on('list', () => {
                    const list = this._serialPort.listPort();
                    console.log('[Client] get list serialposrt');
                    this.io.emit('list', list);
                });
                socket.on('config', (req) => {
                    if (req.call === 'get') {
                        console.log('[Client] get config serialport');
                        this.io.emit('config', {
                            config: this._serialPort.getPortConfig(),
                            message: new Date(Date.now()).toString(),
                        });
                    }
                });
                //END: ตรงส่วนนี้อาจจะไม่ได้ใช่
            }
            else {
                socket.emit('client_limit', 'Disconnected server : Limited 3 clients.');
                console.log('[Client] try to connect server.');
            } //END Client Limit
        });
    }
    getApp() {
        return this.app;
    }
}
MyServer.PORT = 8000;
exports.MyServer = MyServer;
