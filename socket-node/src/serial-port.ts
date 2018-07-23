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

  public onData: Observable<any>;
  private _isOpen = false;

  constructor() {
    this.listPort();
  }

  private setup() {
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
      // error => {
      //   console.log('[SerialPort] setup : %s', error);
      // },
    );
    this.parser = this.serialport.pipe(new Readline({ delimiter: '\r\n' }));
 
 
    console.log(this.serialport.isOpen);
    
  }

  // FIXME: ปรับเปลี่ยนใหม่
  // public openPort(config: SerialPortConfig): Observable<any> {
  //   this.portName = config.portName;
  //   this.baudRate = config.option.baudRate;
  //   this.dataBits = config.option.dataBits;
  //   this.stopBits = config.option.stopBits;
  //   this.parity = config.option.parity;

  //   this.setup();
  //   this.serialport.open(err => {
  //     if (err) {
  //       return console.log('Error opening port:', err.message);
  //     }
  //   });

  //   return new Observable<{ state: any; value: any }>(observer => {
  //     this.serialport.on('open', () => {
  //       observer.next({ state: 'open_port', value: 'Serialport is open' });
  //     });

  //     this.serialport.on('close', () => {
  //       observer.complete();
  //     });
  //     // Open errors will be emitted as an error event
  //     this.serialport.on('error', err => {
  //       observer.error(err);
  //     });

  //     this.parser.on('data', (data: string) => {
  //       // let buff = new Buffer(data, 'ascii');
  //       console.log(data);
  //       observer.next({ state: 'get_data', value: data });
  //     });
  //   });
  // }

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


    // this.serialport.on('close', () => {
    //   console.log('[SerialPort] is close');
    // });
    // // Open errors will be emitted as an error event
    // this.serialport.on('error', err => {
    //   console.log('[SerialPort] is %s', err);
    // });

  }



  public getData(): Observable<any> {


    return new Observable<any>(observer =>{

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
      }, 1000);
    })
   
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

  public isOpen() {
    return this._isOpen;
  }

  public closePort() {
    clearInterval(this.NodeTime);
    this._isOpen = false;
    this.serialport.close();
  }
}
