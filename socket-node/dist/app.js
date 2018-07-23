"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const serial_port_1 = require("./serial-port");
const express = require("express");
const bodyPasrser = require("body-parser");
const socketIo = require("socket.io");
class MyServer {
    constructor() {
        this._serialPort = new serial_port_1.tstSerialPort();
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
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
        // this.server.maxConnections = 4; //ตั้งค่าปริมาณ client
    }
    config() {
        this._serverPort = process.env.PORT || MyServer.PORT;
    }
    sockets() {
        this.io = socketIo(this.server);
    }
    serialPort() {
        const setupSerialPort = {
            portName: '/dev/tty.usbserial-FTA573YH',
            // portName: '/dev/tty.Leng-Bose-SPPDev-9',
            option: {
                baudRate: 4800,
                dataBits: 7,
                stopBits: 1,
                parity: 'even',
            },
        };
        this._serialPort.openPort(setupSerialPort);
    }
    listen() {
        this.server.listen(this._serverPort, () => {
            console.log('Running server on port %s', this._serverPort);
        });
        this.serialPort();
        let timeInterval = 0;
        let clients = [];
        let connectingSerialPort = '';
        this.io.on('connection', (socket) => {
            // Client register first
            socket.emit('client_register');
            socket.on('client_register', (client) => {
                clients.push(Object.assign({}, client, { status: 'connected', socketId: socket.id }));
                // sending to all clients except sender
                this.io.sockets.emit('broadcast_users', clients);
                console.log('[Client] %s connected on port %s.', client.username, this._serverPort);
            });
            // Check client disconnect
            socket.on('disconnect', () => {
                if (clients.length === 1) {
                    this._serialPort.closePort();
                }
                clients = clients.filter(client => client.socketId !== socket.id);
                this.io.sockets.emit('broadcast_users', clients);
                console.log('some client leave. : ' + socket.id);
            });
            //END Check client disconnect
            this._serialPort.getData().subscribe(data => {
                this.io.sockets.emit('data', data);
            }, error => {
                this.io.sockets.emit('data', error);
            }, () => {
                this.io.sockets.emit('data', '[SerialPort] is Close');
            });
            socket.on('serialport_connect', username => {
                console.log('[Client] check serial connect');
            });
            socket.on('serialport_disconnect', username => {
                this._serialPort.closePort();
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
        });
    }
    getApp() {
        return this.app;
    }
}
MyServer.PORT = 8000;
exports.MyServer = MyServer;
