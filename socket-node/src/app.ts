import { Observable } from 'rxjs';
import { createServer, Server } from 'http';
import { tstSerialPort, SerialPortConfig } from './serial-port';
import * as express from 'express';
import * as bodyPasrser from 'body-parser';
import * as socketIo from 'socket.io';
import { error } from 'util';

export class MyServer {
  public static readonly PORT: number = 8000;
  private app: express.Application;
  private server: Server;
  private io: SocketIO.Server;
  private _serverPort: string | number;
  private _serialPort: tstSerialPort = new tstSerialPort();

  constructor() {
    this.createApp();
    this.config();
    this.createServer();
    this.sockets();
    this.listen();
  }

  private createApp(): void {
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
  private createServer(): void {
    this.server = createServer(this.app);
    // this.server.maxConnections = 4; //ตั้งค่าปริมาณ client
  }
  private config(): void {
    this._serverPort = process.env.PORT || MyServer.PORT;
  }

  private sockets(): void {
    this.io = socketIo(this.server);
  }

  private serialPort(): void {
    const setupSerialPort: SerialPortConfig = {
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

  private listen(): void {
    this.server.listen(this._serverPort, () => {
      console.log('Running server on port %s', this._serverPort);
    });

    this.serialPort();

    let timeInterval = 0;
    let clients: Array<{ username: string; mac: string; status: string; socketId: string }> = [];
    let connectingSerialPort: string = '';

    this.io.on('connection', (socket: any) => {
      // Client register first
      socket.emit('client_register');
      socket.on('client_register', (client: { username: string; mac: string }) => {
        clients.push({ ...client, status: 'connected', socketId: socket.id });
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

      this._serialPort.getData().subscribe(
        data => {
          this.io.sockets.emit('data', data);
        },
        error => {
          this.io.sockets.emit('data', error);
        },
        () => {
          this.io.sockets.emit('data', '[SerialPort] is Close');
        },
      );

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

      socket.on('config', (req: { call: string; setConfig: {} }) => {
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

  public getApp(): express.Application {
    return this.app;
  }
}
