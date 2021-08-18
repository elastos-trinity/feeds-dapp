import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { Events } from 'src/app/services/events.service';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-publishdid',
  templateUrl: './publishdid.page.html',
  styleUrls: ['./publishdid.page.scss'],
})
export class PublishdidPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public title = "04/06";
  public payload: string="";
  public nodeId = "";
  public did = "";
  public lightThemeType:number = 2;
  constructor(
    private events: Events,
    private zone: NgZone,
    private acRoute: ActivatedRoute,
    private native: NativeService,
    private feedService:FeedService,
    private translate:TranslateService,
    public theme:ThemeService,
    private titleBarService: TitleBarService
    ) {

    }

    ngOnInit() {
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
        this.did = data.did;
        this.payload = data.payload;
      });
    }

    ionViewWillEnter() {
      this.initTitle();
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
        });
      });
    }

    ionViewDidEnter() {
    }

    ionViewWillLeave(){
      this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    }


    initTitle(){
      this.titleBarService.setTitle(this.titleBar, this.translate.instant('PublishdidPage.title'));
      this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
      this.titleBarService.setTitleBarMoreMemu(this.titleBar);
    }

    publishDid(){
      if(this.feedService.getConnectionStatus() != 0){
        this.native.toastWarn('common.connectionError');
        return;
      }

      this.doPublishDid();
  }

  doPublishDid(){
    this.feedService.publishDid(this.payload,
      (res)=>{
        this.zone.run(() => {
            //{"action":"didtransaction","result":{"txid":null},"from":"org.elastos.trinity.dapp.wallet"}
            let result = res["result"];
            let txId = result["txid"] || "";
            if(txId===''){
              return;
            }
            this.native.navigateForward(['/bindservice/issuecredential',this.nodeId, this.did],{
              replaceUrl: true
          });
        });
      },
      (err)=>{
        alert("error");
      });
  }

  issueCredential(){
    this.zone.run(() => {
        this.native.navigateForward(['/bindservice/issuecredential',this.nodeId, this.did],{
          replaceUrl: true
        });
    });
  }
}
