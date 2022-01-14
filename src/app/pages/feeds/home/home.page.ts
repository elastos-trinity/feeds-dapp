import {
  Component,
  OnInit,
  NgZone,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  IonContent,
  ModalController,
  Platform,
  PopoverController,
  IonInfiniteScroll,
  IonRefresher
} from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService } from 'src/app/services/FeedService';
import { MenuService } from 'src/app/services/MenuService';
import { FeedsPage } from '../feeds.page';
import { ThemeService } from 'src/app/services/theme.service';
import { UtilService } from 'src/app/services/utilService';
import { TranslateService } from '@ngx-translate/core';
import { NativeService } from 'src/app/services/NativeService';
import { AppService } from 'src/app/services/AppService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { PopupProvider } from 'src/app/services/popup';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { StorageService } from 'src/app/services/StorageService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { WalletConnectControllerService } from 'src/app/services/walletconnect_controller.service';
import { NFTContractHelperService } from 'src/app/services/nftcontract_helper.service';
import _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { HttpService } from '../../../services/HttpService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Keyboard } from '@ionic-native/keyboard/ngx';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { PostHelperService } from 'src/app/services/post_helper.service';

let TAG: string = 'Feeds-home';
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonContent, { static: true }) content: IonContent;
  @ViewChild(IonInfiniteScroll, { static: true })
  infiniteScroll: IonInfiniteScroll;
  @ViewChild(IonRefresher, { static: false }) refresher: IonRefresher;
  private homeTittleBar: HTMLElement;
  private homeTab: HTMLElement;
  public connectionStatus = 1;
  public postList: any = [];
  public nodeStatus: any = {};
  public startIndex = 0;
  public pageNumber = 8;
  public totalData = [];
  public images = {};

  public styleObj: any = { width: '' };

  public hideComment = true;

  // For comment component
  public postId = null;
  public nodeId = null;
  public channelId = null;
  public channelAvatar = null;
  public channelName = null;
  public onlineStatus = null;

  public clientHeight: number = 0;
  public isLoadimage: any = {};

  public isLoadVideoiamge: any = {};
  public videoIamges: any = {};

  public postgridindex: number = 0;

  public cacheGetBinaryRequestKey = '';
  public cachedMediaType = '';

  public maxTextSize = 240;

  public fullScreenmodal: any = '';

  public popover: any = '';

  public curNodeId: string = '';

  public hideDeletedPosts: boolean = false;

  public isPress: boolean = false;

  /**
   * imgPercentageLoading
   */
  public isImgPercentageLoading: any = {};
  public imgPercent: number = 0;
  public imgRotateNum: any = {};
  /**
   * imgloading
   */
  public isImgLoading: any = {};
  public imgloadingStyleObj: any = {};
  public imgDownStatus: any = {};
  public imgDownStatusKey: string = '';
  public imgCurKey: string = '';

  /**
   * videoPercentageLoading
   */
  public isVideoPercentageLoading: any = {};
  public videoPercent: number = 0;
  public videoRotateNum: any = {};
  /**
   * videoloading
   */
  public isVideoLoading: any = {};
  public videoloadingStyleObj: any = {};
  public videoDownStatus: any = {};
  public videoDownStatusKey: string = '';
  public videoCurKey: string = '';

  public roundWidth: number = 40;

  public isAndroid: boolean = true;

  public tabType: string = 'feeds';

  public pasarList: FeedsData.NFTItem[] = [];

  public isFinsh: any = [];

  public refreshEvent: any = null;

  public isLoading: boolean = false;
  public loadingTitle: string = "";
  public loadingText: string = "";
  public loadingCurNumber: string = "";
  public loadingMaxNumber: string = "";
  /** grid  list*/
  public styleType: string = "grid";

  private pasarListCount: number = 0;
  private pasarListPage: number = 0;
  public elaPrice: string = null;

  public searchText: string = "";
  public searchPasar: any = [];
  public isShowSearchField: boolean = false;
  public pasarsearchPlaceholder: string = "HomePage.search";
  // private searchBeforePasar: any = [];
  private nftImageType: any = {};
  private pasarGridisLoadimage: any = {};
  private pasarListisLoadimage: any = {};
  public isAutoGet: string = 'unAuto';
  public thumbImageName: string = "homeImg";
  private sortType: FeedsData.SortType = FeedsData.SortType.TIME_ORDER_LATEST;
  constructor(
    private platform: Platform,
    private elmRef: ElementRef,
    private feedspage: FeedsPage,
    private events: Events,
    private zone: NgZone,
    private feedService: FeedService,
    public theme: ThemeService,
    private translate: TranslateService,
    private native: NativeService,
    private menuService: MenuService,
    public appService: AppService,
    public modalController: ModalController,
    public popupProvider: PopupProvider,
    public popoverController: PopoverController,
    private viewHelper: ViewHelper,
    private titleBarService: TitleBarService,
    private storageService: StorageService,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private walletConnectControllerService: WalletConnectControllerService,
    private nftContractHelperService: NFTContractHelperService,
    private httpService: HttpService,
    private dataHelper: DataHelper,
    private keyboard: Keyboard,
    private fileHelperService: FileHelperService,
    private postHelperService: PostHelperService
  ) { }

  initPostListData(scrollToTop: boolean) {
    this.infiniteScroll.disabled = false;
    this.startIndex = 0;
    this.totalData = this.sortPostList();
    if (this.totalData.length - this.pageNumber > 0) {
      this.postList = this.totalData.slice(0, this.pageNumber);
      this.startIndex++;
      this.infiniteScroll.disabled = false;
    } else {
      this.postList = this.totalData;
      this.infiniteScroll.disabled = true;
    }
    if (scrollToTop) {
      this.scrollToTop(1);
    }
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.refreshImage(0);
    this.initnodeStatus(this.postList);
    this.dataHelper.resetNewPost();
  }

  sortPostList() {
    let postList = this.feedService.getPostList() || [];
    this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
    if (!this.hideDeletedPosts) {
      postList = _.filter(postList, (item: any) => {
        return item.post_status != 1;
      });
    }
    return postList;
  }

  refreshPostList() {
    if (this.startIndex === 0) {
      this.initPostListData(false);
      return;
    }
    this.totalData = this.sortPostList();
    if (this.totalData.length - this.pageNumber * this.startIndex > 0) {
      this.postList = this.totalData.slice(
        0,
        this.startIndex * this.pageNumber,
      );
      // this.infiniteScroll.disabled = false;
    } else {
      this.postList = this.totalData;
      // this.infiniteScroll.disabled = true;
    }
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.refreshImage(0);
    this.initnodeStatus(this.postList);
    this.dataHelper.resetNewPost();
  }

  addConnectionChangedEvent() {
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged, status => {
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });
  }

  getElaUsdPrice() {
    this.httpService.getElaPrice().then((elaPrice: any) => {
      if (elaPrice != null) {
        this.elaPrice = elaPrice;
      }
    });
  }

  async ionViewWillEnter() {
    this.sortType = this.dataHelper.getFeedsSortType();
    this.homeTittleBar = this.elmRef.nativeElement.querySelector("#homeTittleBar");
    this.homeTab = this.elmRef.nativeElement.querySelector("#homeTab");
    this.elaPrice = this.feedService.getElaUsdPrice();
    if (this.platform.is('ios')) {
      this.isAndroid = false;
    }
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.styleObj.width = screen.width - 105 + 'px';
    this.clientHeight = screen.availHeight;
    this.handleScroll();
    let pasarListGrid = this.feedService.getPasarListGrid();
    if (!pasarListGrid) {
      this.styleType = "grid";
    } else {
      this.styleType = "list";
    }

    switch (this.tabType) {
      case 'feeds':
        this.refreshPostList();
        break;
      case 'pasar':
        await this.refreshLocalPasarData();
        break;
    }

    this.events.subscribe(FeedsEvent.PublishType.addConnectionChanged, () => {
      this.addConnectionChangedEvent();
    });

    this.events.subscribe(FeedsEvent.PublishType.mintNft, () => {
      this.refreshPasarList();
      // this.pasarList = this.nftPersistenceHelper.getPasarList();
      //this.refreshPasarGridVisibleareaImage();
    });

    this.events.subscribe(FeedsEvent.PublishType.nftBuyOrder, async () => {
      // this.pasarList = this.nftPersistenceHelper.getPasarList();
      await this.refreshLocalPasarData();
    });

    this.events.subscribe(FeedsEvent.PublishType.addRpcRequestError, () => {
      this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.addRpcResponseError, () => {
      this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.unfollowFeedsFinish, () => {
      this.zone.run(() => {
        this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
        this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.clearHomeEvent, () => {
      this.events.unsubscribe(FeedsEvent.PublishType.hideDeletedPosts);
      this.events.unsubscribe(FeedsEvent.PublishType.createpost);
      this.events.unsubscribe(FeedsEvent.PublishType.addBinaryEvevnt);
      this.events.unsubscribe(FeedsEvent.PublishType.updateTab);
      this.events.unsubscribe(FeedsEvent.PublishType.unfollowFeedsFinish);
      this.clearData();
      this.events.unsubscribe(FeedsEvent.PublishType.clearHomeEvent);
      this.events.unsubscribe(FeedsEvent.PublishType.addConnectionChanged);
      this.events.unsubscribe(FeedsEvent.PublishType.addRpcRequestError);
      this.events.unsubscribe(FeedsEvent.PublishType.addRpcResponseError);
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTab, isInit => {
      this.zone.run(() => {
        this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
        if (isInit) {
          this.initPostListData(true);
          return;
        }
        this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.createpost, () => {
      this.clearData();
    });

    this.events.subscribe(FeedsEvent.PublishType.hideDeletedPosts, () => {
      this.zone.run(() => {
        this.hideDeletedPosts = this.feedService.getHideDeletedPosts();
        this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.hideAdult, () => {
      this.zone.run(async () => {
        this.native.showLoading('common.waitMoment');
        await this.refreshPasarList();
        this.isShowSearchField = false;
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.pasarListGrid, () => {
      let pasarListGrid = this.feedService.getPasarListGrid();
      if (!pasarListGrid) {
        this.styleType = "grid";
      } else {
        this.styleType = "list";
      }
      this.zone.run(() => {
        this.refreshPasarGridVisibleareaImage();
      });
    });

    this.addCommonEvents();

    this.addBinaryEvevnt();
    this.events.subscribe(FeedsEvent.PublishType.addBinaryEvevnt, () => {
      // if (this.tabType === 'pasar') {
      //   this.pasarList = this.nftPersistenceHelper.getPasarList();
      //   this.pasarList = _.sortBy(this.pasarList, (item: any) => {
      //     return -Number(item.createTime);
      //   });
      //   this.searchPasar = _.cloneDeep(this.pasarList);
      // }
      this.addCommonEvents();
      this.addBinaryEvevnt();
    });

    // this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {

    //   this.zone.run(async () => {
    //     const list = this.dataHelper.getPasarItemList();
    //     console.log('FeedsEvent.PublishType.nftUpdateList', list);
    //     // await this.refreshPasarList();
    //   });
    // });
  }

  addCommonEvents() {
    this.events.subscribe(FeedsEvent.PublishType.clickHome, () => {
      let newPostCount = this.dataHelper.getNewPostCount() || 0;
      this.content.getScrollElement().then((ponit: any) => {
        if (ponit.scrollTop > 110 || newPostCount > 0) {
          this.initPostListData(true);
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.nftdisclaimer, () => {
      let accAdress = this.nftContractControllerService.getAccountAddress() || "";
      if (accAdress === "") {
        this.connectWallet();
        return;
      }
      this.native.navigateForward(['mintnft'], {});
    });

    this.events.subscribe(FeedsEvent.PublishType.clickDialog, (dialogData: any) => {
      let pageName = dialogData.pageName;
      let dialogName = dialogData.dialogName;
      let dialogbutton = dialogData.clickButton;
      if (pageName === "home") {
        this.handleDialog(dialogName, dialogbutton, pageName);
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.startLoading, (obj) => {
      let title = obj["title"];
      let des = obj["des"];
      let curNum = obj["curNum"];
      let maxNum = obj["maxNum"];
      this.loadingTitle = title;
      this.loadingText = des;
      this.loadingCurNumber = curNum;
      this.loadingMaxNumber = maxNum;
      this.isLoading = true;
    });

    this.events.subscribe(FeedsEvent.PublishType.endLoading, (obj) => {
      this.isLoading = false;
    });

    this.events.subscribe(FeedsEvent.PublishType.nftCancelOrder, async assetItem => {

      let saleOrderId = assetItem.saleOrderId;
      let sellerAddr = assetItem.sellerAddr;
      let tokenId = assetItem.tokenId;
      let curTokenNum = await this.nftContractControllerService
        .getSticker().balanceOf(tokenId);
      let createAddr = this.nftContractControllerService.getAccountAddress();
      if (sellerAddr === createAddr) {
        //add created
        assetItem['fixedAmount'] = null;
        assetItem['moreMenuType'] = 'created';
        //add OwnNftCollectiblesList
        let createAddr = this.nftContractControllerService.getAccountAddress();
        let clist = this.nftPersistenceHelper.getCollectiblesList(createAddr);
        this.handleCancelOrder(tokenId, curTokenNum, assetItem, createAddr, saleOrderId, clist, sellerAddr);
      }
    });
    this.events.subscribe(FeedsEvent.PublishType.updateTitle, () => {
      this.initTitleBar();
    });

    this.addConnectionChangedEvent();

    this.events.subscribe(
      FeedsEvent.PublishType.friendConnectionChanged,
      (friendConnectionChangedData: FeedsEvent.FriendConnectionChangedData) => {
        this.zone.run(() => {
          let nodeId = friendConnectionChangedData.nodeId;
          let connectionStatus = friendConnectionChangedData.connectionStatus;
          this.nodeStatus[nodeId] = connectionStatus;
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.editPostFinish, () => {
      this.zone.run(() => {
        this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, () => {
      this.zone.run(() => {
        this.native.hideLoading();
        this.refreshPostList();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.native.hideLoading();
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestSuccess, () => {
      this.zone.run(() => {
        this.refreshPostList();
        this.hideComponent(null);
        this.native.hideLoading();
      });
    });
  }

  addBinaryEvevnt() {
    this.events.subscribe(
      FeedsEvent.PublishType.streamGetBinaryResponse,
      () => {
        this.zone.run(() => { });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.getBinaryFinish,
      (getBinaryData: FeedsEvent.GetBinaryData) => {
        this.zone.run(() => {
          let key = getBinaryData.key;
          let value = getBinaryData.value;
          this.processGetBinaryResult(key, value);
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamGetBinarySuccess,
      (getBinaryData: FeedsEvent.GetBinaryData) => {
        this.zone.run(() => {
          let nodeId = getBinaryData.nodeId;
          let key = getBinaryData.key;
          let value = getBinaryData.value;
          this.curNodeId = '';
          this.feedService.closeSession(nodeId);
          this.processGetBinaryResult(key, value);
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamError,
      (streamErrorData: FeedsEvent.StreamErrorData) => {
        this.zone.run(() => {
          let nodeId = streamErrorData.nodeId;
          let error = streamErrorData.error;
          this.isImgPercentageLoading[this.imgDownStatusKey] = false;
          this.isImgLoading[this.imgDownStatusKey] = false;
          this.imgDownStatus[this.imgDownStatusKey] = '';

          this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
          this.isVideoLoading[this.videoDownStatusKey] = false;
          this.videoDownStatus[this.videoDownStatusKey] = '';

          this.pauseAllVideo();
          this.feedService.handleSessionError(nodeId, error);
          this.curNodeId = '';
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamProgress,
      (streamProgressData: FeedsEvent.StreamProgressData) => {
        this.zone.run(() => {
          let progress = streamProgressData.progress;
          if (
            this.cachedMediaType === 'video' &&
            this.videoDownStatus[this.videoDownStatusKey] === '1'
          ) {
            this.videoPercent = progress;
            if (progress < 100) {
              this.videoRotateNum['transform'] =
                'rotate(' + (18 / 5) * progress + 'deg)';
            } else {
              if (progress === 100) {
                this.videoRotateNum['transform'] =
                  'rotate(' + (18 / 5) * progress + 'deg)';
              }
            }
            return;
          }

          if (
            this.cachedMediaType === 'img' &&
            this.imgDownStatus[this.imgDownStatusKey] === '1'
          ) {
            this.imgPercent = progress;
            if (progress < 100) {
              this.imgRotateNum['transform'] =
                'rotate(' + (18 / 5) * progress + 'deg)';
            } else {
              if (progress === 100) {
                this.imgRotateNum['transform'] =
                  'rotate(' + (18 / 5) * progress + 'deg)';
              }
            }
          }
        });
      },
    );

    this.events.subscribe(
      FeedsEvent.PublishType.streamOnStateChangedCallback,
      (streamStateChangedData: FeedsEvent.StreamStateChangedData) => {
        this.zone.run(() => {
          let nodeId = streamStateChangedData.nodeId;
          let state = streamStateChangedData.streamState;

          if (this.cacheGetBinaryRequestKey == '') return;

          if (state === FeedsData.StreamState.CONNECTED) {
            this.feedService.getBinary(
              nodeId,
              this.cacheGetBinaryRequestKey,
              this.cachedMediaType,
            );
          }
        });
      },
    );

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu, () => {
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';

      this.hideFullScreen();
      this.pauseAllVideo();
      if (this.curNodeId != '') {
        this.feedService.closeSession(this.curNodeId);
        this.curNodeId = '';
      }
    });

    this.events.subscribe(FeedsEvent.PublishType.streamClosed, nodeId => {
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.imgDownStatus[this.imgDownStatusKey] = '';

      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.videoDownStatus[this.videoDownStatusKey] = '';

      let mNodeId = nodeId || '';
      this.pauseAllVideo();
      this.curNodeId = '';
      if (mNodeId != '') {
        this.feedService.closeSession(mNodeId);
      }
    });
  }

  ionViewWillLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.mintNft);
    this.events.unsubscribe(FeedsEvent.PublishType.nftBuyOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.addConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.addRpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.addRpcResponseError);
    this.events.unsubscribe(FeedsEvent.PublishType.hideDeletedPosts);
    this.events.unsubscribe(FeedsEvent.PublishType.hideAdult);
    this.events.unsubscribe(FeedsEvent.PublishType.pasarListGrid);
    this.events.unsubscribe(FeedsEvent.PublishType.createpost);
    this.events.unsubscribe(FeedsEvent.PublishType.unfollowFeedsFinish);
    this.clearData();
  }

  clearData() {
    this.doRefreshCancel();
    let value = this.popoverController.getTop()['__zone_symbol__value'] || '';
    if (value != '') {
      this.popoverController.dismiss();
      this.popover = null;
    }

    if (this.curNodeId != '') {
      this.feedService.closeSession(this.curNodeId);
    }
    this.isLoading = false;
    this.events.unsubscribe(FeedsEvent.PublishType.nftdisclaimer);
    this.events.unsubscribe(FeedsEvent.PublishType.clickDialog);
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
    this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
    this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);
    this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.getBinaryFinish);

    this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinaryResponse);
    this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinarySuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.streamError);
    this.events.unsubscribe(
      FeedsEvent.PublishType.streamOnStateChangedCallback,
    );
    this.events.unsubscribe(FeedsEvent.PublishType.streamProgress);
    this.events.unsubscribe(FeedsEvent.PublishType.streamClosed);

    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
    this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestSuccess);
    this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
    this.events.unsubscribe(FeedsEvent.PublishType.clickHome);
    // this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
    this.removeImages();
    this.removeAllVideo();
    this.isLoadimage = {};
    this.isLoadVideoiamge = {};
    this.curNodeId = '';

    let isImgPercentageLoadingkeys: string[] = Object.keys(this.isImgPercentageLoading) || [];
    for (let index = 0; index < isImgPercentageLoadingkeys.length; index++) {
      const key = isImgPercentageLoadingkeys[index];
      this.isImgPercentageLoading[key] = false;
    }

    let isImgLoadingkeys: string[] = Object.keys(this.isImgLoading) || [];
    for (let index = 0; index < isImgLoadingkeys.length; index++) {
      const key = isImgLoadingkeys[index];
      this.isImgLoading[key] = false;
    }

    this.imgDownStatus[this.imgDownStatusKey] = '';
    this.imgPercent = 0;
    this.imgRotateNum['transform'] = 'rotate(0deg)';

    this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
    this.isVideoLoading[this.videoDownStatusKey] = false;
    this.videoDownStatus[this.videoDownStatusKey] = '';
    this.videoPercent = 0;
    this.videoRotateNum['transform'] = 'rotate(0deg)';

    this.hideFullScreen();
    this.native.hideLoading();
  }

  ionViewDidLeave() {
    this.events.unsubscribe(FeedsEvent.PublishType.addBinaryEvevnt);
    this.events.unsubscribe(FeedsEvent.PublishType.updateTab);
  }

  ionViewWillUnload() { }

  getChannel(nodeId: string, channelId: number): any {
    return this.feedService.getChannelFromId(nodeId, channelId);
  }

  getContentText(content: string): string {
    return this.feedService.parsePostContentText(content);
  }

  getContentShortText(post: any): string {
    let content = post.content;
    let text = this.feedService.parsePostContentText(content) || '';
    return text.substring(0, 180) + '...';
  }

  getPostContentTextSize(content: string) {
    let text = this.feedService.parsePostContentText(content);
    let size = UtilService.getSize(text);
    return size;
  }

  getContentImg(content: any): string {
    return this.feedService.parsePostContentImg(content);
  }

  getChannelOwnerName(nodeId, channelId): string {
    let channel = this.getChannel(nodeId, channelId) || '';
    if (channel === '') {
      return '';
    } else {
      return UtilService.moreNanme(channel['owner_name'], 40);
    }
  }

  ngOnInit() {
  }

  like(nodeId: string, channelId: number, postId: number) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkServerStatus(nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    let post = this.feedService.getPostFromId(nodeId, channelId, postId);
    if (!this.feedService.checkPostIsAvalible(post)) return;

    if (this.checkMyLike(nodeId, channelId, postId)) {
      this.feedService.postUnlike(nodeId, Number(channelId), Number(postId), 0);
      return;
    }

    this.feedService.postLike(nodeId, Number(channelId), Number(postId), 0);
  }

  navTo(nodeId: string, channelId: number, postId: number) {
    this.pauseVideo(nodeId + '-' + channelId + '-' + postId);
    this.clearData();
    this.native.getNavCtrl().navigateForward(['/channels', nodeId, channelId]);
  }

  navToPostDetail(
    nodeId: string,
    channelId: number,
    postId: number,
    event?: any,
  ) {
    let post = this.feedService.getPostFromId(nodeId, channelId, postId);
    if (!this.feedService.checkPostIsAvalible(post)) return;

    if (this.isPress) {
      this.isPress = false;
      return;
    }
    event = event || '';
    if (event != '') {
      let e = event || window.event; //兼容IE8
      let target = e.target || e.srcElement; //判断目标事件
      if (target.tagName.toLowerCase() == 'span') {
        let url = target.textContent || target.innerText;
        this.native.clickUrl(url, event);
        return;
      }
    }
    this.pauseVideo(nodeId + '-' + channelId + '-' + postId);
    this.clearData();
    this.native
      .getNavCtrl()
      .navigateForward(['/postdetail', nodeId, channelId, postId]);
  }

  checkMyLike(nodeId: string, channelId: number, postId: number) {
    return this.feedService.checkMyLike(nodeId, channelId, postId);
  }

  exploreFeeds() {
    this.native.setRootRouter(['/tabs/search']);
    this.feedspage.search();
  }

  parseAvatar(nodeId: string, channelId: number): string {
    let channel = this.getChannel(nodeId, channelId);
    if (channel == null || channel == undefined) return '';
    return this.feedService.parseChannelAvatar(channel.avatar);
  }

  handleDisplayTime(createTime: number) {
    let obj = UtilService.handleDisplayTime(createTime);
    if (obj.type === 's') {
      return this.translate.instant('common.just');
    }
    if (obj.type === 'm') {
      if (obj.content === 1) {
        return obj.content + this.translate.instant('HomePage.oneminuteAgo');
      }
      return obj.content + this.translate.instant('HomePage.minutesAgo');
    }
    if (obj.type === 'h') {
      if (obj.content === 1) {
        return obj.content + this.translate.instant('HomePage.onehourAgo');
      }
      return obj.content + this.translate.instant('HomePage.hoursAgo');
    }

    if (obj.type === 'day') {
      if (obj.content === 1) {
        return this.translate.instant('common.yesterday');
      }
      return obj.content + this.translate.instant('HomePage.daysAgo');
    }
    return obj.content;
  }

  menuMore(post: FeedsData.Post) {
    if (!this.feedService.checkPostIsAvalible(post)) return;
    let channel = this.getChannel(post.nodeId, post.channel_id);
    if (channel == null || channel == undefined) return;
    let channelName = channel.name;
    this.pauseAllVideo();

    let isMine = this.checkChannelIsMine(post.nodeId, post.channel_id);
    if (isMine === 0 && post.post_status != 1) {
      this.menuService.showHomeMenu(
        post.nodeId,
        Number(post.channel_id),
        channelName,
        Number(post.id),
      );
    } else {
      this.menuService.showChannelMenu(
        post.nodeId,
        Number(post.channel_id),
        channelName,
        Number(post.id),
      );
    }
  }

  getChannelName(nodeId: string, channelId: number): string {
    let channel = this.getChannel(nodeId, channelId) || '';
    if (channel == '') return '';
    return UtilService.moreNanme(channel.name);
  }

  checkServerStatus(nodeId: string) {
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(arr) {
    for (let index = 0; index < arr.length; index++) {
      let nodeId = arr[index]['nodeId'];
      let status = this.checkServerStatus(nodeId);
      this.nodeStatus[nodeId] = status;

      let post = arr[index];
      this.feedService.readChannel(post.nodeId + post.channel_id);
    }
  }

  moreName(name: string) {
    return UtilService.moreNanme(name);
  }

  loadData(event) {
    this.refreshEvent = event;
    switch (this.tabType) {
      case 'feeds':
        let sId = setTimeout(() => {
          let arr = [];
          if (this.totalData.length - this.pageNumber * this.startIndex > 0) {
            arr = this.totalData.slice(
              this.startIndex * this.pageNumber,
              (this.startIndex + 1) * this.pageNumber,
            );
            this.startIndex++;
            this.zone.run(() => {
              let len = this.postList.length - 1;
              this.postList = this.postList.concat(arr);
              this.refreshImage(len);
              this.initnodeStatus(arr);
              event.target.complete();
            });
          } else {
            arr = this.totalData.slice(
              this.startIndex * this.pageNumber,
              this.totalData.length,
            );
            this.zone.run(() => {
              let len = this.postList.length - 1;
              this.postList = this.postList.concat(arr);
              this.refreshImage(len - 1);
              // this.infiniteScroll.disabled = true;
              this.initnodeStatus(arr);
              event.target.complete();
            });
          }
          clearTimeout(sId);
        }, 500);
        break;
      case 'pasar':
        // this.scrollToTop(1);
        this.zone.run(() => {
          this.elaPrice = this.feedService.getElaUsdPrice();
          this.loadMoreData().then((list) => {
            let timer = setTimeout(() => {
              if (list.length > 0) {
                this.pasarList = list;
                this.refreshPasarGridVisibleareaImage();
              }
              event.target.complete();
              clearTimeout(timer);
            }, 500);
          });
        });
        break;
    }
  }

  loadMoreData(): Promise<FeedsData.NFTItem[]> {
    return new Promise(async (resolve, reject) => {
      try {
        // const list = await this.nftContractHelperService.loadMoreDataFromContract('onSale', SortType.CREATE_TIME, this.pasarListCount, this.pasarListPage);
        // const list = await this.nftContractHelperService.loadMoreData('onSale', SortType.CREATE_TIME, this.pasarListPage);

        const list = await this.nftContractHelperService.loadMorePasarListFromAssist(this.sortType, this.pasarListPage) || [];
        let pasarList: FeedsData.NFTItem[] = [];
        if (list && list.length > 0) {
          this.pasarListPage++;
          // this.pasarList = _.concat(this.pasarList, list);
          pasarList = _.unionWith(this.pasarList, list, _.isEqual);
          pasarList = this.nftContractHelperService.sortData(pasarList, this.sortType);
          // this.nftPersistenceHelper.setPasarList(this.pasarList);
        }
        resolve(pasarList);
      } catch (error) {
        reject(error);
      }
    });
  }

  doRefresh(event) {
    this.refreshEvent = event;
    switch (this.tabType) {
      case 'feeds':
        let sId = setTimeout(() => {
          this.initPostListData(true);
          if (event != null) event.target.complete();
          this.refreshEvent = null;
          clearTimeout(sId);
        }, 500);
        break;
      case 'pasar':
        this.elaPrice = this.feedService.getElaUsdPrice();
        this.handleRefresherInfinite(false);
        this.zone.run(async () => {
          await this.refreshPasarList();
          event.target.complete();
          this.refreshEvent = null;

        });
        break;
    }
  }

  async refreshPasarList() {
    try {
      this.pasarListPage = 0;
      this.pasarList = await this.nftContractHelperService.refreshPasarListFromAssist(this.sortType);
      this.refreshPasarGridVisibleareaImage();
      this.pasarListPage++;
    } catch (err) {
      Logger.error(TAG, err);
    }
  }

  refreshPasarGridVisibleareaImage() {
    if (this.tabType === 'pasar' && this.styleType === 'grid') {
      let sid = setTimeout(() => {
        this.pasarGridisLoadimage = {};
        this.setPasarGridVisibleareaImage();
        clearTimeout(sid);
      }, 100);
      return;
    }

    if (this.tabType === 'pasar' && this.styleType === 'list') {
      let sid = setTimeout(() => {
        this.pasarListisLoadimage = {};
        this.setPasarListVisibleareaImage();
        clearTimeout(sid);
      }, 100);
      return;
    }
  }

  scrollToTop(int) {
    let sid = setTimeout(() => {
      this.content.scrollToTop(1);
      clearTimeout(sid);
    }, int);
  }

  checkChannelIsMine(nodeId: string, channelId: number) {
    if (this.feedService.checkChannelIsMine(nodeId, channelId)) return 0;

    return 1;
  }

  showComment(nodeId: string, channelId: number, postId: number) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    if (this.checkServerStatus(nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    let post = this.feedService.getPostFromId(nodeId, channelId, postId);
    if (!this.feedService.checkPostIsAvalible(post)) return;

    this.pauseVideo(nodeId + '-' + channelId + '-' + postId);

    this.postId = postId;
    this.channelId = channelId;
    this.nodeId = nodeId;
    this.channelAvatar = this.parseAvatar(nodeId, channelId);
    this.channelName = this.getChannelName(nodeId, channelId);
    this.onlineStatus = this.nodeStatus[nodeId];
    this.hideComment = false;
  }

  hideComponent(event) {
    this.postId = null;
    this.channelId = null;
    this.nodeId = null;
    this.channelAvatar = null;
    this.channelName = null;
    this.onlineStatus = null;
    this.hideComment = true;
  }

  setVisibleareaImage(startPos: number) {
    let postgridList = document.getElementsByClassName('post-grid');
    let postgridNum = document.getElementsByClassName('post-grid').length;
    for (let postgridindex = 0; postgridindex < postgridNum; postgridindex++) {
      let srcId = postgridList[postgridindex].getAttribute('id') || '';
      if (srcId != '') {
        let arr = srcId.split('-');
        let nodeId = arr[0];
        let channelId = arr[1];
        let postId = arr[2];
        let mediaType = arr[3];
        let id = nodeId + '-' + channelId + '-' + postId;
        //postImg
        if (mediaType === '1') {
          this.handlePsotImg(id, srcId, postgridindex);
        }
        if (mediaType === '2') {
          //video
          this.hanldVideo(id, srcId, postgridindex);
        }
      }
    }
  }

  ionViewDidEnter() {
    this.initTitleBar();
  }

  initTitleBar() {
    let title = this.translate.instant('FeedsPage.tabTitle1');
    this.titleBarService.setTitle(this.titleBar, title);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  showBigImage(nodeId: string, channelId: number, postId: number) {
    this.pauseAllVideo();
    this.zone.run(() => {

      let imagesId = nodeId + '-' + channelId + '-' + postId + 'postimg';
      let imagesObj = document.getElementById(imagesId);
      let imagesWidth = imagesObj.clientWidth;
      let imagesHeight = imagesObj.clientHeight;
      this.imgloadingStyleObj['position'] = 'absolute';
      this.imgloadingStyleObj['left'] =
        (imagesWidth - this.roundWidth) / 2 + 'px';
      this.imgloadingStyleObj['top'] =
        (imagesHeight - this.roundWidth) / 2 + 'px';
      this.imgCurKey = nodeId + '-' + channelId + '-' + postId;
      this.isImgLoading[this.imgCurKey] = true;

      let contentVersion = this.feedService.getContentVersion(
        nodeId,
        channelId,
        postId,
        0,
      );
      let thumbkey = this.feedService.getImgThumbKeyStrFromId(
        nodeId,
        channelId,
        postId,
        0,
        0,
      );
      let key = this.feedService.getImageKey(nodeId, channelId, postId, 0, 0);
      if (contentVersion == '0') {
        key = thumbkey;
      }

      const content: FeedsData.Content = this.feedService.getContentFromId(nodeId, channelId, postId, 0);
      if (content.version == '2.0') {
        const mediaDatas = content.mediaDatas;
        if (mediaDatas && mediaDatas.length > 0) {
          const elements = mediaDatas[0];
          this.postHelperService.getPostData(elements.originMediaCid, elements.type)
            .then((value) => {
              this.isImgLoading[this.imgCurKey] = false;
              this.viewHelper.openViewer(
                this.titleBar,
                value,
                'common.image',
                'FeedsPage.tabTitle1',
                this.appService,
              );
            })
            .catch(() => {
              //TODO
            });
        }
        return;
      }

      this.feedService.getData(key).then(realImg => {
        let img = realImg || '';
        if (img != '') {
          let post =
            _.find(this.postList, item => {
              return (
                item.nodeId === nodeId &&
                item.channel_id === channelId &&
                item.id === postId
              );
            }) || {};

          let isNft = post.content.nftOrderId || '';
          this.isImgLoading[this.imgCurKey] = false;
          this.viewHelper.openViewer(
            this.titleBar,
            realImg,
            'common.image',
            'FeedsPage.tabTitle1',
            this.appService,
            false,
            isNft
          );
        } else {
          let post = _.find(this.postList, post => {
            return (
              post.nodeId === nodeId &&
              post.channel_id == channelId &&
              post.id == postId
            );
          });
          if (!this.feedService.checkPostIsAvalible(post)) {
            this.isImgLoading[this.imgCurKey] = false;
            return;
          }
          if (this.checkServerStatus(nodeId) != 0) {
            this.isImgLoading[this.imgCurKey] = false;
            this.native.toastWarn('common.connectionError1');
            return;
          }

          if (this.isExitDown()) {
            this.isImgLoading[this.imgCurKey] = false;
            this.openAlert();
            return;
          }

          this.imgDownStatusKey = nodeId + '-' + channelId + '-' + postId;
          this.cachedMediaType = 'img';
          this.feedService.processGetBinary(
            nodeId,
            channelId,
            postId,
            0,
            0,
            FeedsData.MediaType.containsImg,
            key,
            transDataChannel => {
              if (transDataChannel == FeedsData.TransDataChannel.SESSION) {
                this.cacheGetBinaryRequestKey = key;
                this.imgDownStatus[this.imgDownStatusKey] = '1';
                this.isImgLoading[this.imgDownStatusKey] = false;
                this.isImgPercentageLoading[this.imgDownStatusKey] = true;
                this.curNodeId = nodeId;
                return;
              }

              if (transDataChannel == FeedsData.TransDataChannel.MESSAGE) {
                this.imgDownStatus[this.imgDownStatusKey] = '0';
                this.curNodeId = '';
                return;
              }
            },
            err => {
              this.isImgLoading[this.imgDownStatusKey] = false;
              this.isImgPercentageLoading[this.imgDownStatusKey] = false;
              this.imgDownStatus[this.imgDownStatusKey] = '';
              this.curNodeId = '';
            },
          );
        }
      });
    });
  }

  async handlePsotImg(id: string, srcId: string, rowindex: number) {
    // 13 存在 12不存在
    let isload = this.isLoadimage[id] || '';
    let rpostimg = document.getElementById(id + 'rpostimg');
    let postImage = document.getElementById(id + 'postimg');
    try {
      if (
        id != '' &&
        postImage.getBoundingClientRect().top >= -100 &&
        postImage.getBoundingClientRect().top <= this.clientHeight
      ) {
        if (isload === '') {
          this.isLoadimage[id] = '11';
          let arr = srcId.split('-');
          let nodeId = arr[0];
          let channelId: any = arr[1];
          let postId: any = arr[2];

          let imageKey = this.feedService.getImageKey(nodeId, channelId, postId, 0, 0);
          let thumbkey = this.feedService.getImgThumbKeyStrFromId(
            nodeId,
            channelId,
            postId,
            0,
            0,
          );
          let nftOrdeId = this.isNftOrderId(
            nodeId,
            parseInt(channelId),
            parseInt(postId),
          );
          let priceDes = '';
          let nftQuantity = '';
          let nftType = "";
          if (nftOrdeId != '') {
            // let nftOrder = await this.handlePrice(nftOrdeId);
            let nftOrder = await this.nftContractHelperService.getOrderInfo(nftOrdeId);
            let price = '';
            if (nftOrder != null) {
              nftQuantity = String(nftOrder.amount);
              price = String(nftOrder.price);
            }
            if (price != '') {
              priceDes =
                this.nftContractControllerService.transFromWei(
                  price.toString(),
                ) + ' ELA';
            }
          }
          let contentVersion = this.feedService.getContentVersion(
            nodeId,
            channelId,
            postId,
            0,
          );

          if (contentVersion == '0') {
            imageKey = thumbkey;
          }

          const content: FeedsData.Content = this.feedService.getContentFromId(nodeId, channelId, postId, 0);
          if (content.version == '2.0') {
            postImage.setAttribute('src', './assets/icon/reserve.svg');
            const mediaDatas = content.mediaDatas;
            if (mediaDatas && mediaDatas.length > 0) {
              const elements = mediaDatas[0];
              this.postHelperService.getPostData(elements.thumbnailCid, elements.type)
                .then((value) => {
                  let thumbImage = value || "";
                  postImage.setAttribute('src', thumbImage);

                  // if (thumbImage != '') {
                  //   this.isLoadimage[id] = '13';

                  //   if (nftOrdeId != '' && priceDes != '') {
                  //     let imagesWidth = postImage.clientWidth;
                  //     let homebidfeedslogo = document.getElementById(
                  //       id + 'homebidfeedslogo'
                  //     );
                  //     homebidfeedslogo.style.left = (imagesWidth - 90) / 2 + 'px';
                  //     homebidfeedslogo.style.display = 'block';

                  //     let homebuy = document.getElementById(id + 'homebuy');
                  //     let homeNftPrice = document.getElementById(
                  //       id + 'homeNftPrice'
                  //     );
                  //     let homeNftQuantity = document.getElementById(
                  //       id + 'homeNftQuantity'
                  //     );
                  //     let homeMaxNftQuantity = document.getElementById(
                  //       id + 'homeMaxNftQuantity'
                  //     );
                  //     homeNftPrice.innerText = priceDes;
                  //     homeNftQuantity.innerText = nftQuantity;
                  //     homeMaxNftQuantity.innerText = nftQuantity;
                  //     homebuy.style.display = 'block';
                  //   }
                  //   rpostimg.style.display = 'block';
                  // } else {
                  //   this.isLoadimage[id] = '12';
                  //   rpostimg.style.display = 'none';
                  // }
                })
                .catch(() => {
                  //TODO
                });
            }
            return;
          }

          this.feedService
            .getData(imageKey)
            .then(imagedata => {
              let realImage = imagedata || '';
              if (realImage != '') {
                this.isLoadimage[id] = '13';
                postImage.setAttribute('src', realImage);
                if (nftOrdeId != '' && priceDes != '') {
                  let imagesWidth = postImage.clientWidth;
                  if (this.nftImageType[nftOrdeId] === "avatar") {

                    let homebidAvatar = document.getElementById(
                      id + 'homebidAvatar'
                    );
                    homebidAvatar.style.display = 'block';
                  } else if (this.nftImageType[nftOrdeId] === "video") {
                    let homebidVideo = document.getElementById(
                      id + 'homebidVideo'
                    );
                    homebidVideo.style.display = 'block';
                  }
                  let homebidfeedslogo = document.getElementById(
                    id + 'homebidfeedslogo'
                  );
                  homebidfeedslogo.style.left = (imagesWidth - 90) / 2 + 'px';
                  homebidfeedslogo.style.display = 'block';

                  let homebuy = document.getElementById(id + 'homebuy');
                  let homeNftPrice = document.getElementById(
                    id + 'homeNftPrice'
                  );
                  let homeNftQuantity = document.getElementById(
                    id + 'homeNftQuantity'
                  );
                  let homeMaxNftQuantity = document.getElementById(
                    id + 'homeMaxNftQuantity'
                  );
                  homeNftPrice.innerText = priceDes;
                  homeNftQuantity.innerText = nftQuantity;
                  homeMaxNftQuantity.innerText = nftQuantity;
                  homebuy.style.display = 'block';
                }

                rpostimg.style.display = 'block';
              } else {

                this.feedService.getData(thumbkey).then((thumbImagedata) => {
                  let thumbImage = thumbImagedata || "";
                  if (thumbImage != '') {
                    this.isLoadimage[id] = '13';
                    postImage.setAttribute('src', thumbImagedata);
                    if (nftOrdeId != '' && priceDes != '') {
                      let imagesWidth = postImage.clientWidth;
                      if (this.nftImageType[nftOrdeId] === "avatar") {

                        let homebidAvatar = document.getElementById(
                          id + 'homebidAvatar'
                        );
                        homebidAvatar.style.display = 'block';
                      } else if (this.nftImageType[nftOrdeId] === "video") {
                        let homebidVideo = document.getElementById(
                          id + 'homebidVideo'
                        );
                        homebidVideo.style.display = 'block';
                      }
                      let homebidfeedslogo = document.getElementById(
                        id + 'homebidfeedslogo'
                      );
                      homebidfeedslogo.style.left = (imagesWidth - 90) / 2 + 'px';
                      homebidfeedslogo.style.display = 'block';

                      let homebuy = document.getElementById(id + 'homebuy');
                      let homeNftPrice = document.getElementById(
                        id + 'homeNftPrice'
                      );
                      let homeNftQuantity = document.getElementById(
                        id + 'homeNftQuantity'
                      );
                      let homeMaxNftQuantity = document.getElementById(
                        id + 'homeMaxNftQuantity'
                      );
                      homeNftPrice.innerText = priceDes;
                      homeNftQuantity.innerText = nftQuantity;
                      homeMaxNftQuantity.innerText = nftQuantity;
                      homebuy.style.display = 'block';
                    }
                    rpostimg.style.display = 'block';
                  } else {
                    this.isLoadimage[id] = '12';
                    rpostimg.style.display = 'none';
                  }
                }).catch(() => {
                  rpostimg.style.display = 'none';
                })
              }
            })
            .catch(reason => {
              rpostimg.style.display = 'none';
              Logger.error(TAG,
                "Excute 'handlePsotImg' in home page is error , get image data error, error msg is ",
                reason
              );
            });
        }
      } else {
        let postImageSrc = postImage.getAttribute('src') || '';
        if (
          postImage.getBoundingClientRect().top < -100 &&
          this.isLoadimage[id] === '13' &&
          postImageSrc != ''
        ) {
          this.isLoadimage[id] = '';
          postImage.setAttribute('src', 'assets/images/loading.png');
        }
      }
    } catch (error) {
      this.isLoadimage[id] = '';
    }
  }

  hanldVideo(id: string, srcId: string, rowindex: number) {
    let isloadVideoImg = this.isLoadVideoiamge[id] || '';
    let vgplayer = document.getElementById(id + 'vgplayer');
    let video: any = document.getElementById(id + 'video') || '';
    let source: any = document.getElementById(id + 'source') || '';
    let arr = srcId.split('-');
    let nodeId = arr[0];
    let channelId: any = arr[1];
    let postId: any = arr[2];
    let downStatus = this.videoDownStatus[id] || '';
    if (id != '' && source != '' && downStatus === '') {
      this.pauseVideo(id);
    }
    try {
      if (
        id != '' &&
        video.getBoundingClientRect().top >= -100 &&
        video.getBoundingClientRect().top <= this.clientHeight
      ) {
        if (isloadVideoImg === '') {
          this.isLoadVideoiamge[id] = '11';
          //vgplayer.style.display = "none";
          let arr = srcId.split('-');
          let nodeId = arr[0];
          let channelId: any = arr[1];
          let postId: any = arr[2];

          const content: FeedsData.Content = this.feedService.getContentFromId(nodeId, channelId, postId, 0);
          if (content.version == '2.0') {
            video.setAttribute('poster', './assets/icon/reserve.svg');
            const mediaDatas = content.mediaDatas;
            if (mediaDatas && mediaDatas.length > 0) {
              const elements = mediaDatas[0];
              this.postHelperService.getPostData(elements.thumbnailCid, elements.type)
                .then((value) => {
                  let thumbImage = value || "";
                  this.isLoadVideoiamge[id] = '13';
                  video.setAttribute('poster', thumbImage);

                  //video.
                  this.setFullScreen(id);
                  this.setOverPlay(id, srcId);
                  // if (thumbImage != '') {
                  //   this.isLoadimage[id] = '13';

                  //   if (nftOrdeId != '' && priceDes != '') {
                  //     let imagesWidth = postImage.clientWidth;
                  //     let homebidfeedslogo = document.getElementById(
                  //       id + 'homebidfeedslogo'
                  //     );
                  //     homebidfeedslogo.style.left = (imagesWidth - 90) / 2 + 'px';
                  //     homebidfeedslogo.style.display = 'block';

                  //     let homebuy = document.getElementById(id + 'homebuy');
                  //     let homeNftPrice = document.getElementById(
                  //       id + 'homeNftPrice'
                  //     );
                  //     let homeNftQuantity = document.getElementById(
                  //       id + 'homeNftQuantity'
                  //     );
                  //     let homeMaxNftQuantity = document.getElementById(
                  //       id + 'homeMaxNftQuantity'
                  //     );
                  //     homeNftPrice.innerText = priceDes;
                  //     homeNftQuantity.innerText = nftQuantity;
                  //     homeMaxNftQuantity.innerText = nftQuantity;
                  //     homebuy.style.display = 'block';
                  //   }
                  //   rpostimg.style.display = 'block';
                  // } else {
                  //   this.isLoadimage[id] = '12';
                  //   rpostimg.style.display = 'none';
                  // }
                })
                .catch(() => {
                  //TODO
                });
            }
            return;
          }

          let key = this.feedService.getVideoThumbStrFromId(
            nodeId,
            channelId,
            postId,
            0,
          );
          this.feedService
            .getData(key)
            .then(imagedata => {
              let image = imagedata || '';
              if (image != '') {
                this.isLoadVideoiamge[id] = '13';
                video.setAttribute('poster', image);

                //video.
                this.setFullScreen(id);
                this.setOverPlay(id, srcId);
              } else {
                this.isLoadVideoiamge[id] = '12';
                video.style.display = 'none';
                vgplayer.style.display = 'none';
              }
            })
            .catch(reason => {
              video.style.display = 'none';
              vgplayer.style.display = 'none';
              this.isLoadVideoiamge[id] = '';
              Logger.error(TAG,
                "Excute 'hanldVideo' in home page is error , get image data error, error msg is ",
                reason
              );
            });
        }
      } else {
        let postSrc = video.getAttribute('poster') || '';
        if (
          video.getBoundingClientRect().top < -100 &&
          this.isLoadVideoiamge[id] === '13' &&
          postSrc != 'assets/images/loading.png'
        ) {
          video.setAttribute('poster', 'assets/images/loading.png');
          let sourcesrc = source.getAttribute('src') || '';
          if (sourcesrc != '') {
            source.removeAttribute('src');
          }
          this.isLoadVideoiamge[id] = '';
        }
      }
    } catch (error) {
      this.isLoadVideoiamge[id] = '';
    }
  }

  ionScroll() {
    this.native.throttle(this.handleScroll(), 200, this, true);
    switch (this.tabType) {
      case 'feeds':
        this.native.throttle(this.setVisibleareaImage(this.postgridindex), 200, this, true);
        break;
      case 'pasar':
        if (this.styleType === 'grid') {
          this.native.throttle(this.setPasarGridVisibleareaImage(), 200, this, true);
        } else if (this.styleType === 'list') {
          this.native.throttle(this.setPasarListVisibleareaImage(), 200, this, true);
        }
        break;
      default:
        break;
    }
  }

  refreshImage(startPos: number) {
    let sid = setTimeout(() => {
      this.postgridindex = startPos;
      this.setVisibleareaImage(startPos);
      clearTimeout(sid);
    }, 0);
  }

  pauseVideo(id: string) {
    let videoElement: any = document.getElementById(id + 'video') || '';
    let source: any = document.getElementById(id + 'source') || '';
    if (source != '') {
      if (!videoElement.paused) {
        //判断是否处于暂停状态
        videoElement.pause();
      }
    }
  }

  pauseAllVideo() {
    let videoids = this.isLoadVideoiamge;
    for (let id in videoids) {
      let value = videoids[id] || '';
      if (value === '13') {
        let downStatus = this.videoDownStatus[id] || '';
        if (downStatus === '') {
          this.pauseVideo(id);
        }
      }
    }
  }

  removeAllVideo() {
    let videoids = this.isLoadVideoiamge;
    for (let id in videoids) {
      let value = videoids[id] || '';
      if (value === '13') {
        let videoElement: any = document.getElementById(id + 'video') || '';
        if (videoElement != '') {
          //videoElement.setAttribute('poster',""); // empty source
        }
        let source: any = document.getElementById(id + 'source') || '';
        if (source != '') {
          let sourcesrc = source.getAttribute('src') || '';
          if (source != '' && sourcesrc != '') {
            source.removeAttribute('src'); // empty source
          }
        }
      }
    }
  }

  removeClass(elem, cls) {
    var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, '') + ' ';
    while (newClass.indexOf(' ' + cls + ' ') >= 0) {
      newClass = newClass.replace(' ' + cls + ' ', ' ');
    }
    elem.className = newClass.replace(/^\s+|\s+$/g, '');
  }

  setFullScreen(id: string) {
    let vgfullscreen = document.getElementById(id + 'vgfullscreenhome');
    vgfullscreen.onclick = () => {
      this.pauseVideo(id);
      let postImg: string = document
        .getElementById(id + 'video')
        .getAttribute('poster');
      let videoSrc: string = document
        .getElementById(id + 'source')
        .getAttribute('src');
      this.fullScreenmodal = this.native.setVideoFullScreen(postImg, videoSrc);
    };
  }

  hideFullScreen() {
    if (this.fullScreenmodal != '') {
      this.modalController.dismiss();
      this.fullScreenmodal = '';
    }
  }

  removeImages() {
    let iamgseids = this.isLoadimage;
    for (let id in iamgseids) {
      let value = iamgseids[id] || '';
      if (value === '13') {
        let imgElement: any = document.getElementById(id + 'post-img') || '';
        if (imgElement != '') {
          imgElement.removeAttribute('src'); // empty source
        }
      }
    }
  }

  setOverPlay(id: string, srcId: string) {
    let vgoverlayplay: any =
      document.getElementById(id + 'vgoverlayplayhome') || '';
    let source: any = document.getElementById(id + 'source') || '';
    if (vgoverlayplay != '') {
      vgoverlayplay.onclick = () => {
        this.zone.run(() => {
          let sourceSrc = source.getAttribute('src') || '';
          if (sourceSrc === '') {
            this.getVideo(id, srcId);
          }
        });
      };
    }
  }

  getVideo(id: string, srcId: string) {
    let arr = srcId.split('-');
    let nodeId = arr[0];
    let channelId: any = arr[1];
    let postId: any = arr[2];
    let videoId = nodeId + '-' + channelId + '-' + postId + 'vgplayer';
    let videoObj = document.getElementById(videoId);
    let videoWidth = videoObj.clientWidth;
    let videoHeight = videoObj.clientHeight;
    this.videoloadingStyleObj['z-index'] = 999;
    this.videoloadingStyleObj['position'] = 'absolute';
    this.videoloadingStyleObj['left'] =
      (videoWidth - this.roundWidth) / 2 + 'px';
    this.videoloadingStyleObj['top'] =
      (videoHeight - this.roundWidth) / 2 + 'px';
    this.videoCurKey = nodeId + '-' + channelId + '-' + postId;
    this.isVideoLoading[this.videoCurKey] = true;

    const content: FeedsData.Content = this.feedService.getContentFromId(nodeId, channelId, postId, 0);
    if (content.version == '2.0') {
      // video.setAttribute('src', './assets/icon/reserve.svg');
      const mediaDatas = content.mediaDatas;
      if (mediaDatas && mediaDatas.length > 0) {
        const elements = mediaDatas[0];
        // this.loadVideo(id, 'http://ipfs.trinity-feeds.app/ipfs/' + elements.originMediaCid);
        this.postHelperService.getPostData(elements.originMediaCid, elements.type)
          .then((value) => {
            this.isVideoLoading[this.videoCurKey] = false;
            this.loadVideo(id, value);
          })
          .catch(() => {
            //TODO
          });
      }
      return;
    }

    let key = this.feedService.getVideoKey(nodeId, channelId, postId, 0, 0);
    this.feedService.getData(key).then((videoResult: string) => {
      this.zone.run(() => {
        let videodata = videoResult || '';
        if (videodata == '') {
          let post = _.find(this.postList, post => {
            return (
              post.nodeId === nodeId &&
              post.channel_id == channelId &&
              post.id == postId
            );
          });
          if (!this.feedService.checkPostIsAvalible(post)) {
            this.isVideoLoading[this.videoCurKey] = false;
            this.pauseVideo(id);
            return;
          }

          if (this.checkServerStatus(nodeId) != 0) {
            this.isVideoLoading[this.videoCurKey] = false;
            this.pauseVideo(id);
            this.native.toastWarn('common.connectionError1');
            return;
          }

          if (this.isExitDown()) {
            this.isVideoLoading[this.videoCurKey] = false;
            this.pauseVideo(id);
            this.openAlert();
            return;
          }
          this.videoDownStatusKey = nodeId + '-' + channelId + '-' + postId;

          this.cachedMediaType = 'video';
          this.feedService.processGetBinary(
            nodeId,
            channelId,
            postId,
            0,
            0,
            FeedsData.MediaType.containsVideo,
            key,
            transDataChannel => {
              this.cacheGetBinaryRequestKey = key;
              if (transDataChannel == FeedsData.TransDataChannel.SESSION) {
                this.videoDownStatus[this.videoDownStatusKey] = '1';
                this.isVideoLoading[this.videoDownStatusKey] = false;
                this.isVideoPercentageLoading[this.videoDownStatusKey] = true;
                this.curNodeId = nodeId;
                return;
              }

              if (transDataChannel == FeedsData.TransDataChannel.MESSAGE) {
                this.videoDownStatus[this.videoDownStatusKey] = '0';
                this.curNodeId = '';
                return;
              }
            },
            err => {
              this.videoDownStatus[this.videoDownStatusKey] = '';
              this.isVideoLoading[this.videoDownStatusKey] = false;
              this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
              this.pauseVideo(id);
            },
          );
          return;
        }
        this.isVideoLoading[this.videoCurKey] = false;
        this.loadVideo(id, videodata);
      });
    });
  }

  loadVideo(id: string, videodata: string) {
    let source: any = document.getElementById(id + 'source') || '';
    if (source === '') {
      return;
    }
    source.setAttribute('src', videodata);
    let vgoverlayplay: any = document.getElementById(id + 'vgoverlayplayhome');
    let vgcontrol: any = document.getElementById(id + 'vgcontrolshome');

    let video: any = document.getElementById(id + 'video');
    video.addEventListener('ended', () => {
      vgoverlayplay.style.display = 'block';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('pause', () => {
      vgoverlayplay.style.display = 'block';
      vgcontrol.style.display = 'none';
    });

    video.addEventListener('play', () => {
      vgcontrol.style.display = 'block';
    });

    video.addEventListener('canplay', () => {
      video.play();
    });
    video.load();
  }

  handleTotal(post: any) {
    let videoThumbKey = post.content['videoThumbKey'] || '';
    let duration = 29;
    if (videoThumbKey != '') {
      duration = videoThumbKey['duration'] || 0;
    }
    return UtilService.timeFilter(duration);
  }

  processGetBinaryResult(key: string, value: string) {
    if (key.indexOf('img') > -1) {
      this.imgDownStatus[this.imgDownStatusKey] = '';
      this.isImgLoading[this.imgDownStatusKey] = false;
      this.isImgPercentageLoading[this.imgDownStatusKey] = false;
      this.imgPercent = 0;
      this.imgRotateNum['transform'] = 'rotate(0deg)';
      this.cacheGetBinaryRequestKey = '';
      let arrKey = key.split('-');
      let nodeId = arrKey[0];
      let channelId = arrKey[1];
      let postId = arrKey[2];
      let id = nodeId + "-" + channelId + "-" + postId;
      let postImage = document.getElementById(id + 'postimg') || null;
      if (postImage != null) {
        postImage.setAttribute('src', value);
      }
      let post =
        _.find(this.postList, item => {
          return (
            item.nodeId === nodeId &&
            item.channel_id === parseInt(channelId) &&
            item.id === parseInt(postId)
          );
        }) || {};
      let content = post.content || {};
      let isNft = content.nftOrderId || '';
      this.viewHelper.openViewer(
        this.titleBar,
        value,
        'common.image',
        'FeedsPage.tabTitle1',
        this.appService,
        false,
        isNft
      );
    } else if (key.indexOf('video') > -1) {
      this.videoDownStatus[this.videoDownStatusKey] = '';
      this.isVideoLoading[this.videoDownStatusKey] = false;
      this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
      this.videoPercent = 0;
      this.videoRotateNum['transform'] = 'rotate(0deg)';
      this.curNodeId = '';
      let arr = this.cacheGetBinaryRequestKey.split('-');
      let nodeId = arr[0];
      let channelId: any = arr[1];
      let postId: any = arr[2];
      let id = nodeId + '-' + channelId + '-' + postId;
      this.cacheGetBinaryRequestKey = '';
      this.loadVideo(id, value);
    }
  }

  isExitDown() {
    if (
      JSON.stringify(this.videoDownStatus) == '{}' &&
      JSON.stringify(this.imgDownStatus) == '{}'
    ) {
      return false;
    }

    for (let key in this.imgDownStatus) {
      if (this.imgDownStatus[key] != '') {
        return true;
      }
    }

    for (let key in this.videoDownStatus) {
      if (this.videoDownStatus[key] != '') {
        return true;
      }
    }

    return false;
  }

  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      '',
      'common.downDes',
      this.cancel,
      'tskth.svg',
    );
  }

  cancel(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  pressContent(postContent: string) {
    if (this.platform.is('ios')) {
      this.isPress = true;
    }

    let text = this.feedService.parsePostContentText(postContent);
    this.native
      .copyClipboard(text)
      .then(() => {
        this.native.toast_trans('common.textcopied');
      })
      .catch(() => { });
  }

  clickDashang(nodeId: string, channelId: number, postId: number) {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let server = this.feedService.getServerbyNodeId(nodeId) || {};
    let elaAddress = server['elaAddress'] || null;
    if (elaAddress == null) {
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo(nodeId + '-' + channelId + '-' + postId);
    this.viewHelper.showPayPrompt(nodeId, channelId, elaAddress);
  }

  retry(nodeId: string, feedId: number, postId: number) {
    this.feedService.republishOnePost(nodeId, feedId, postId);
  }

  async buy(post: any) {
    this.native
      .showLoading('common.waitMoment')
      .then(() => {
        return this.nftContractHelperService.resolveBuyNFTFromPost(post);
      })
      .then((stateAndItem: FeedsData.OrderStateAndNFTItem) => {
        switch (stateAndItem.state) {
          case FeedsData.OrderState.SALEING:
            // this.native.navigateForward(['bid'], { queryParams: stateAndItem.item });
            this.navigateForwardBidPage(stateAndItem.item);
            break;
          case FeedsData.OrderState.SOLD:
            this.native.toast_trans('common.sold');
            break;
          case FeedsData.OrderState.CANCELED:
            this.native.toast_trans('common.offTheShelf');
            break;
          default:
            break;
        }
        this.native.hideLoading();
      })
      .catch(() => {
        this.native.hideLoading();
      });
  }

  async clickTab(type: string) {
    this.tabType = type;
    this.doRefreshCancel();
    switch (type) {
      case 'feeds':
        await this.content.scrollToTop(0);
        this.handleRefresherInfinite(false);
        this.isShowSearchField = false;
        this.refreshPostList();
        break;
      case 'pasar':
        await this.content.scrollToTop(0);
        this.handleRefresherInfinite(false);
        this.elaPrice = this.feedService.getElaUsdPrice();
        this.infiniteScroll.disabled = false;
        let value =
          this.popoverController.getTop()['__zone_symbol__value'] || '';
        if (value != '') {
          this.popoverController.dismiss();
          this.popover = null;
        }

        if (this.curNodeId != '') {
          this.feedService.closeSession(this.curNodeId);
        }

        this.removeImages();
        this.removeAllVideo();
        this.isLoadimage = {};
        this.isLoadVideoiamge = {};
        this.curNodeId = '';
        this.isImgPercentageLoading[this.imgDownStatusKey] = false;
        this.isImgLoading[this.imgDownStatusKey] = false;
        this.imgDownStatus[this.imgDownStatusKey] = '';
        this.imgPercent = 0;
        this.imgRotateNum['transform'] = 'rotate(0deg)';

        this.isVideoPercentageLoading[this.videoDownStatusKey] = false;
        this.isVideoLoading[this.videoDownStatusKey] = false;
        this.videoDownStatus[this.videoDownStatusKey] = '';
        this.videoPercent = 0;
        this.videoRotateNum['transform'] = 'rotate(0deg)';

        this.hideFullScreen();
        this.native.hideLoading();

        // if (!this.pasarList || this.pasarList.length == 0) {
        this.searchText = '';
        await this.refreshLocalPasarData();
        this.refreshPasarGridVisibleareaImage();
        // }else{
        //   this.refreshPasarGridVisibleareaImage();
        // }
        break;
    }
  }

  async refreshLocalPasarData() {
    this.pasarList = await this.nftContractHelperService.loadData(0, this.sortType);
    this.pasarListPage = 1;
    this.refreshPasarGridVisibleareaImage();
  }

  create() {
    if (this.feedService.getConnectionStatus() != 0) {
      this.native.toastWarn('common.connectionError');
      return;
    }

    let bindingServer = this.feedService.getBindingServer();
    if (bindingServer == null || bindingServer == undefined) {
      //this.native.navigateForward(['bindservice/learnpublisheraccount'], '');
      this.viewHelper.showPublisherDialog("home");
      return;
    }

    let nodeId = bindingServer['nodeId'];
    if (this.checkServerStatus(nodeId) != 0) {
      this.native.toastWarn('common.connectionError1');
      return;
    }

    if (
      !this.feedService.checkBindingServerVersion(() => {
        this.feedService.hideAlertPopover();
      })
    )
      return;

    this.pauseAllVideo();
    this.clearData();

    if (this.feedService.getMyChannelList().length === 0) {
      this.native.navigateForward(['/createnewfeed'], '');
      return;
    }

    let currentFeed = this.feedService.getCurrentFeed();
    if (currentFeed === null) {
      let myFeed = this.feedService.getMyChannelList()[0];
      let currentFeed = {
        nodeId: myFeed.nodeId,
        feedId: myFeed.id,
      };
      this.feedService.setCurrentFeed(currentFeed);
      this.storageService.set('feeds.currentFeed', JSON.stringify(currentFeed));
    }
    this.feedService.setSelsectNftImage("");
    this.native.navigateForward(['createnewpost'], '');
  }

  createNft() {
    let nftFirstdisclaimer = this.feedService.getNftFirstdisclaimer() || "";
    if (nftFirstdisclaimer === "") {
      this.viewHelper.showNftdisclaimerPrompt();
      return;
    }
    let accAdress = this.nftContractControllerService.getAccountAddress() || "";
    if (accAdress === "") {
      this.connectWallet();
      return;
    }
    this.native.navigateForward(['mintnft'], {});
  }

  async connectWallet() {
    await this.walletConnectControllerService.connect();
  }

  // async getPaserList() {
  //   this.pasarList = [];
  //   this.nftPersistenceHelper.setPasarList(this.pasarList);
  //   let openOrderCount = await this.nftContractControllerService
  //     .getPasar()
  //     .getOpenOrderCount();

  //   if (openOrderCount === '0')
  //     return

  //   this.pasarListCount = parseInt(openOrderCount);
  //   let maxNum = parseInt(openOrderCount);

  //   for (let index = this.pasarListCount - 1; index > (this.pasarListCount - 8); index--) {
  //     const item: FeedsData.NFTItem = await this.getOpenOrderByIndex(index);
  //     this.pasarList.push(item);
  //     this.pasarList = this.nftContractHelperService.sortData(this.pasarList, SortType.CREATE_TIME);
  //   }

  //   this.nftPersistenceHelper.setPasarList(this.pasarList);
  // }

  async getOpenOrderByIndex(index: number): Promise<FeedsData.NFTItem> {
    return new Promise(async (resolve, reject) => {
      try {
        const orderInfo = await this.nftContractHelperService.getOpenOrderByIndex(index);
        const tokenInfo = await this.nftContractHelperService.getTokenInfo(String(orderInfo.tokenId), true);
        const tokenJson = await this.nftContractHelperService.getTokenJson(tokenInfo.tokenUri);
        const item: FeedsData.NFTItem = this.nftContractHelperService.createItemFromOrderInfo(orderInfo, tokenInfo, tokenJson, 'onSale');
        resolve(item);
      } catch (error) {
        Logger.error(error);
        reject(error);
      }
    });
  }

  clickAssetItem(assetitem: any) {
    assetitem['showType'] = 'buy';
    Logger.log(TAG, 'Click asset item', assetitem);
    this.clearData();
    this.navigateForwardBidPage(assetitem);
  }

  isNftOrderId(nodeId: string, channelId: number, postId: number) {
    let post =
      _.find(this.postList, item => {
        return (
          item.nodeId === nodeId &&
          item.channel_id === channelId &&
          item.id === postId
        );
      }) || {};
    //homebidAvatar
    let nftOrderId = post.content.nftOrderId || '';
    if (nftOrderId != '') {
      this.nftImageType[nftOrderId] = post.content.nftImageType || '';
      return nftOrderId;
    }
    return '';
  }

  clickMore(parm: any) {
    let asstItem = parm['assetItem'];
    let accountAddress = this.nftContractControllerService.getAccountAddress();
    if (asstItem['sellerAddr'] === accountAddress) {
      this.handleOnSale(asstItem);
    } else {
      this.handleShareOnShare(asstItem);
    }
  }

  handleOnSale(asstItem: any) {
    this.menuService.showOnSaleMenu(asstItem);
  }

  handleShareOnShare(asstItem: any) {
    this.menuService.showShareOnSaleMenu(asstItem);
  }

  doRefreshCancel() {
    if (this.refreshEvent) {
      this.refreshEvent.target.complete();
      this.refreshEvent = null;
    }
  }

  async handleCancelOrder(tokenId: any, curTokenNum: any, assetItem: any, createAddr: any, saleOrderId: any, clist: any, sellerAddr: any) {
    //add OwnNftCollectiblesList
    if (parseInt(curTokenNum) === 0) {

      clist = _.filter(clist, item => {
        return item.tokenId != tokenId;
      });

      clist.push(assetItem);
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, clist);

    } else {

      clist = _.filter(clist, item => {
        return item.saleOrderId != saleOrderId;
      });

      let index = _.findIndex(clist, (item: any) => {
        return item.tokenId === tokenId && item.moreMenuType === "created";
      });

      assetItem.curQuantity = (parseInt(curTokenNum) + parseInt(assetItem.curQuantity)).toString();
      clist[index] = _.cloneDeep(assetItem);
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, clist);
    }

    // let pList = this.nftPersistenceHelper.getPasarList();
    let pList = _.filter(this.pasarList, item => {
      return !(
        item.saleOrderId === saleOrderId && item.sellerAddr === sellerAddr
      );
    });
    this.pasarList = pList;
    //this.searchPasar = _.cloneDeep(this.pasarList);
    // this.nftPersistenceHelper.setPasarList(pList);
    this.dataHelper.deletePasarItem(saleOrderId);
  }

  handleDialog(dialogName: string, dialogbutton: string, pageName: string) {
    switch (dialogName) {
      case "publisherAccount":
        this.publisherAccount(dialogbutton, pageName)
        break;
      case "guide":
        this.guide(dialogbutton);
        break;
    }
  }

  async publisherAccount(dialogbutton: string, pageName: string) {
    switch (dialogbutton) {
      case "createNewPublisherAccount":
        this.feedService.setBindPublisherAccountType('new');
        break;
      case "bindExistingPublisherAccount":
        this.feedService.setBindPublisherAccountType('exit');
        await this.native.navigateForward(['bindservice/scanqrcode'], "");
        await this.popoverController.dismiss();
        break;
    }
  }

  async guide(dialogbutton: string) {
    switch (dialogbutton) {
      case "guidemac":
        await this.native.navigateForward(["guidemac"], "");
        await this.popoverController.dismiss();
        break;
      case "guideubuntu":
        await this.native.navigateForward(["guideubuntu"], "");
        await this.popoverController.dismiss();
        break;
      case "skip":
        await this.native.navigateForward(['bindservice/scanqrcode'], "");
        await this.popoverController.dismiss();
        break;
    }
  }

  handleScroll() {
    this.content.getScrollElement().then((ponit: any) => {
      if (this.isAndroid) {
        this.handelAndroidScroll(ponit);
      } else {
        this.handelIosScroll(ponit);
      }

    });
  }

  handelAndroidScroll(ponit: any) {

    if (ponit.scrollTop > 0) {
      this.homeTittleBar.style.display = "none";
      this.homeTab.setAttribute("style", "top:0px;height:45px;line-height:37px;");
      let sort = this.elmRef.nativeElement.querySelector("#sort") || null;
      if (sort != null) {
        sort.setAttribute("style", "top:93px;");
      }
    } else {
      this.homeTittleBar.style.display = "block";
      this.homeTab.setAttribute("style", "top:36px;height:34px;");
      let sort = this.elmRef.nativeElement.querySelector("#sort") || null;
      if (sort != null) {
        sort.setAttribute("style", "top:132px;");
      }
    }
  }

  handelIosScroll(ponit: any) {
    if (ponit.scrollTop > 0) {
      this.homeTittleBar.style.display = "none";
      this.homeTab.setAttribute("style", "top:0px;height:45px;line-height:37px;");
    } else {
      this.homeTittleBar.style.display = "block";
      this.homeTab.setAttribute("style", "top:36px;height:34px;");
    }
  }

  ionClear() {
    this.searchText = '';
    this.isShowSearchField = false;
    this.handleRefresherInfinite(false);

    const isShowAdult = this.dataHelper.getAdultStatus();
    let searchPasar = this.dataHelper.getPasarItemListWithAdultFlag(isShowAdult);

    if (searchPasar.length > 0) {
      this.pasarList = searchPasar;
      this.refreshPasarGridVisibleareaImage();
    }
  }

  getItems(events: any) {
    this.searchText = events.target.value || '';

    if (events && events.keyCode === 13) {
      this.keyboard.hide();
      if (this.searchText === "") {
        this.ionClear();
        return;
      }
      this.handleRefresherInfinite(true);
      this.handlePasarSearch();
    }
  }

  handlePasarSearch() {
    let tokenId = this.nftContractControllerService.isTokenId(this.searchText);
    if (tokenId != "") {
      this.zone.run(async () => {
        this.native.showLoading('common.waitMoment');
        this.pasarList = await this.nftContractHelperService.searchPasarOrder(FeedsData.SearchType.TOKEN_ID, tokenId);
        this.refreshPasarGridVisibleareaImage();
        this.native.hideLoading();
      });
      return;
    }

    if (this.nftContractControllerService.isAddress(this.searchText)) {
      this.zone.run(async () => {
        this.native.showLoading('common.waitMoment');
        this.pasarList = await this.nftContractHelperService.searchPasarOrder(FeedsData.SearchType.ROYALTY_ADDRESS, this.searchText);
        this.refreshPasarGridVisibleareaImage();
        this.native.hideLoading();
      });
      return;
    }

    this.zone.run(async () => {
      this.native.showLoading('common.waitMoment');
      this.pasarList = await this.nftContractHelperService.searchPasarOrder(FeedsData.SearchType.NAME, this.searchText);
      this.refreshPasarGridVisibleareaImage();
      this.native.hideLoading();
    });
  }

  handleRefresherInfinite(isOpen: boolean) {
    this.refresher.disabled = isOpen;
    this.infiniteScroll.disabled = isOpen;
  }

  clickfilterCircle() {
    this.isShowSearchField = !this.isShowSearchField;
  }

  setPasarGridVisibleareaImage() {
    let homePasarGrid = document.getElementById("homePasarGrid") || null;
    if (homePasarGrid === null) {
      return;
    }
    let homePasarGridCols = homePasarGrid.getElementsByClassName("homePasarGridCol") || null;
    let len = homePasarGridCols.length;
    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = homePasarGridCols[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }
      let arr = id.split("-");
      let fileName = arr[0];
      let kind = arr[1];
      let size = arr[2];
      let thumbImage = document.getElementById(fileName + "-homeImg");
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.pasarGridisLoadimage[fileName] || '';
      try {
        if (
          id != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().top <= this.clientHeight
        ) {
          if (isload === "") {
            // if (kind == 'gif' && size && parseInt(size, 10) > 10 * 1000 * 1000) {
            //   Logger.log(TAG, 'Work around, Not show');
            //   continue;
            // }

            let fetchUrl = this.ipfsService.getNFTGetUrl() + fileName;
            this.pasarGridisLoadimage[fileName] = '12';
            this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
              this.zone.run(() => {
                this.pasarGridisLoadimage[fileName] = '13';
                let dataSrc = data || "";
                if (dataSrc != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.pasarGridisLoadimage[fileName] === '13') {
                this.pasarGridisLoadimage[fileName] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });
          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.pasarGridisLoadimage[fileName] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.pasarGridisLoadimage[fileName] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        if (this.pasarGridisLoadimage[fileName] === '13') {
          this.pasarGridisLoadimage[fileName] = '';
          thumbImage.setAttribute('src', './assets/icon/reserve.svg');
        }
      }
    }
  }


  setPasarListVisibleareaImage() {

    let homePasarList = document.getElementById("homePasarList") || null;
    if (homePasarList === null) {
      return;
    }
    let homePasarListCol = homePasarList.getElementsByClassName("homePasarListCol") || null;
    let len = homePasarListCol.length;

    for (let itemIndex = 0; itemIndex < len; itemIndex++) {
      let item = homePasarListCol[itemIndex];
      let id = item.getAttribute("id") || "";
      if (id === "") {
        continue;
      }
      let arr = id.split("-");
      let fileName = arr[0];
      let kind = arr[1];
      let size = arr[2];
      let thumbImage = document.getElementById(fileName + "-thumbImage") || null;
      let srcStr = thumbImage.getAttribute("src") || "";
      let isload = this.pasarListisLoadimage[fileName] || '';

      try {
        if (
          id != '' &&
          thumbImage.getBoundingClientRect().top >= -100 &&
          thumbImage.getBoundingClientRect().top <= this.clientHeight
        ) {
          if (isload === "") {
            //  if (kind == 'gif' && size && parseInt(size, 10) > 10 * 1000 * 1000) {
            //    Logger.log(TAG, 'Work around, Not show');
            //    continue;
            //  }

            let fetchUrl = this.ipfsService.getNFTGetUrl() + fileName;
            this.pasarListisLoadimage[fileName] = '12';

            this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
              this.zone.run(() => {
                this.pasarListisLoadimage[fileName] = '13';
                let dataSrc = data || "";
                if (dataSrc != "") {
                  thumbImage.setAttribute("src", data);
                }
              });
            }).catch((err) => {
              if (this.pasarListisLoadimage[fileName] === '13') {
                this.pasarListisLoadimage[fileName] = '';
                thumbImage.setAttribute('src', './assets/icon/reserve.svg');
              }
            });
          }
        } else {
          srcStr = thumbImage.getAttribute('src') || '';
          if (
            thumbImage.getBoundingClientRect().top < -100 &&
            this.pasarListisLoadimage[fileName] === '13' &&
            srcStr != './assets/icon/reserve.svg'
          ) {
            this.pasarListisLoadimage[fileName] = '';
            thumbImage.setAttribute('src', './assets/icon/reserve.svg');
          }
        }
      } catch (error) {
        if (this.pasarListisLoadimage[fileName] === '13') {
          this.pasarListisLoadimage[fileName] = '';
          thumbImage.setAttribute('src', './assets/icon/reserve.svg');
        }
      }
    }
  }

  handleId(item: any) {
    let thumbnailUri = "";
    let kind = "";
    let size = "";
    let version = item["version"] || "1";
    if (version === "1") {
      thumbnailUri = item['thumbnail'] || "";
      kind = item["kind"];
      size = item["originAssetSize"];
    } else if (version === "2") {
      let jsonData = item['data'] || "";
      if (jsonData != "") {
        thumbnailUri = jsonData['thumbnail'] || "";
        kind = jsonData["kind"];
        size = jsonData["size"];
      } else {
        thumbnailUri = "";
      }
    }
    if (thumbnailUri === "") {
      return "";
    }

    if (!size)
      size = '0';
    if (kind === "gif" && parseInt(size) <= 5 * 1024 * 1024) {
      thumbnailUri = item['asset'];
    }
    if (thumbnailUri.indexOf('feeds:imgage:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:imgage:', '');
    } else if (thumbnailUri.indexOf('feeds:image:') > -1) {
      thumbnailUri = thumbnailUri.replace('feeds:image:', '');
    }
    return thumbnailUri + "-" + kind + "-" + size;
  }

  async changeSortType(sortType: number, event: any) {
    this.sortType = sortType;
    this.dataHelper.setFeedsSortType(sortType);
    event.stopPropagation();
    this.native.showLoading('common.waitMoment');
    await this.refreshPasarList();
    this.isShowSearchField = false;
    this.native.hideLoading();
  }

  clickSortArrow() {
    this.isShowSearchField = false;
    // this.searchText = "";
    // if (this.searchBeforePasar.length > 0) {
    //   this.pasarList = _.cloneDeep(this.searchBeforePasar);
    //   this.searchBeforePasar = [];
    //   this.refreshPasarGridVisibleareaImage();
    // }
    // this.handleRefresherInfinite(false);
  }

  navigateForwardBidPage(assetItem: FeedsData.NFTItem) {
    this.dataHelper.setBidPageAssetItem(assetItem);
    this.native.navigateForward(['bid'], { queryParams: assetItem });
  }
}

