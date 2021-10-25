import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { NFTContractControllerService } from 'src/app/services/nftcontract_controller.service';
import { UtilService } from 'src/app/services/utilService';
import { IPFSService } from 'src/app/services/ipfs.service';
import { HttpService } from 'src/app/services/HttpService';
import _ from 'lodash';
import { ApiUrl } from 'src/app/services/ApiUrl';
import { FeedService } from 'src/app/services/FeedService';

@Component({
  selector: 'app-newassetitem',
  templateUrl: './newassetitem.component.html',
  styleUrls: ['./newassetitem.component.scss'],
})
export class NewassetitemComponent implements OnInit {
  @Input() type = '';
  @Input() elaPrice:string = null;
  @Input() assetItem: any = null;
  @Output() clickAssetItem = new EventEmitter();
  @Output() clickMore = new EventEmitter();
  public styleObj: any = { width: '' };
  public verified: boolean = false;
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private nftContractControllerService: NFTContractControllerService,
    private ipfsService: IPFSService,
    private httpService: HttpService,
    private feedService: FeedService
  ) {}

 async ngOnInit() {
    this.styleObj.width = screen.width - 40 + 'px';
    let creator = this.assetItem.creator || "";
    if(creator != ""){
      this.verified = await this.handleVerifiedAddress(creator);
    }else{
      this.verified = false;
    }
  }

  clickItem() {
    this.clickAssetItem.emit(this.assetItem);
  }

  more() {
    let obj = { type: this.type, assetItem: this.assetItem };
    this.clickMore.emit(obj);
  }

  hanldeImg(assetItem: any) {
    let imgUri = assetItem['thumbnail'];
    let kind = assetItem["kind"];
    if(kind === "gif"){
        imgUri = assetItem['asset'];
    }
    if (imgUri.indexOf('feeds:imgage:') > -1) {
      imgUri = imgUri.replace('feeds:imgage:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }else if(imgUri.indexOf('feeds:image:') > -1){
      imgUri = imgUri.replace('feeds:image:', '');
      imgUri = this.ipfsService.getNFTGetUrl() + imgUri;
    }
    return imgUri;
  }

  hanldePrice(price: string) {
    if (price != '' || price !=null)
      return this.nftContractControllerService.transFromWei(price);

    return price;
  }

  hanldeUsdPrice(ethPrice: string){
    let usdPrice = null;
    if(this.elaPrice != null){
      let ethprice = this.nftContractControllerService.transFromWei(ethPrice);
      usdPrice = UtilService.accMul(this.elaPrice,ethprice).toFixed(2);
    }
    return usdPrice;
  }

  handleAddr(sellerAddr: string) {
    let walletAddressStr = UtilService.resolveAddress(sellerAddr);
    return walletAddressStr;
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

  handleCurQuantity(assetItem:any){
    //if(assetItem != null){
        return  assetItem['curQuantity'] || assetItem['quantity'];
    //}
  }

  async handleVerifiedAddress(creatorAddress: string): Promise<boolean>{
    return new Promise((resolve, reject) => {
      let whiteListData :FeedsData.WhiteItem[] =  this.feedService.getWhiteListData();
      let whiteListItem =  _.find(whiteListData,(item: FeedsData.WhiteItem)=>{
             return item.address === creatorAddress;
      }) || "";
      if(whiteListItem != ""){
        resolve(true);
      }

      this.httpService.ajaxGet(ApiUrl.getWhiteListByAddress+creatorAddress,false).then((result:any)=>{
        if(result.code === 200){
          let data: [] = result.data;
          if(data.length > 0){
            resolve(true);
          }
          resolve(false);
        }
      }).catch((err)=>{
        resolve(false);
     });
    });

    }
}
