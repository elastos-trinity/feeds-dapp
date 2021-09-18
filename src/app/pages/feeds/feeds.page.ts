import { Component, OnInit, NgZone } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { ThemeService } from '../../services/theme.service';
import { PopupProvider } from '../../services/popup';
import { DataHelper } from '../../services/DataHelper';
import { Events } from 'src/app/services/events.service';

import _ from 'lodash';

@Component({
  selector: 'app-feeds',
  templateUrl: './feeds.page.html',
  styleUrls: ['./feeds.page.scss'],
})
export class FeedsPage implements OnInit {
  public totalunread: number = 0;
  public newPostCount: number = 0;
  public title = '';
  public currentTab = '';
  public popover: any = '';
  constructor(
    private feedService: FeedService,
    private popoverController: PopoverController,
    public theme: ThemeService,
    private event: Events,
    public popupProvider: PopupProvider,
    private dataHelper: DataHelper,
    private zone: NgZone
  ) {}

  ngOnInit() {}

  initTab() {
    let currentTab = this.feedService.getCurTab();
    switch (currentTab) {
      case 'home':
        this.home();
        break;
      case 'profile':
        this.profile();
        break;
      case 'notification':
        this.notification();
        break;
      case 'search':
        this.search();
        break;
    }
  }

  ionViewWillEnter() {
    this.getUnReadNum();
    this.event.subscribe(FeedsEvent.PublishType.UpdateNotification, () => {
      this.getUnReadNum();
    });

    this.newPostCount = this.dataHelper.getNewPostCount();
    this.event.subscribe(FeedsEvent.PublishType.receiveNewPost, () => {
      this.zone.run(() => {
        this.newPostCount = this.dataHelper.getNewPostCount();
        console.log("newPostCount is", this.newPostCount)
      });
    })
  }

  ionViewWillLeave() {
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = '';
    }
    this.event.unsubscribe(FeedsEvent.PublishType.UpdateNotification);
    this.event.unsubscribe(FeedsEvent.PublishType.receiveNewPost);
  }

  ionViewDidEnter() {
    this.initTab();
  }

  home() {
    this.currentTab = 'home';
    this.title = 'FeedsPage.tabTitle1';
    this.feedService.setCurTab(this.currentTab);
    this.event.publish(FeedsEvent.PublishType.clickHome);
  }

  profile() {
    this.currentTab = 'profile';
    this.title = 'FeedsPage.tabTitle2';
    this.feedService.setCurTab(this.currentTab);
  }

  notification() {
    this.currentTab = 'notification';
    this.title = 'FeedsPage.tabTitle3';
    this.feedService.setCurTab(this.currentTab);
  }

  search() {
    this.currentTab = 'search';
    this.title = 'FeedsPage.tabTitle4';
    this.feedService.setCurTab(this.currentTab);
  }

  tabChanged(event:any) {
    this.currentTab = event.tab;
  }

  getUnReadNum() {
    let nList = this.feedService.getNotificationList() || [];
    if (nList.length === 0) {
      this.totalunread = 0;
      return;
    }

    let uList = _.filter(nList, (item: any) => {
      return item.readStatus === 1;
    });
    this.totalunread = uList.length;
  }
}
