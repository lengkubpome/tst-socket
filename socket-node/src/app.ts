
import { createServer, Server } from 'http';
import { tstSerialPort, SerialPortConfig } from './serial-port';
import * as express from 'express';
import * as bodyPasrser from 'body-parser';
import * as socketIo from 'socket.io';

export class MyServer {
  public static readonly PORT: number = 8000;
  private app: express.Application;
  private server: Server;
  private io: SocketIO.Server;
  private _serverPort: string | number;

  // Serial Port
  private _serialPort: tstSerialPort = new tstSerialPort();
  private _serialport_data: any;
  private _serialPort_setup: SerialPortConfig ;
  private clientLimit = 3;

  constructor() {
    this.createApp();
    this.config();
    this.createServer();
    this.sockets();
    this.listen();
    this.fetchSerialPortConfig();
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

  private fetchSerialPortConfig() {
    if (this._serialPort.isOpen()) {
      this.closeSerialPort();
    }
    // Download config port Here!!
    let setupOptionSerialPort = {
      portName: '/dev/tty.usbserial-FTA573YH',
      option: {
        baudRate: 4800,
        dataBits: 7,
        stopBits: 1,
        parity: 'even',
      }
    };
    let setupClientLimit = 3;
    //END Download config port Here!!

    // setup new config
    this._serialPort_setup = setupOptionSerialPort;
    this.clientLimit = setupClientLimit;
    this.openSerialPort();
  }
  private openSerialPort(): void {
    if (!this._serialPort.isOpen() || this._serialPort_setup === null) {
      this._serialPort.openPort(this._serialPort_setup);

      this._serialPort.getData().subscribe(
        data => {
          this._serialport_data = data;
        },
        error => {
          this._serialport_data = error;
        },
        () => {
          this._serialport_data = '[SerialPort] is Close';
        },
      );
    }
  }

  private closeSerialPort(): void {
    if (this._serialPort.isOpen()) {
      this._serialPort.closePort();
    }
  }

  private listen(): void {
    this.server.listen(this._serverPort, () => {
      console.log('Running server on port %s', this._serverPort);
    });


    let clients: Array<{ username: string; mac: string; status: string; socketId: string }> = [];

    this.io.on('connection', (socket: any) => {
      // Client Limit
      if (clients.length < this.clientLimit) {
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
          clients = clients.filter(client => client.socketId !== socket.id);
          this.io.sockets.emit('broadcast_users', clients);
          console.log('some client leave. : ' + socket.id);
        });
        //END Check client disconnect

        let interval;
        socket.on('serialport_start_data', () => {
          console.log('[Client] start get data');
          clearInterval(interval);
          interval = setInterval(() => {
            socket.emit('serialport_get_data', this._serialport_data);
          }, 1000);
        });

        socket.on('serialport_stop_data', () => {
          console.log('[Client] stop get data');
          clearInterval(interval);
        });

        // TODO: ตรงส่วนนี้อาจจะไม่ได้ใช่
        socket.on('serialport_open', () => {
          console.log('[Client] open SerialPort');
          this.openSerialPort();
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

        socket.on('config', (req: { call: string; setConfig: {} }) => {
          if (req.call === 'get') {
            console.log('[Client] get config serialport');
            this.io.emit('config', {
              config: this._serialPort.getPortConfig(),
              message: new Date(Date.now()).toString(),
            });
          }
        });
         //END: ตรงส่วนนี้อาจจะไม่ได้ใช่

      }else{
        socket.emit('client_limit', 'Disconnected server : Limited 3 clients.')
        console.log("[Client] try to connect server.");
      }//END Client Limit
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}
