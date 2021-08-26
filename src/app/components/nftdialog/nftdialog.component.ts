import { Component, OnInit } from '@angular/core';
import { ThemeService } from 'src/app/services/theme.service';
import { PopoverController, NavParams } from '@ionic/angular';
import { FeedService } from '../../services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { Events } from '../../services/events.service';
import _, { reject } from 'lodash';
import { UtilService } from 'src/app/services/utilService';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { IPFSService } from 'src/app/services/ipfs.service';
import { NFTPersistenceHelper } from 'src/app/services/nft_persistence_helper.service';
import { Logger } from 'src/app/services/logger';
import { Config } from 'src/app/services/config';
import { PopupProvider } from 'src/app/services/popup';

let TAG: string = 'NFTDialog';
@Component({
  selector: 'app-nftdialog',
  templateUrl: './nftdialog.component.html',
  styleUrls: ['./nftdialog.component.scss'],
})
export class NftdialogComponent implements OnInit {
  private throwMsgTransDataLimit = 4 * 1000 * 1000;
  private transDataChannel: FeedsData.TransDataChannel =
    FeedsData.TransDataChannel.MESSAGE;
  public menuType: any = '';
  public amount: any = '';
  public title: string = '';
  public saleOrderId: any = '';
  public assItem: any = {};
  public curAmount: any = '';
  public quantity: any = '';
  public Maxquantity: any = '';
  public imgBase64: string = '';
  public curAssItem: any = {};
  private orderId: any = '';
  public imgUri:string = "";
  private popoverDialog: any;
  constructor(
    private navParams: NavParams,
    private popover: PopoverController,
    private native: NativeService,
    private feedService: FeedService,
    private events: Events,
    public theme: ThemeService,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private nftPersistenceHelper: NFTPersistenceHelper,
    private popupProvider: PopupProvider
  ) {}

  ngOnInit() {
    this.title = this.navParams.get('title');
    this.menuType = this.navParams.get('menuType');
    let assItem = this.navParams.get('assItem');
    this.curAssItem = assItem;
    let curAmount = this.assItem.fixedAmount || null;
    if (curAmount != null) {
      this.curAmount = this.nftContractControllerService.transFromWei(
        this.assItem.fixedAmount,
      );
    }
    this.assItem = _.cloneDeep(assItem);
    let price = this.assItem.fixedAmount || null;
    if (price != null) {
      this.amount = this.nftContractControllerService.transFromWei(price);
    }
    this.quantity = this.assItem.quantity;
    this.Maxquantity = this.assItem.quantity;
    this.saleOrderId = this.assItem.saleOrderId || '';
    this.hanldeImg();
  }

  confirm() {
    switch (this.menuType) {
      case 'sale':
        this.handleSaleList();
        break;
      case 'created':
        this.handleCreatedList();
        break;
    }
  }

  handleCreatedList() {
    if (!this.number(this.amount)) {
      this.native.toastWarn('common.amountError');
      return;
    }

    if (this.amount <= 0) {
      this.native.toastWarn('MintnftPage.priceErrorMsg');
      return;
    }

    if (this.curAmount === this.amount) {
      this.native.toastWarn('MintnftPage.priceErrorMsg1');
      return;
    }
    this.quantity = this.quantity || '';
    if (this.quantity === '') {
      this.native.toastWarn('input quantity');
      return;
    }
    let regNumber = /^\+?[1-9][0-9]*$/;
    if (regNumber.test(this.quantity) == false) {
      this.native.toast_trans('input quantity');
      return;
    }

    if (parseInt(this.quantity) > parseInt(this.Maxquantity)) {
      this.native.toast_trans('input quantity');
      return;
    }
    let tokenId = this.assItem.tokenId;
    this.sellCollectibles(tokenId, 'created');
  }

