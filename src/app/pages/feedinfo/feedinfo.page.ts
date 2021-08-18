import { Component, OnInit, NgZone, ViewChild} from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { Platform} from '@ionic/angular';
import { ThemeService } from '../../services/theme.service';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { MenuService } from '../../services/MenuService';
import { PopoverController} from '@ionic/angular';
import { PaypromptComponent } from '../../components/payprompt/payprompt.component'
import { AppService } from '../../services/AppService';
import { UtilService } from '../../services/utilService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import * as _ from 'lodash';

@Component({
  selector: 'app-feedinfo',
  templateUrl: './feedinfo.page.html',
  styleUrls: ['./feedinfo.page.scss'],
})
// {
// 	"name": "testv1.3.0",
// 	"owner": "test",
// 	"introduction": "v1.3.0",
// 	"did": "did:elastos:iqJwsnRBe6WRQEaMTJwSaqMbvb952X8VBS",
// 	"carrierAddress": "T1yjRds4iCmEC2WLZVsajoEXdr2xge8RwEiSWfU4ASun6LB514zC",
// 	"nodeId": "CqYSEtXU21KsQQMx9D8y3Rpoe6559NE384Qj6j95V1pJ",
// 	"feedsUrl": "feeds://did:elastos:iqJwsnRBe6WRQEaMTJwSaqMbvb952X8VBS/T1yjRds4iCmEC2WLZVsajoEXdr2xge8RwEiSWfU4ASun6LB514zC",
// 	"elaAddress": "",
// 	"version": ""
// }
export class FeedinfoPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public connectionStatus = 1;
  public nodeId:string ="";
  public channelId:number = 0;
  public name:string ="";
  public des:string="";
  public channelAvatar = "";
  public avatar = "";
  public oldChannelInfo:any = {};
  public oldChannelAvatar:string = "";
  public serverInfo:any = {};
  public feedsUrl: string = null;
  public qrcodeString:string = null;
  public severVersion:string ="";
  public elaAddress:string ="";
  public developerMode:boolean =  false;
  public channelSubscribes: number = 0;
  public followStatus: boolean = false;
  public isShowPrompt: boolean = false;
  public popover:any;
  public isPress:boolean = false;
  public updatedTime:number = 0;
  public isMine:boolean = null;
  constructor(
    private popoverController:PopoverController,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    private events: Events,
    private native: NativeService,
    private zone:NgZone,
    private menuService: MenuService,
    private appService:AppService,
    private platform:Platform,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper
  ) {
    }

  ngOnInit() {
      let item = this.feedService.getChannelInfo();
      this.oldChannelInfo = item;
      let channelInfo  = _.cloneDeep(item);
      this.updatedTime = channelInfo["updatedTime"] || 0;
      this.nodeId = channelInfo["nodeId"] || "";
      this.serverInfo = this.feedService.getServerbyNodeId(this.nodeId);
      this.severVersion = this.feedService.getServerVersionByNodeId(this.nodeId) || '<1.3.0(Outdated)';
      this.elaAddress = this.serverInfo["elaAddress"] || 'common.emptyElaAddressDes';
      let feedsUrl = this.serverInfo['feedsUrl'] || null;
      this.channelId = channelInfo["channelId"] || "";
      this.feedsUrl = feedsUrl+"/"+this.channelId;
      this.name = channelInfo["name"] || "";
      this.qrcodeString = this.feedsUrl+"#"+encodeURIComponent(this.name);
      this.des = channelInfo["des"] || "";
      this.oldChannelAvatar = this.feedService.getProfileIamge();

      this.followStatus = channelInfo["followStatus"]||null;
      if (this.followStatus == null)
        this.followStatus = false;

      this.channelSubscribes = channelInfo["channelSubscribes"]||0;
  }

  ionViewWillEnter() {
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTitle();
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.channelAvatar = this.feedService.getProfileIamge();
    this.avatar = this.feedService.parseChannelAvatar(this.channelAvatar);
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTitle();
    });

    this.events.subscribe(FeedsEvent.PublishType.editFeedInfoFinish,()=>{
      this.zone.run(() => {
        this.native.hideLoading();
        this.native.pop();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError,()=>{
      this.native.hideLoading();
    });

    this.events.subscribe(FeedsEvent.PublishType.editChannel,()=>{
      this.clickEdit();
    });

    this.events.subscribe(FeedsEvent.PublishType.subscribeFinish, (subscribeFinishData: FeedsEvent.SubscribeFinishData)=> {
      this.zone.run(() => {
        let nodeId = subscribeFinishData.nodeId;
        let channelId = subscribeFinishData.channelId;
        this.checkFollowStatus(this.nodeId,this.channelId);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.unsubscribeFinish, (unsubscribeData: FeedsEvent.unsubscribeData) => {
      this.zone.run(() => {
        this.native.setRootRouter(['/tabs/home']);
      });
    });
  }

  checkFollowStatus(nodeId: string, channelId: number){
    let channelsMap = this.feedService.getChannelsMap();
    let nodeChannelId = this.feedService.getChannelId(nodeId,channelId);
    if (channelsMap[nodeChannelId] == undefined || !channelsMap[nodeChannelId].isSubscribed){
      this.followStatus = false;
    }
    else{
      this.followStatus = true;
    }
  }

  initTitle(){
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
    this.titleBarService.setTitle(this.titleBar, this.translate.instant('FeedinfoPage.title'));
    this.isMine = this.feedService.checkChannelIsMine(this.nodeId, this.channelId);
  }

  ionViewDidEnter(){
  }

  ionViewWillLeave(){
    this.events.unsubscribe(FeedsEvent.PublishType.unsubscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.subscribeFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.editChannel);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.editFeedInfoFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.publish(FeedsEvent.PublishType.notification);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  profileimage(){
    this.feedService.setChannelInfo(
      {
        "nodeId":this.nodeId,
        "channelId":this.channelId,
        "name":this.name,
        "des":this.des,
      });
  this.native.navigateForward(['/profileimage'],"");
  }

  cancel(){
   this.native.pop();
  }

  confirm(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.feedService.getServerStatusFromId(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.checkparms()){
      this.native.showLoading("common.waitMoment",(isDismiss)=>{
      }).then(()=>{
        this.feedService.editFeedInfo(this.nodeId,Number(this.channelId),this.name, this.des,this.avatar);
      })
    }
  }

  checkparms(){
    let nameValue = this.name || "";
    nameValue = this.native.iGetInnerText(nameValue);
   if(nameValue === ""){
     this.native.toast_trans('CreatenewfeedPage.inputName');
     return false;
   }

   if (this.name.length > 32){
    this.native.toast_trans("CreatenewfeedPage.tipMsgLength1");
    return ;
  }

  let descValue = this.des || "";
  descValue = this.native.iGetInnerText(descValue);

   if(descValue === ""){
    this.native.toast_trans('CreatenewfeedPage.inputFeedDesc');
    return false;
  }

  if (this.des.length > 128){
    this.native.toast_trans("CreatenewfeedPage.tipMsgLength");
    return ;
  }

  if(this.channelAvatar === ""){
    this.native.toast_trans('CreatenewfeedPage.des');
    return false;
  }

  if(this.oldChannelInfo["name"] === this.name &&
  this.oldChannelInfo["des"] === this.des &&
  this.oldChannelAvatar === this.channelAvatar ){
   this.native.toast_trans('common.nochanges');
   return false;
  }

  return true;
  }


  checkIsMine(didString:string){
    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer === null || bindingServer === undefined) {
      return 1;
    }

    let bindServerDid = bindingServer.did || '';
    if (didString === bindServerDid)
      return 0;

    return 1;
  }

  clickEdit(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.feedService.getServerStatusFromId(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.native.go("/eidtchannel");
  }


  tip(){
    let server = this.feedService.getServerbyNodeId(this.nodeId)||undefined;

    if (server == undefined ||server.elaAddress == undefined || server.elaAddress == ""){
      this.native.toast('common.noElaAddress');
      return;
    }

    this.showPayPrompt(server.elaAddress);
  }

  subscribe(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.feedService.subscribeChannel(this.nodeId, Number(this.channelId));
  }

  unsubscribe(){
    this.menuService.showUnsubscribeMenuWithoutName(this.nodeId, Number(this.channelId));
  }

  async showPayPrompt(elaAddress:string) {
    this.isShowPrompt = true;
    this.popover = await this.popoverController.create({
      mode: 'ios',
      cssClass: 'PaypromptComponent',
      component: PaypromptComponent,
      backdropDismiss: false,
      componentProps: {
        "title": this.translate.instant("ChannelsPage.tip"),
        "elaAddress": elaAddress,
        "defalutMemo": ""
      }
    });
    this.popover.onWillDismiss().then(() => {
      this.isShowPrompt = false;
      this.popover = null;
    });
    return await this.popover.present();
  }

  showPreviewQrcode(feedsUrl:string){
    if(this.isPress){
      this.isPress =false;
     return;
    }
    let isOwner = this.feedService.checkChannelIsMine(this.nodeId, this.channelId);
    if(isOwner){
      this.titleBarService.setIcon(this.titleBar, FeedsData.TitleBarIconSlot.INNER_RIGHT, null, null);
    }
    this.viewHelper.showPreviewQrcode(this.titleBar, feedsUrl,"common.qRcodePreview","FeedinfoPage.title","feedinfo",this.appService,isOwner);
  }

  menuMore(feedsUrl:string) {
    if(this.platform.is('ios')){
      this.isPress = true;
    }
    this.native.getShare(feedsUrl);
  }

  handleTime(updatedTime:number){
    let updateDate = new Date(updatedTime);
    return UtilService.dateFormat(updateDate,'yyyy-MM-dd HH:mm:ss')
  }

  editChannel(){
    this.clickEdit();
  }
}
