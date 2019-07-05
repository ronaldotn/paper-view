import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {Previewer} from 'paper-view';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [Previewer],
  bootstrap: [AppComponent]
})
export class AppModule { }