 async sellCollectibles(tokenId: any, type: string) {
    await this.popover.dismiss();
    this.events.publish(FeedsEvent.PublishType.startLoading,{des:"common.sellingOrderDesc",title:"common.waitMoment",curNum:"1",maxNum:"1",type:"changePrice"});
    let sId =setTimeout(()=>{
      this.nftContractControllerService.getPasar().cancelCreateOrderProcess();
      this.nftContractControllerService.getSticker().cancelSetApprovedProcess();
      this.events.publish(FeedsEvent.PublishType.endLoading);
      clearTimeout(sId);
      this.popupProvider.showSelfCheckDialog('common.saleOrderTimeoutDesc');
    }, Config.WAIT_TIME_SELL_ORDER);

    this.doSetApproval()
      .then(() => {
        return this.doCreateOrder(tokenId, type);
      })
      .then(() => {
        this.nftContractControllerService.getPasar().cancelCreateOrderProcess();
        this.nftContractControllerService.getSticker().cancelSetApprovedProcess()
        this.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
        //show success
      })
      .catch(() => {
        this.nftContractControllerService.getPasar().cancelCreateOrderProcess();
        this.nftContractControllerService.getSticker().cancelSetApprovedProcess()
        this.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
      });
  }

async handleSaleList() {
    if (!this.number(this.amount)) {
      this.native.toastWarn('common.amountError');
      return;
    }

    if (this.amount <= 0) {
      this.native.toastWarn('MintnftPage.priceErrorMsg');
      return;
    }

    if (this.curAmount === this.amount) {
      this.native.toastWarn('MintnftPage.priceErrorMsg1');
      return;
    }
    await this.popover.dismiss();
    this.events.publish(FeedsEvent.PublishType.startLoading,{des:"common.changingPriceDesc",title:"common.waitMoment",curNum:"1",maxNum:"1",type:"changePrice"});
    let sId = setTimeout(async()=>{
      this.events.publish(FeedsEvent.PublishType.endLoading);
      this.nftContractControllerService.getPasar().cancelChangePriceProcess();
      this.popupProvider.showSelfCheckDialog('common.changePriceTimeoutDesc');
      clearTimeout(sId);
    },Config.WAIT_TIME_CHANGE_PRICE);
    this.changePrice().then(() => {
        this.nftContractControllerService.getPasar().cancelChangePriceProcess();
        this.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
      })
      .catch(() => {
        this.nftContractControllerService.getPasar().cancelChangePriceProcess();
        this.native.toast_trans('common.priceChangeFailed');
        this.events.publish(FeedsEvent.PublishType.endLoading);
        clearTimeout(sId);
      });
  }

