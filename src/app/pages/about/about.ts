import { Component, OnInit, NgZone } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';

@Component({
  selector: 'page-about',
  templateUrl: './about.html',
  styleUrls: ['./about.scss'],
})

export class AboutPage implements OnInit {
  public version = "0.6";

  constructor(
    private zone: NgZone,
    public native: NativeService
    ) {}

  ngOnInit() {
  }

  goWebsite() {
    this.native.openUrl("http://www.elastos.org");
  }

}
