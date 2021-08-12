import { Component, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../../services/NativeService';
import { ThemeService } from '../../../services/theme.service';
import { Events } from 'src/app/services/events.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { FeedService } from '../../../services/FeedService';
import { UtilService } from 'src/app/services/utilService';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { PopupProvider } from 'src/app/services/popup';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';

import _, { reject } from 'lodash';
import { Logger } from 'src/app/services/logger';
import { Config } from 'src/app/services/config';
type detail = {
  type: string;
  details: string;
};
let TAG: string = "AssetDetails";
@Component({
  selector: 'app-assetdetails',
  templateUrl: './assetdetails.page.html',
  styleUrls: ['./assetdetails.page.scss'],
})
export class AssetdetailsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  private popover: any = null;
  private assItem: any = {};
  public contractDetails: detail[] = [];
  public owner: string = '';
  public name: string = '';
  public description: string = '';
  public quantity: string = '';
  public dateCreated: string = '';
  public stickerContractAddress: string = ''; // sticker 代理合约的地址
  public parsarContractAddress: string = ''; //  parsar 代理合约地址
  public blockchain: string = 'Elastos Smart Chain (ESC)';
  public tokenID: string = '';

  public purchaseInfos: detail[] = [];
  public creator: string = '';
  public datePurchased: string = '2020-05-06';
  public price: number = null;
  public currency: string = 'ELA/ETHSC';
  public type: string = 'Bid';
  public purchaseInfoQuantity: string = '1';
  public selectType: string = 'AssetdetailsPage.contract';
  public assetUri: string = null;
  public developerMode: boolean = false;
  public nftStatus: string = null;
  public royalties:string = null;
  constructor(
    private translate: TranslateService,
    private events: Events,
    private native: NativeService,
    private titleBarService: TitleBarService,
    private activatedRoute: ActivatedRoute,
    private nftContractControllerService: NFTContractControllerService,
    private feedService: FeedService,
    private viewHelper: ViewHelper,
    public theme: ThemeService,
    public popupProvider: PopupProvider,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.assItem = _.cloneDeep(queryParams);
      let asset = queryParams.asset || {};
      this.owner = queryParams.name || '';
      this.name = queryParams.name || '';
      this.description = queryParams.description || '';
      this.quantity = queryParams.quantity || '1';
      this.tokenID = queryParams.tokenId || '';
      this.stickerContractAddress = this.nftContractControllerService
        .getSticker()
        .getStickerAddress();
      this.parsarContractAddress = this.nftContractControllerService
        .getPasar()
        .getPasarAddress();
      this.assetUri = this.handleImg(asset);
      let createTime = queryParams.createTime || '';
      if (createTime != '') {
        let createDate = new Date(parseInt(createTime));
        this.dateCreated = UtilService.dateFormat(
          createDate,
          'yyyy-MM-dd HH:mm:ss',
        );
      }
      this.creator = queryParams.creator || '';
      this.royalties = queryParams.royalties || null;
    });
  }

  ionViewWillEnter() {
    this.price = this.assItem.fixedAmount || null;
    if (this.price != null) {
      this.nftStatus = this.translate.instant('common.onsale');
    }
    this.developerMode = this.feedService.getDeveloperMode();
    this.initTile();
    this.changeType(this.selectType);
    this.addEvent();
  }

  ionViewWillLeave() {
    this.removeEvent();
    this.events.publish(FeedsEvent.PublishType.search);
    this.events.publish(FeedsEvent.PublishType.notification);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

  initTile() {
    this.titleBarService.setTitle(
      this.titleBar,
      this.translate.instant('AssetdetailsPage.title'),
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  addEvent() {

    this.events.subscribe(FeedsEvent.PublishType.nftUpdatePrice,(nftPrice)=>{
      this.price = nftPrice;
    });

    this.events.subscribe(FeedsEvent.PublishType.nftCancelOrder, assetItem => {
      let saleOrderId = assetItem.saleOrderId;
      let sellerAddr = assetItem.sellerAddr;
      //add OwnNftCollectiblesList
      let createAddr = this.nftContractControllerService.getAccountAddress();
      assetItem['fixedAmount'] = null;
      assetItem['moreMenuType'] = 'created';
      let clist = this.nftPersistenceHelper.getCollectiblesList(createAddr);
      clist = _.filter(clist, item => {
        return item.saleOrderId != saleOrderId;
      });
      clist.push(assetItem);

      this.nftPersistenceHelper.setCollectiblesMap(createAddr, clist);

      //remove pasr
      let pList = this.nftPersistenceHelper.getPasarList();
      pList = _.filter(pList, item => {
        return !(
          item.saleOrderId === saleOrderId && item.sellerAddr === sellerAddr
        );
      });

      this.nftPersistenceHelper.setPasarList(pList);
      this.native.pop();
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
      let type = obj['type'];
      let createAddr = this.nftContractControllerService.getAccountAddress();
      let assItem = obj['assItem'];
      Logger.log(TAG, 'Update nft list, asset item is', assItem);
      let saleOrderId = assItem['saleOrderId'];
      let tokenId = assItem['tokenId'];
      switch (type) {
        case 'buy':
          break;
        case 'created':
          let list = this.nftPersistenceHelper.getCollectiblesList(createAddr);
          let cpItem = _.cloneDeep(assItem);
          cpItem['moreMenuType'] = 'created';
          list = _.filter(list, item => {
            return item.tokenId != tokenId;
          });
          list.push(cpItem);

          this.nftPersistenceHelper.setCollectiblesMap(createAddr, list);
          let cpList = this.nftPersistenceHelper.getPasarList();
          cpList.push(cpItem);

          this.nftPersistenceHelper.setPasarList(cpList);
          this.native.pop();
          break;
      }
    });
  }

  removeEvent() {
    this.events.unsubscribe(FeedsEvent.PublishType.nftCancelOrder);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdatePrice);
  }

  collectContractData() {
    this.contractDetails = [];
    if (this.creator != '') {
      this.contractDetails.push({
        type: 'AssetdetailsPage.creator',
        details: this.creator,
      });
    }

    this.contractDetails.push({
      type: 'AssetdetailsPage.name',
      details: this.name,
    });

    this.contractDetails.push({
      type: 'AssetdetailsPage.description',
      details: this.description,
    });

    if(this.royalties!=null){
     let royalties = UtilService.accDiv(this.royalties,10000);
      this.contractDetails.push({
        type: 'AssetdetailsPage.royalties',
        details: royalties +"%",
      });
    }

    this.contractDetails.push({
      type: 'AssetdetailsPage.quantity',
      details: this.quantity,
    });
    if (this.nftStatus != null) {
      this.contractDetails.push({
        type: 'common.state',
        details: this.nftStatus,
      });
    }

    if (this.price != null) {
      this.contractDetails.push({
        type: 'AssetdetailsPage.price',
        details:
          this.hanldePrice(this.price.toString()).toString() +
          ' ' +
          this.currency,
      });
    }

    if (this.dateCreated != '') {
      this.contractDetails.push({
        type: 'AssetdetailsPage.dateCreated',
        details: this.dateCreated,
      });
    }

    this.contractDetails.push({
      type: 'AssetdetailsPage.stickerContractAddress',
      details: this.stickerContractAddress,
    });

    if (this.developerMode) {
      this.contractDetails.push({
        type: 'AssetdetailsPage.pasarContractAddress',
        details: this.parsarContractAddress,
      });
    }

    this.contractDetails.push({
      type: 'AssetdetailsPage.tokenID',
      details: this.tokenID,
    });

    this.contractDetails.push({
      type: 'BidPage.blockchain',
      details: this.blockchain,
    });
  }

  collectPurchaseInfos() {
    this.purchaseInfos = [];
    this.purchaseInfos.push({
      type: 'AssetdetailsPage.creator',
      details: this.creator,
    });

    this.purchaseInfos.push({
      type: 'AssetdetailsPage.datePurchased',
      details: this.datePurchased,
    });

    this.purchaseInfos.push({
      type: 'AssetdetailsPage.price',
      details: this.hanldePrice(this.price.toString()).toString(),
    });

    this.purchaseInfos.push({
      type: 'AssetdetailsPage.currency',
      details: this.currency,
    });

    this.purchaseInfos.push({
      type: 'AssetdetailsPage.type',
      details: this.type,
    });

    this.purchaseInfos.push({
      type: 'AssetdetailsPage.quantity',
      details: this.purchaseInfoQuantity,
    });
  }

  async purchaseInfoBurn() {
    this.native.navigateForward(['bid'], { queryParams: { showType: 'burn' } });
  }

  changeType(type: string) {
    this.selectType = type;
    switch (type) {
      case 'AssetdetailsPage.contract':
        this.collectContractData();
        break;
      case 'AssetdetailsPage.history':
        this.collectPurchaseInfos();
        break;
    }
  }

  handleImg(imgUri: string) {
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    return imgUri;
  }

  copytext(text: any) {
    let textdata = text || '';
    if (textdata != '') {
      this.native
        .copyClipboard(text)
        .then(() => {
          this.native.toast_trans('common.textcopied');
        })
        .catch(() => {});
    }
  }

  hanldePrice(price: string) {
    return this.nftContractControllerService.transFromWei(price);
  }

  clickCancelOrder() {
    this.popover = this.popupProvider.ionicConfirm(
      this,
      'BidPage.cancelOrder',
      'BidPage.cancelOrder',
      this.cancelOnSaleMenu,
      this.confirmOnSaleMenu,
      './assets/images/shanchu.svg',
    );
  }

  changePrice() {
    this.viewHelper.showNftPrompt(this.assItem, 'BidPage.changePrice', 'sale');
  }

  onSale() {
    this.viewHelper.showNftPrompt(
      this.assItem,
      'CollectionsPage.putOnSale',
      'created',
    );
  }

  cancelOnSaleMenu() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  confirmOnSaleMenu(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
    }
    that.native
      .showLoading('common.cancelingOrderDesc', (isDismiss) => {
        if (isDismiss) {
          that.nftContractControllerService.getPasar().cancelCancelOrderProcess();
          that.native.hideLoading();
          that.showSelfCheckDialog();
        }
      }, Config.WAIT_TIME_CANCEL_ORDER)
      .then(() => {
        return that.cancelOrder(that);
      })
      .then(() => {
        that.native.hideLoading();
        that.native.toast_trans('common.cancelSuccessfully');
      })
      .catch((error) => {
        that.native.hideLoading();
        that.native.toast_trans('common.cancellationFailed');
        //Show error msg
      });
  }

  cancelOrder(that: any): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let saleOrderId = this.assItem['saleOrderId'] || '';
        Logger.log(TAG, 'Cancel Order ,order id is ', saleOrderId);
        if (!saleOrderId) {
          reject('Order id is null');
          return;
        }

        const cancelStatus = await this.nftContractControllerService
          .getPasar()
          .cancelOrder(saleOrderId);
        if (!cancelStatus) {
          reject('error');
          that.events.publish(FeedsEvent.PublishType.nftCancelOrder, this.assItem);
          return;
        }

        resolve('Success');
      } catch (error) {
        reject(error);
      }
    });
  }

  showSelfCheckDialog() {
    //TimeOut
    this.openAlert();
  }


  openAlert() {
    this.popover = this.popupProvider.ionicAlert(
      this,
      'common.timeout',
      'common.cancelOrderTimeoutDesc',
      this.confirm,
      'tskth.svg',
    );
  }

  confirm(that: any) {
    if (this.popover != null) {
      this.popover.dismiss();
      this.popover = null;
      that.native.pop();
    }
  }
}