  doSetApproval(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let sellerAddress = this.nftContractControllerService.getAccountAddress();
        const sellerInfo = await this.nftContractControllerService
          .getPasar()
          .getSellerByAddr(sellerAddress);
        this.orderId = sellerInfo[2];

        // Seller approve pasar
        let pasarAddr = this.nftContractControllerService.getPasar().getAddress();
        let result = '';

        result = await this.nftContractControllerService
          .getSticker()
          .setApprovalForAll(sellerAddress, pasarAddr, true);

        if (!result) {
          reject('SetApprovalError');
          return;
        }

        resolve('Successs');
      } catch (error) {
        reject(error);
      }
    });
  }

  doCreateOrder(tokenId: any, type: any) {
    return new Promise(async (resolve, reject) => {
      try {
        let sellerAddress = this.nftContractControllerService.getAccountAddress();
        let price = UtilService.accMul(this.amount, this.quantity);
        Logger.log(TAG, 'Sell price is', price);
        let salePrice = this.nftContractControllerService.transToWei(
          price.toString(),
        );
        Logger.log(TAG, 'Trans price to wei', salePrice);
        Logger.log(TAG, 'Quantity type is ', typeof this.quantity);
        if (typeof this.quantity === 'number') {
          this.quantity = this.quantity.toString();
        }
        Logger.log(TAG, 'Quantity type is', typeof this.quantity);
        let orderIndex = -1;

        orderIndex = await this.nftContractControllerService
          .getPasar()
          .createOrderForSale(tokenId, this.quantity, salePrice);

        if (!orderIndex || orderIndex == -1) {
          reject('Create Order error');
          return;
        }

        await this.handleCreteOrderResult(tokenId, sellerAddress, salePrice, type, orderIndex);
        resolve('Success');
      } catch (error) {
        reject(error);
      }
    })
  }

  async handleCreteOrderResult(tokenId: string, sellerAddress: string, salePrice: string, type: any, index: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let tokenInfo = await this.nftContractControllerService
          .getSticker()
          .tokenInfo(tokenId);
        let createTime = tokenInfo[7];
        let sAssItem = _.cloneDeep(this.curAssItem);

        let order = await this.nftContractControllerService
          .getPasar()
          .getSellerOrderByIndex(index);
        let orderId = order[0];

        this.orderId = orderId;
        sAssItem['sellerAddr'] = sellerAddress;
        sAssItem['fixedAmount'] = salePrice;
        sAssItem['saleOrderId'] = orderId;
        sAssItem['createTime'] = createTime * 1000;
        sAssItem['moreMenuType'] = 'onSale';
        let obj = { type: type, assItem: sAssItem };
        this.events.publish(FeedsEvent.PublishType.nftUpdateList, obj);
        await this.getSetChannel(tokenId);

        resolve(obj);
      } catch (err) {
        Logger.error(err);
        reject(err);
      }
    });
  }


  async changePrice(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let accountAddress = this.nftContractControllerService.getAccountAddress();
      let price = this.nftContractControllerService
        .transToWei(this.amount.toString())
        .toString();
      let changeStatus = '';
      try {
        changeStatus = await this.nftContractControllerService
          .getPasar()
          .changeOrderPrice(accountAddress, this.saleOrderId, price);
        if (!changeStatus) {
          reject('Error');
          return;
        }
        this.handleChangePriceResult(price);
        resolve('Success');
      } catch (error) {
        reject(error);
      }
    });
  }

  handleChangePriceResult(price: string) {
    this.curAssItem.fixedAmount = price;
    let saleOrderId = this.curAssItem.saleOrderId;

    let createAddress = this.nftContractControllerService.getAccountAddress();
    let olist = this.nftPersistenceHelper.getCollectiblesList(createAddress);
    let curNftItem = _.find(olist, item => {
      return item.saleOrderId === saleOrderId;
    }) || null;
    if (curNftItem != null) {
      curNftItem.fixedAmount = price;
      this.nftPersistenceHelper.setCollectiblesMap(createAddress, olist);
    }

    let plist = this.nftPersistenceHelper.getPasarList();
    let pItem = _.find(plist, item => {
      return item.saleOrderId === saleOrderId;
    }) || null;
    if (pItem != null) {
      pItem.fixedAmount = price;
      this.nftPersistenceHelper.setPasarList(plist);
    }
    this.events.publish(FeedsEvent.PublishType.nftUpdatePrice, price);
  }

  number(text: any) {
    var numPattern = /^(([1-9]\d*)|\d)(.\d{1,9})?$/;
    return numPattern.test(text);
  }

  cancel() {
    if (this.popover != null) {
      this.popover.dismiss();
    }
  }

  async hanldeImg() {
    let imgUri = this.assItem['thumbnail'];
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
   this.imgUri = imgUri;
  }

  async getSetChannel(tokenId: any) {
    let setChannel = this.feedService.getCollectibleStatus();
    for (let key in setChannel) {
      let value = setChannel[key] || '';
      if (value) {
        let nodeId = key.split('_')[0];
        let channelId = parseInt(key.split('_')[1]);
        await this.sendPost(tokenId, nodeId, channelId);
      }
    }
  }

  async sendPost(tokenId: any, nodeId: string, channelId: number) {
    let tempPostId = this.feedService.generateTempPostId();
     this.imgBase64 = await this.compressImage(this.imgUri);
    this.publishPostThrowMsg(tokenId, nodeId, channelId, tempPostId);
  }

  async publishPostThrowMsg(
    tokenId: any,
    nodeId: string,
    channelId: number,
    tempPostId: number,
  ) {
    let imgSize = this.imgBase64.length;
    if (imgSize > this.throwMsgTransDataLimit) {
      this.transDataChannel = FeedsData.TransDataChannel.SESSION;
      let memo: FeedsData.SessionMemoData = {
        feedId: channelId,
        postId: 0,
        commentId: 0,
        tempId: tempPostId,
      };
      this.feedService.restoreSession(nodeId, memo);
    } else {
      this.transDataChannel = FeedsData.TransDataChannel.MESSAGE;
    }

    let imgThumbs: FeedsData.ImgThumb[] = [];
    let imgThumb: FeedsData.ImgThumb = {
      index: 0,
      imgThumb: this.imgBase64,
      imgSize: imgSize,
    };
    imgThumbs.push(imgThumb);

    let nftContent = {};
    nftContent['version'] = '1.0';
    nftContent['imageThumbnail'] = imgThumbs;
    nftContent['text'] = this.assItem.name+ " - "+ this.assItem.description;
    nftContent['nftTokenId'] = tokenId;
    nftContent['nftOrderId'] = this.orderId;

    this.feedService.declarePost(
      nodeId,
      channelId,
      JSON.stringify(nftContent),
      false,
      tempPostId,
      this.transDataChannel,
      this.imgBase64,
      '',
    );
  }

  // 压缩图片
  compressImage(path: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        let img = new Image();
        img.crossOrigin='*';
        img.crossOrigin = "Anonymous";
        img.src = path;
        img.onload = () =>{
          let maxWidth = img.width / 4;
          let maxHeight = img.height / 4;
          let imgBase64 = UtilService.resizeImg(img,maxWidth,maxHeight,1);
          resolve(imgBase64);
        };
      } catch (err) {
        Logger.error(TAG, "Compress image error", err);
        reject("Compress image error" + JSON.stringify(err));
      }
    });
  }


}
