import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FeedService } from 'src/app/services/FeedService';
import { Events } from 'src/app/services/events.service';
import { NativeService } from 'src/app/services/NativeService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { PopupProvider } from 'src/app/services/popup';

@Component({
  selector: 'app-startbinding',
  templateUrl: './startbinding.page.html',
  styleUrls: ['./startbinding.page.scss'],
})
export class StartbindingPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public bindPublisherAccountType:string = "";
  public connectionStatus = 1;
  public title = "02/06";
  public nonce = "";
  public nodeId: string="";
  public carrierAddress: string="";
  public did:string = "";
  public feedsUrl: string ="";
  public popover:any = null;
  // private isProcess = false;
  constructor(
    private zone: NgZone,
    private native: NativeService,
    private events: Events,
    private acRoute: ActivatedRoute,
    private feedService:FeedService,
    public  theme:ThemeService,
    private translate:TranslateService,
    private titleBarService: TitleBarService,
    private popup: PopupProvider) {


  }

  ngOnInit() {
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;

      let nonce = data.nonce || "";
      let did = data.did || "";
      this.feedsUrl = data.feedsUrl || "";

      if (nonce!=""){
        this.nonce = nonce ;
      }else{
        this.nonce = this.feedService.generateNonce();
      }

      if(did!=""){
        this.did = did;
      }

      this.carrierAddress = data.address;
    });
  }

  ionViewWillEnter() {
    this.bindPublisherAccountType = this.feedService.getBindPublisherAccountType();
    this.initTitle();

    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTitle();
    });

    this.connectionStatus = this.feedService.getConnectionStatus();
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
        if (this.connectionStatus == 1){
          this.native.hideLoading();
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.owner_declared, (ownerDeclaredData: FeedsEvent.OwnerDeclareData) => {
      let nodeId = ownerDeclaredData.nodeId;
      let phase = ownerDeclaredData.phase;
      let did = ownerDeclaredData.did;
      let payload = ownerDeclaredData.payload;

      switch(phase){
        case "owner_declared":
          this.zone.run(() => {
              this.native.navigateForward(['/bindservice/importdid/',nodeId],{
                replaceUrl: true
              });
          });
          break;
        case "credential_issued":
          this.zone.run(() => {
              this.feedService.restoreBindingServerCache(this.did, nodeId, ()=>{
                this.feedService.finishBinding(nodeId);
              },()=>{
                this.feedService.finishBinding(nodeId);
              });
          });
          break;
      }
      this.native.hideLoading();
    });

    this.events.subscribe(FeedsEvent.PublishType.issue_credential, () => {
      this.zone.run(() => {
        this.popover = this.popup.showalertdialog(this,"common.bindingCompleted","IssuecredentialPage.des",this.bindingCompleted,"check-circle-no-loop.gif","common.ok");
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.friendConnectionChanged, (friendConnectionChangedData: FeedsEvent.FriendConnectionChangedData)=>{
      let nodeId = friendConnectionChangedData.nodeId;
      let connectionStatus = friendConnectionChangedData.connectionStatus;
      if(this.nodeId == nodeId && connectionStatus == 0)
      this.native.hideLoading();
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
          this.native.navigateForward(['/bindservice/issuecredential', nodeId, did],{
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

  initTitle(){
    this.titleBarService.setTitle(this.titleBar,this.translate.instant('StartbindingPage.title'));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  ionViewDidEnter() {
  }

  ionViewWillLeave(){
    this.native.hideLoading();
    // this.feedService.cleanDeclareOwner();
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.owner_declared);
    this.events.unsubscribe(FeedsEvent.PublishType.issue_credential);
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.resolveDidError);
    this.events.unsubscribe(FeedsEvent.PublishType.resolveDidSucess);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
  }

  confirm(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.showLoading("common.waitMoment",(isDissmiss)=>{
      if (isDissmiss){
        this.showTimeOutErrorAlert();
      }
    },5*60*1000
    ).then(()=>{
      this.feedService.startDeclareOwner(this.nodeId, this.carrierAddress, this.nonce);
    });
  }

  showTimeOutErrorAlert(){
    this.popup.ionicAlert1(
      'common.error',
      "common.transMsgTimeout",
      "common.ok"
    );
  }
  abort(){
    this.native.pop();
    this.native.hideLoading();
  }

  scanService() {

  }

  bindingCompleted(that:any){
    let isFirstBindFeedService = localStorage.getItem('org.elastos.dapp.feeds.isFirstBindFeedService') || "";
    if(isFirstBindFeedService === ""){
       if(this.popover!=null){
         this.popover.dismiss();
         this.popover = null;
       }
        localStorage.setItem('org.elastos.dapp.feeds.isFirstBindFeedService',"1");
        that.native.setRootRouter(['/tabs/home']);
        return;
    }
    if(this.popover!=null){
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }

  }
}
