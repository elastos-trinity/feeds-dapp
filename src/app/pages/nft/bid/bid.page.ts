import { Component,OnInit,ViewChild} from '@angular/core';
import { TranslateService } from "@ngx-translate/core";
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../../services/theme.service';
import { NativeService } from '../../../services/NativeService';
import { Events } from '../../../services/events.service';
import { TitleBarService } from '../../../services/TitleBarService';
import { TitleBarComponent } from '../../..//components/titlebar/titlebar.component';
import { ApiUrl } from '../../../services/ApiUrl';
import { Web3Service } from '../../../services/Web3Service';
type detail = {
  type: string,
  details: string
}
@Component({
  selector: 'app-bid',
  templateUrl: './bid.page.html',
  styleUrls: ['./bid.page.scss'],
})
export class BidPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public contractDetails:detail[]= [];
  public owner:string = "test";
  public name:string = "test";
  public description:string = "test";
  public quantity:string = "1";
  public dateCreated:string = "";
  public expirationDate:string = "";
  public contractAddress:string = "";
  public tokenID:string = "";
  public blockchain:string = "Ethereum Sidechain (Elastos)";
  public fixedPrice:string = "17";
  public bibAmount:string = "";
  public minimumBid:string ="10";
  public currentBid:string ="";
  public showType:string = null;
  public assetUri:string = null;
  public royalties:string = null;
  public saleOrderId:string = null;
  public sellerAddress:string = null;
  constructor(
    private translate:TranslateService,
    private event:Events,
    private native:NativeService,
    private titleBarService:TitleBarService,
    public theme:ThemeService,
    private activatedRoute:ActivatedRoute,
    private web3Service:Web3Service
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      let asset = queryParams.asset || {};
      this.showType = queryParams.showType;
      this.owner = queryParams.name || "";
      this.name = queryParams.name || "";
      this.description = queryParams.description || "";
      this.quantity = queryParams.quantity || "1";
      this.tokenID = queryParams.tokenId || "";
      this.contractAddress = this.web3Service.getStickerAddr();
      this.assetUri = this.handleImg(asset);
      this.fixedPrice = queryParams.fixedAmount || "";
      this.royalties = queryParams.royalties || "";
      this.saleOrderId = queryParams.saleOrderId || "";
    });
  }

  ionViewWillEnter() {
    this.initTile();
    this.collectContractData();
    this.addEvent();
  }

  ionViewWillLeave(){
    this.removeEvent();
    this.event.publish(FeedsEvent.PublishType.search);
    this.event.publish(FeedsEvent.PublishType.notification);
    this.event.publish(FeedsEvent.PublishType.addProflieEvent);
    this.event.publish(FeedsEvent.PublishType.addBinaryEvevnt);
  }

  initTile(){
    this.titleBarService.setTitle(this.titleBar,this.translate.instant('BidPage.title'));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar,true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

   addEvent(){
    this.event.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.initTile();
    });
   }

   removeEvent(){
    this.event.unsubscribe(FeedsEvent.PublishType.updateTitle);
   }

   collectContractData(){
    this.contractDetails = [];
    this.contractDetails.push({
      type:'AssetdetailsPage.owner',
      details:this.owner
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.name',
      details:this.name
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.description',
      details:this.description
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.quantity',
      details:this.quantity
    });

    if(this.dateCreated!=""){
      this.contractDetails.push({
        type:'AssetdetailsPage.dateCreated',
        details:this.dateCreated
      });
    }

     if(this.expirationDate!=""){
      this.contractDetails.push({
        type:'MintnftPage.nftExpirationDate',
        details:this.expirationDate
      });
     }

    this.contractDetails.push({
      type:'AssetdetailsPage.contractAddress',
      details:this.contractAddress
    });

    this.contractDetails.push({
      type:'AssetdetailsPage.tokenID',
      details:this.tokenID
    });

    this.contractDetails.push({
      type:'BidPage.blockchain',
      details:this.blockchain
    });
   }

   clickBuy(){
    this.native.showLoading("common.waitMoment",(isDismiss)=>{
    },60000).then(()=>{
       this.buy();
   }).catch(()=>{
    this.native.hideLoading();
   });
   }

  async buy(){
    //let price = UtilService.accMul(this.fixedPrice,this.quantity).toString();
    //console.log("=====price====="+price);
    let pasarAddr = this.web3Service.getPasarAddr();
    const accBuyer = await this.web3Service.getAccount("04868f294d8ef6e1079752cd2e1f027a126b44ee27040d949a88f89bddc15f31");
    let pasarContract = this.web3Service.getPasar();
    const purchaseData = pasarContract.methods.buyOrder(this.saleOrderId).encodeABI();

    const purchaseTx = {
      from: accBuyer.address,
      to: pasarAddr,
      value:this.fixedPrice,
      data: purchaseData
    };

    const {
      status: purchaseStatus,
    } = await this.web3Service.sendTxWaitForReceipt(purchaseTx, accBuyer);
    this.native.hideLoading();
    if(purchaseStatus!=""&&purchaseStatus!=undefined){
        alert("buy sucess")
        this.native.pop();
    }else{
      alert("=====purchase fail====");
    }
   }

   bid(){
    this.native.navigateForward(['confirmation'],{queryParams:{"showType":"burn"}});
   }

   handleImg(imgUri:string){
    if(imgUri.indexOf("feeds:imgage:")>-1){
      imgUri = imgUri.replace("feeds:imgage:","");
      imgUri = ApiUrl.nftGet+imgUri;
    }
    return imgUri;
   }

  hanldePrice(price:string){
    return this.web3Service.getFromWei(price);
  }

  copytext(text:any){
    let textdata = text || "";
    if(textdata!=""){
      this.native.copyClipboard(text).then(()=>{
        this.native.toast_trans("common.copysucceeded");
    }).catch(()=>{

    });;
    }
  }

}
