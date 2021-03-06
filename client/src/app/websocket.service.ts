import { environment } from './../environments/environment';
import { Injectable } from '@angular/core';

import * as socketIo from 'socket.io-client';
import { Observable } from 'rxjs';

const SERVER_URL = 'http://localhost:8000';

interface SerialPortConfig {
  portName: string;
  option: {
    baudRate: any;
    dataBits: any;
    stopBits: any;
    parity: any;
  };
}

@Injectable()
export class WebsocketService {
  private socket;
  private username = Math.floor(1000 + Math.random() * 9000).toString();
  private macAddress = 'macAddress';

  constructor() {}

  public initSocket(): void {
    this.socket = socketIo(SERVER_URL);

    // Listen for connect
    this.socket.on('client_register', () => {
      this.socket.emit('client_register', {
        username: this.username
      });
    });

    this.socket.on('client_limit', data => {
      this.socket.disconnect();
      console.log(data);
    });
  }

  public callData(): void {
    this.socket.emit('serialport_start_data');
  }

  public endData(): void {
    this.socket.emit('serialport_stop_data');
  }

  public openSerialPort() {
    this.socket.emit('serialport_open');
  }

  public closeSerialPort() {
    this.socket.emit('serialport_close');
  }

  public callSerialPortList(): void {
    this.socket.emit('list');
  }

  public callSerialPortConfig() {
    this.socket.emit('config', { call: 'get' });
  }

  public broadcastUsers(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('broadcast_users', data => {
        observer.next(data);
      });
    });
  }
  public broadcastSerialPort(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('broadcast_serialport', data => {
        observer.next(data);
      });
    });
  }

  public getData(): Observable<{ state: string; integer: number; decimal: number }> {
    return new Observable<{ state: string; integer: number; decimal: number }>(observer => {
      this.socket.on('serialport_get_data', data => {
        // const result = tstConvertSerialPort(data);
        observer.next(data);
        console.log(data);


        // observer.next(res);
      });
    });
  }
  // public getData(): Observable<any> {
  //   return new Observable<any>(observer => {
  //     this.socket.on('serialport_get_data', data => {
  //       observer.next(data);
  //     });
  //   });
  // }

  public getSerialPortState(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('state', data => {
        observer.next(data);
      });
    });
  }
  public getSerialPortList(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('list', data => {
        observer.next(data);
      });
    });
  }
  public getSerialPortConfig(): Observable<any> {
    return new Observable<any>(observer => {
      this.socket.on('config', data => {
        observer.next(data);
      });
    });
  }
}

function tstConvertSerialPort(data: string): { state: string; integer: number; decimal: number } {
  // const state = data.substr(2, 1);
  let state: string;
  const integer = Number(data.substr(3, 7));
  const decimal = Number(data.substr(10, 6));
  if (data.substr(2, 1) === '0') {
    state = 'allow';
  } else {
    state = 'deny';
  }
  return { state: state, integer: integer, decimal: decimal };

  // รูปแบบข้อมูล
  // state  integer(จำนวนเต็ม)   decimal (ทศนิยม)
  // 022830 20202020202030     202020202030
  // . ( 0            1675                0
}
