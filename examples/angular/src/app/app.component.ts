import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Previewer} from 'paper-view';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    title = 'Paper View Test';
    @ViewChild('render', {read: ElementRef}) refRender: ElementRef;
    @ViewChild('content', {read: ElementRef}) refContent: ElementRef;

    ngOnInit() {
        const paged = new Previewer();
        paged.preview(this.refContent.nativeElement , this.refRender.nativeElement, []);
    }

}
