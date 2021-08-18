import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

@Component({
  selector: 'app-importdid',
  templateUrl: './importdid.page.html',
  styleUrls: ['./importdid.page.scss'],
})
export class ImportdidPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public title = "03/06";
  public nodeId = "";
  public lightThemeType:number = 2;
  constructor(
    private native: NativeService,
    private zone: NgZone,
    private events: Events,
    private acRoute: ActivatedRoute,
    private feedService:FeedService,
    private translate:TranslateService,
    public  theme:ThemeService,
    private titleBarService: TitleBarService
    ) {
    }

    ngOnInit() {
      this.acRoute.params.subscribe((data)=>{
        this.nodeId = data.nodeId;
      });
    }

    ionViewWillEnter() {
      this.initTitle();
      this.connectionStatus = this.feedService.getConnectionStatus();
      this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
        this.zone.run(() => {
          this.connectionStatus = status;
          if (this.connectionStatus == 1){
            this.native.hideLoading();
          }
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.resolveDidError, (resolveDidErrorData: FeedsEvent.ResolveDidErrorData) => {
        this.zone.run(() => {
            let nodeId = resolveDidErrorData.nodeId;
            let did = resolveDidErrorData.did;
            let payload = resolveDidErrorData.payload;

            this.native.navigateForward(['/bindservice/publishdid/',nodeId, did, payload],{
              replaceUrl: true
            });
            this.native.hideLoading();
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.resolveDidSucess, (resolveDidSucessData: FeedsEvent.ResolveDidSucessData) => {
        this.zone.run(() => {
            let nodeId = resolveDidSucessData.nodeId;
            let did = resolveDidSucessData.did;
            this.native.getNavCtrl().navigateForward(['/bindservice/issuecredential', nodeId, did],{
              replaceUrl: true
            });
            this.native.hideLoading();
        });
      });

      this.events.subscribe(FeedsEvent.PublishType.rpcResponseError,()=>{
        this.zone.run(() => {
          this.native.hideLoading();
        });
      });
    }

    ionViewDidEnter() {
    }

    ionViewWillLeave(){
      this.native.hideLoading();
      this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
      this.events.unsubscribe(FeedsEvent.PublishType.resolveDidError);
      this.events.unsubscribe(FeedsEvent.PublishType.resolveDidSucess);
      this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    }


    initTitle(){
      this.titleBarService.setTitle(this.titleBar,this.translate.instant("ImportdidPage.title"));
      this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
      this.titleBarService.setTitleBarMoreMemu(this.titleBar);
    }

  createNewDid(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.showLoading("common.waitMoment",(isDismiss)=>{
    },5*60*1000).then(()=>{
      this.feedService.createDidRequest(this.nodeId);
    });

  }
}
