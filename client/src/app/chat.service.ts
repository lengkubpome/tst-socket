// import { WebsocketService } from './websocket.service';
// import { Subject } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { Injectable } from '@angular/core';

// @Injectable()
// export class ChatService {
//   message: Subject<any>;
//   constructor(private wsService: WebsocketService) {
//     this.message = <Subject<any>>wsService.connect().pipe(
//       map(
//         (response: any): any => {
//           console.log(response);

//           return response;
//         }
//       )
//     );
//   }

//   sendMsg(msg: string) {
//     this.message.next(msg);
//   }

//   closeMsg(){
//     this.message.unsubscribe();
//   }
// }
