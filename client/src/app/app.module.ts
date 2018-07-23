// import { ChatService } from './chat.service';
import { WebsocketService } from './websocket.service';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [WebsocketService],
  bootstrap: [AppComponent]
})
export class AppModule {}
