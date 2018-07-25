
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import * as SerialPort from 'serialport';
const Readline = require('@serialport/parser-readline');

export interface SerialPortConfig {
  portName: string;
  option: {
    baudRate: any;
    dataBits: any;
    stopBits: any;
    parity: any;
  };
}
export class tstSerialPort {
  private serialport;
  private portName;
  private baudRate;
  private dataBits;
  private stopBits;
  private parity;
  private ports = [];
  private parser;
  private _isOpen = false;

  constructor() {
    this.listPort();
  }

  private setup() {
    try {
      this.serialport = new SerialPort(
        this.portName,
        {
          // autoOpen: false,
          autoOpen: true,
          baudRate: this.baudRate,
          dataBits: this.dataBits,
          stopBits: this.stopBits,
          parity: this.parity,
        },
        error => {
          if (error !== null) {
            console.log('[SerialPort] setup %s', error);
          }
        },
      );
      if (!this.serialport.isOpen) {
        this._isOpen = true;
      }
      this.parser = this.serialport.pipe(new Readline({ delimiter: '\r\n' }));
    } catch (error) {
      console.log('[SerialPort] setup get catch : %s', error);
    }
  }


  NodeTime: NodeJS.Timer;
  timeInterval = 0;

  public openPort(config: SerialPortConfig) {
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

  public getData(): Observable<any> {
    return new Observable<any>(observer => {
      this.serialport.on('close', () => {
        console.log('[SerialPort] is close');
        observer.complete();
      });
      // Open errors will be emitted as an error event
      this.serialport.on('error', err => {
        console.log('[SerialPort] is %s', err);
        observer.error(err);
      });

      this.parser.on('data', (data: string) => {
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

  public getPortConfig() {
    return {
      portName: this.portName,
      baudRate: this.baudRate,
      dataBits: this.dataBits,
      stopBits: this.stopBits,
      parity: this.parity,
    };
  }

  public listPort(): Array<string> {
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

  public closePort() {
    try {
      clearInterval(this.NodeTime);
      this.serialport.close();
      this._isOpen = false;
    } catch (error) {
      console.log(error);
    }
  }

  public isOpen(): boolean {
    return this._isOpen;
  }
}
