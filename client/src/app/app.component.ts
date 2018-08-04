import { WebsocketService } from './websocket.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  serialPort_state: any;
  message: any;
  list = [];
  ioConnection: any;

  constructor(private wsService: WebsocketService) {}

  ngOnInit(): void {
    this.wsService.initSocket();

    this.ioConnection = this.wsService
      .getData()
      // .subscribe((res: { state: string; integer: number; decimal: number }) => {
      //   this.message = res;
      // });
      .subscribe(res => {
        this.message = res;
      });

    this.wsService.broadcastSerialPort().subscribe(res => {
      this.serialPort_state = res;
    });

    this.wsService.getSerialPortList().subscribe(res => {
      this.list = res.map(obj => obj.comName);
      console.log(this.list);
    });

    this.wsService.getSerialPortConfig().subscribe(res => {
      console.log(res);
    });

    this.wsService.broadcastUsers().subscribe(res => {
      console.log(res);
    });
  }

  onConnectData() {
    this.wsService.callData();
  }

  onDisconnectData() {
    this.wsService.endData();
  }

  onOpenSerialPort() {
    this.wsService.openSerialPort();
  }
  onCloseSerialPort() {
    this.wsService.closeSerialPort();
  }

  onCallSerialPortList() {
    this.wsService.callSerialPortList();
  }

  onGetPortConfig() {
    this.wsService.callSerialPortConfig();
  }
}
