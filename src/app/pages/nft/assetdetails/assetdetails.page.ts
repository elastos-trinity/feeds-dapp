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
import { MenuService } from 'src/app/services/MenuService';
import _ from 'lodash';
import { Logger } from 'src/app/services/logger';
import { DataHelper } from 'src/app/services/DataHelper';

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
  public currency: string = 'ELA';
  public type: string = 'Bid';
  public purchaseInfoQuantity: string = '1';
  public selectType: string = 'AssetdetailsPage.contract';
  public assetUri: string = null;
  public developerMode: boolean = false;
  public nftStatus: string = null;
  public royalties:string = null;
  public isLoading:boolean = false;
  public loadingTitle:string = "";
  public loadingText:string = "";
  public loadingCurNumber:string = "";
  public loadingMaxNumber:string = "";
  public saleOrderId: string = null;
  public usdPrice: string = null;
  public imageType: string = "";
  public ownerAddress: string = '';
  private orderCreateTime: number = null;
  private tokenCreateTime: number = null;

  private didUri: string = '';
  public did: string = null;
  public didDispaly: string = null;
  public didName: string = null;
  private NftDidList: any = null;
  public isSwitch: boolean = false;

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
    private nftPersistenceHelper: NFTPersistenceHelper,
    private menuService: MenuService,
    private dataHelper: DataHelper
  ) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.assItem = _.cloneDeep(queryParams);
      let asset = queryParams.asset || {};
      //this.did = 'imZgAo9W38Vzo1pJQfHp6NJp9LZsrnRPRr'.replace("did:elastos:","");
      this.didDispaly = UtilService.resolveDid(this.did);
      this.imageType = queryParams.type || "";
      this.owner = queryParams.name || '';
      this.name = queryParams.name || '';
      this.description = queryParams.description || '';
      this.saleOrderId = queryParams.saleOrderId || '';
      this.quantity = queryParams.curQuantity || queryParams.quantity;
      this.tokenID = queryParams.tokenId || '';
      this.orderCreateTime = queryParams.orderCreateTime || null;
      this.tokenCreateTime = queryParams.tokenCreateTime || null;
      this.didUri = queryParams.didUri || '';
      this.stickerContractAddress = this.nftContractControllerService
        .getSticker()
        .getStickerAddress();
      this.parsarContractAddress = this.nftContractControllerService
        .getPasar()
        .getPasarAddress();
      const kind = queryParams.kind || 'png';
      this.assetUri = this.handleImg(asset, kind);

      this.creator = queryParams.creator || '';//原创者

      this.ownerAddress = queryParams.sellerAddr || '';//所有者
      if(this.ownerAddress === ""){
        this.ownerAddress = this.nftContractControllerService.getAccountAddress();
      }
      this.royalties = queryParams.royalties || null;
    });
  }

  ionViewWillEnter() {
    this.NftDidList= this.dataHelper.getNftDidList() || {};
    this.handleNftDid();
    let elaPrice = this.feedService.getElaUsdPrice();
    this.price = this.assItem.fixedAmount || null;
    if(this.price!=null){
      let ethprice = this.nftContractControllerService.transFromWei(this.price.toString());
      this.usdPrice = UtilService.accMul(elaPrice,ethprice).toFixed(2);
    }
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

    this.events.subscribe(FeedsEvent.PublishType.startLoading,(obj)=>{
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

    this.events.subscribe(FeedsEvent.PublishType.endLoading,(obj)=>{
      this.isLoading = false;
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdatePrice,(nftPrice)=>{
      this.price = nftPrice;
    });

    this.events.subscribe(FeedsEvent.PublishType.nftUpdateList, obj => {
      let type = obj['type'];
      let sellQuantity = obj["sellQuantity"] || "0";
      let createAddr = this.nftContractControllerService.getAccountAddress();
      let assItem = obj['assItem'];
      Logger.log(TAG, 'Update nft list, asset item is', assItem);
      //let saleOrderId = assItem['saleOrderId'];
      let tokenId = assItem['tokenId'];
      switch (type) {
        case 'buy':
          break;
        case 'created':
          this.handleCreate(tokenId,createAddr,assItem,sellQuantity);
          this.native.pop();
          break;
      }
    });
  }

  removeEvent() {
    this.events.unsubscribe(FeedsEvent.PublishType.startLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.endLoading);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdateList);
    this.events.unsubscribe(FeedsEvent.PublishType.nftUpdatePrice);
    this.events.publish(FeedsEvent.PublishType.addProflieEvent);
  }

 async collectContractData() {

    this.contractDetails = [];

    this.contractDetails.push({
      type: 'DID Uri',
      details: this.didUri,
    });

    this.contractDetails.push({
      type: 'AssetdetailsPage.name',
      details: this.name,
    });

    this.contractDetails.push({
      type: 'AssetdetailsPage.description',
      details: this.description,
    });

    this.creator = await this.getCreatorAddress();
    let creatorAddressDes:any = await this.handleCreatorAddress(this.creator);
    this.contractDetails.push({
      type: creatorAddressDes,
      details:this.creator,
    });

    if (this.ownerAddress != '') {
      this.contractDetails.push({
        type: 'AssetdetailsPage.owner',
        details: this.ownerAddress,
      });
    }
    let tokenID = '0x'+UtilService.dec2hex(this.tokenID);
    this.contractDetails.push({
      type: 'AssetdetailsPage.tokenID',
      details: tokenID,
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
    // if (this.nftStatus != null) {
    //   this.contractDetails.push({
    //     type: 'common.state',
    //     details: this.nftStatus,
    //   });
    // }

    let saleDes = "";

    if(this.creator === this.ownerAddress){
      saleDes = "AssetdetailsPage.firstSale";
    }else{
      saleDes = "AssetdetailsPage.secondarySale";
    }

    this.contractDetails.push({
      type: 'AssetdetailsPage.saleType',
      details: this.translate.instant(saleDes),
    });

    if (this.price != null) {
      this.contractDetails.push({
        type: 'AssetdetailsPage.price',
        details:
          this.hanldePrice(this.price.toString()).toString() +
          ' ' +
          this.currency,
      });
    }

    let tokenCreateTime = await this.getTokenCreateTime();
    this.contractDetails.push({
      type: 'AssetdetailsPage.dateCreated',
      details: tokenCreateTime,
    });

    if(this.saleOrderId!=""){
      let marketDate = await this.getMarketDate();
      this.contractDetails.push({
        type: 'AssetdetailsPage.dateoNMarket',
        details: marketDate,
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
      type: 'BidPage.blockchain',
      details: this.blockchain,
    });
  }

 async collectPurchaseInfos() {
    this.purchaseInfos = [];
    let creatorAddressDes:any = await this.handleCreatorAddress(this.creator);
    this.purchaseInfos.push({
      type: creatorAddressDes,
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

  handleImg(imgUri: string, kind: string): string {
    let fileName = "";
    let fetchUrl = "";
    let imageUri = imgUri;
    if (imageUri.indexOf('feeds:imgage:') > -1) {
      imageUri = imageUri.replace('feeds:imgage:', '');
      fileName = imageUri;
      fetchUrl = this.ipfsService.getNFTGetUrl() + imageUri;
    } else if (imageUri.indexOf('feeds:image:') > -1) {
      imageUri = imageUri.replace('feeds:image:', '');
      fileName = imageUri;
      fetchUrl = this.ipfsService.getNFTGetUrl() + imageUri;
    }

    // this.fileHelperService.getNFTData(fetchUrl, fileName, kind).then((data) => {
    //   setTimeout(() => {
    //     this.zone.run(() => {
    //       this.assetUri = data;
    //     });
    //   }, 300);
    // });
    return fetchUrl;
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

  clickImages(){
    this.menuService.showSaveImageMenu(this,this.saveImage);
  }

 async saveImage(that: any){
   if (that.platform.is('ios')) {
     that.native.toast("common.comingSoon");
   } else {
     that.native.showLoading('common.savedDes', isDismiss => { }, 2000).then(() => {
       that.photoLibrary.requestAuthorization({
         read: true,
         write: true
       }).then(() => {
         that.photoLibrary.getLibrary().subscribe(
           {
             next: async library => {
               let base64 = await that.getImageBase64(that.assetUri);
               let album = "Feeds";
               that.photoLibrary.saveImage(base64, album).then(() => {
                 that.native.hideLoading();
                 that.native.toast("common.savedSuccessfully");

               })
             },
             error: err => {
               that.native.hideLoading();
               that.native.toastWarn("common.saveFailed");

             },
             complete: () => { console.log('done getting photos'); }
           });
       })
         .catch(err => {
           that.native.hideLoading();
           that.native.toastWarn("common.saveFailed");
         });
     })
   }
  }

  getImageBase64(uri:string):Promise<string> {
   return new Promise((resolve, reject) => {
    let img = new Image();
    img.crossOrigin='*';
    img.crossOrigin = "Anonymous";
    img.src=uri;

    img.onload = () =>{
      let canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, img.width, img.height);
      let dataURL = canvas.toDataURL("image/*");
      resolve(dataURL);
    };
    });
  }

  async handleCreate(tokenId:any,createAddr:any,assItem:any,sellQuantity:any){
    let quantity = await this.nftContractControllerService
      .getSticker()
      .balanceOf(tokenId);
    let list = this.nftPersistenceHelper.getCollectiblesList(createAddr);
    // let cpList = this.nftPersistenceHelper.getPasarList();
    let cpItem = _.cloneDeep(assItem);
    if (parseInt(quantity) <= 0) {

      list = _.filter(list, item => {
        return item.tokenId != tokenId && item.moreMenuType != "created";
      });

      cpItem["curQuantity"] = sellQuantity;

      list.push(cpItem);
      Logger.log(TAG, 'Update list', list);
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, list);

      // cpList.push(cpItem);
      // this.nftPersistenceHelper.setPasarList(cpList);
    } else {

      let index = _.findIndex(list, (item: any) => {
        return item.tokenId === tokenId && item.moreMenuType === "created";
      });
      let createItem = _.cloneDeep(assItem);
      createItem['moreMenuType'] = "created";
      createItem["fixedAmount"] = null;
      createItem["curQuantity"] = quantity;
      list[index] = createItem;

      cpItem["curQuantity"] = sellQuantity;
      list.push(cpItem);

      Logger.log(TAG, 'Update list', list);
      this.nftPersistenceHelper.setCollectiblesMap(createAddr, list);

      // cpList.push(cpItem);
      // this.nftPersistenceHelper.setPasarList(cpList);
    }

  }


  async getCreatorAddress(){
    if(this.creator!=""){
      return this.creator;
    }
    let tokenInfo = await this.nftContractControllerService.getSticker().tokenInfo(this.tokenID);
    return tokenInfo[4];
  }

  async getMarketDate(){
    if(this.orderCreateTime!=null){
      let createDate = new Date(this.orderCreateTime*1000);
      let dateCreated = UtilService.dateFormat(
        createDate,
        'yyyy-MM-dd HH:mm:ss',
      );
      return dateCreated;
    }
    let order = await this.nftContractControllerService
    .getPasar()
    .getOrderById(this.saleOrderId);
   let createDate = new Date(parseInt(order[15])*1000);
   let dateCreated = UtilService.dateFormat(
     createDate,
     'yyyy-MM-dd HH:mm:ss',
   );
    return dateCreated;
  }

  async handleCreatorAddress(creatorAddress: string){
    return new Promise((resolve, reject) => {
      let whiteListData :FeedsData.WhiteItem[] =  this.feedService.getWhiteListData();
      let whiteListItem =  _.find(whiteListData,(item: FeedsData.WhiteItem)=>{
             return item.address === creatorAddress;
      }) || "";
      if(whiteListItem != ""){
        resolve('BidPage.verifiedCreator');
      }else{
        resolve('AssetdetailsPage.creator');
      }
    });

    }

    async getTokenCreateTime() {
      if(this.tokenCreateTime != null){
        let createDate = new Date(this.tokenCreateTime*1000);
        let dateCreated = UtilService.dateFormat(
              createDate,
              'yyyy-MM-dd HH:mm:ss',
        );
        return dateCreated;
      }

      let tokenInfo = await this.nftContractControllerService.getSticker().tokenInfo(this.tokenID);
      let createDate = new Date(parseInt(tokenInfo[6])*1000);
      let dateCreated = UtilService.dateFormat(
            createDate,
            'yyyy-MM-dd HH:mm:ss',
      );
      return dateCreated;
    }

    handleNftDid(){
      if(this.did === null){
        return;
      }
      let didname =  this.NftDidList[this.did] || null;
      if(didname === null){
        let did = "did:elastos:"+this.did;
         this.feedService.resolveDidObject(did).then((result)=>{
                  this.didName = result["name"] || null;
                  if(this.didName!=null){
                     this.isSwitch = true;
                  }
                  this.NftDidList[this.did] =  this.didName;
                  this.dataHelper.setNftDidList(this.NftDidList);
         }).catch(()=>{
         });
      }else{
         this.didName = this.NftDidList[this.did];
         this.isSwitch = true;
      }
     }

     switchDid(){
      if(this.didName!=null){
         this.didName = null;
      }else{
       this.didName = this.NftDidList[this.did];
      }
     }

     copyDid(){
      if(this.did === null){
        return;
      }
      if(this.didName === null){
       this.native
       .copyClipboard(this.did)
       .then(() => {
         this.native.toast_trans('common.textcopied');
       })
       .catch(() => {});
      }
     }

}
