import { WebsocketService } from './websocket.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
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
      .subscribe((res) => {
        this.message = res;
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

  sendMessage() {
    this.wsService.callData();
  }

  onDisconnect() {
    this.wsService.endData();
  }

  onCallSerialPortList() {
    this.wsService.callSerialPortList();
  }

  onGetPortConfig() {
    this.wsService.callSerialPortConfig();
  }
}