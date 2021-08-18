import { Component, OnInit, ViewChild } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { NativeService } from '../../services/NativeService';
import { TranslateService } from "@ngx-translate/core";
import { ThemeService } from '../../services/theme.service';
import { PopupProvider } from '../../services/popup';
import { StorageService } from '../../services/StorageService';
import { Events } from 'src/app/services/events.service';

// import { TitleBarService } from 'src/app/services/TitleBarService';
// import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';

import * as _ from 'lodash';

@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.page.html',
  styleUrls: ['./feeds.page.scss'],
})
export class FeedsPage implements OnInit {
  // @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public totalunread:number = 0;
  public title = "";
  public currentTab = "";
  public popover:any = "";
  constructor(
    private native: NativeService,
    private feedService: FeedService,
    private popoverController: PopoverController,
    private translate:TranslateService,
    public theme:ThemeService,
    private event:Events,
    public popupProvider:PopupProvider,
    private storageService:StorageService,
    // private titleBarService: TitleBarService
  ) {
  }

  ngOnInit() {

  }

  initTab(){
    let currentTab = this.feedService.getCurTab();
      switch(currentTab){
        case "home":
          this.home();
          break;
      case "profile":
          this.profile();
          break;
      case "notification":
          this.notification();
          break;
      case "search":
          this.search()
          break;
      }
  }

  ionViewWillEnter() {

    this.getUnReadNum();

    this.event.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTile();
    });

    this.event.subscribe(FeedsEvent.PublishType.UpdateNotification,()=>{
       this.getUnReadNum();
    });
  }

  ionViewWillLeave(){
    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = "";
    }
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.event.unsubscribe(FeedsEvent.PublishType.UpdateNotification);
  }

  initTile(){
    // this.titleBarService.setTitle(this.titleBar, this.translate.instant(this.title));
  }

  ionViewDidEnter() {
    this.initTab();
    this.initTile();
    // this.titleBarService.setTitleBarBackKeyShown(this.titleBar, false);
    // appManager.setVisible("show");
  }

  create(){
    this.event.publish(FeedsEvent.PublishType.tabSendPost);
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer == null || bindingServer == undefined){
      this.native.navigateForward(['bindservice/learnpublisheraccount'],"");
      return ;
    }

    let nodeId = bindingServer["nodeId"];
    if(this.checkServerStatus(nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }


    if (!this.feedService.checkBindingServerVersion(()=>{
      this.feedService.hideAlertPopover();
    })) return;


    if(this.feedService.getMyChannelList().length === 0){
      this.native.navigateForward(['/createnewfeed'],"");
      return;
    }

    let currentFeed = this.feedService.getCurrentFeed();
    if(currentFeed === null){
      let myFeed = this.feedService.getMyChannelList()[0];
      let currentFeed = {
        "nodeId": myFeed.nodeId,
        "feedId": myFeed.id
      }
      this.feedService.setCurrentFeed(currentFeed);
      this.storageService.set("feeds.currentFeed",JSON.stringify(currentFeed));
    }
    this.native.navigateForward(["createnewpost"],"");
  }

    home(){
      this.currentTab = "home";
      // this.feedService.currentTab = "home";
      this.title = "FeedsPage.tabTitle1";
      this.initTile();
      // this.titleBarService.setTitleBarBackKeyShown(this.titleBar, false);
      this.feedService.setCurTab(this.currentTab);
    }

    profile(){
      this.currentTab = "profile";
      this.title = "FeedsPage.tabTitle2"
      this.initTile();
      // this.titleBarService.setTitleBarBackKeyShown(this.titleBar, false);
      this.feedService.setCurTab(this.currentTab);
    }

    notification(){
      this.currentTab = "notification";
      this.title = "FeedsPage.tabTitle3";
      this.initTile();
      // this.titleBarService.setTitleBarBackKeyShown(this.titleBar, false);
      this.feedService.setCurTab(this.currentTab);
    }

    search(){
      this.currentTab = "search";
      this.title = "FeedsPage.tabTitle4";
      this.initTile();
      // this.titleBarService.setTitleBarBackKeyShown(this.titleBar, false);
      this.feedService.setCurTab(this.currentTab);
    }


    tabChanged(event){
      this.currentTab = event.tab;
    }

    getUnReadNum(){

     let  nList = this.feedService.getNotificationList() || [];
     if(nList.length === 0){
        this.totalunread = 0;
        return;
     }

    let uList =  _.filter(nList,(item:any)=>{ return item.readStatus === 1; });
    this.totalunread = uList.length;

    }

    checkServerStatus(nodeId: string){
      return this.feedService.getServerStatusFromId(nodeId);
    }
}
