import { Component, OnInit, NgZone,ViewChild} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController,Platform} from '@ionic/angular';
import { Events } from 'src/app/services/events.service';
import { FeedService } from 'src/app/services/FeedService';
import { NativeService } from 'src/app/services/NativeService';
import { MenuService } from 'src/app/services/MenuService';
import { ThemeService } from 'src/app/services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { UtilService } from 'src/app/services/utilService';
import { IonInfiniteScroll,PopoverController} from '@ionic/angular';
import { AppService } from 'src/app/services/AppService';
import { LogUtils } from 'src/app/services/LogUtils';
import { ViewHelper } from 'src/app/services/viewhelper.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import * as _ from 'lodash';

let TAG: string = "Feeds-postview";
@Component({
  selector: 'app-postdetail',
  templateUrl: './postdetail.page.html',
  styleUrls: ['./postdetail.page.scss'],
})
export class PostdetailPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild(IonInfiniteScroll,{static:true}) infiniteScroll: IonInfiniteScroll;
  public postImage:string = "assets/images/loading.png";
  public connectionStatus:number = 1;
  public nodeStatus:any ={};
  public avatar: string = "";

  public channelAvatar:string = "";
  public channelName:string = "";
  public commentAvatar:string = "";
  public commentName:string = "";
  public channelWName:string ="";
  public channelOwner:string = "";
  public channelWOwner:string = "";
  public postContent:string = "";
  public updatedTime:number = 0;
  public likesNum:number = 0;
  public commentsNum:number = 0;

  public captainCommentList:any =[];

  public nodeId:string = "";
  public channelId:number = 0;
  public postId:number = 0;
  public startIndex:number = 0;
  public pageNumber:number = 5;
  public totalData:any = [];

  public popover: any;

  public postStatus = 0;
  public styleObj:any = {width:""};
  public dstyleObj:any = {width:""};

  public hideComment = true;

  public videoPoster:string ="";
  public posterImg:string ="";
  public videoObj:string ="";
  public videoisShow:boolean = false;


  public cacheGetBinaryRequestKey = "";
  public cachedMediaType = "";

  public mediaType:any;

  public fullScreenmodal:any="";

  public hideDeletedComments:boolean = false;

  public maxTextSize = 240;

  public isFullContent = {};

  public isOwnComment = {};

  public userNameList:any = {};

  public isPress:boolean = false;
  public roundWidth:number = 40;
  /**
   * imgPercentageLoading
   */
  public isImgPercentageLoading:boolean = false;
  public imgPercent:number = 0;
  public imgRotateNum:any = {};
  /**
   * imgloading
   */
  public isImgLoading:boolean = false
  public imgloadingStyleObj:any = {};
  public imgDownStatus:string = "";

    /**
   * videoPercentageLoading
   */
     public isVideoPercentageLoading:boolean = false;
     public videoPercent:number = 0;
     public videoRotateNum:any = {};
     /**
      * videoloading
      */
     public isVideoLoading:boolean = false
     public videoloadingStyleObj:any = {};
     public videoDownStatus:string = "";

     public isAndroid:boolean = true;

     public commentId:number = 0;

     public curComment:any = {};

  constructor(
    private platform: Platform,
    private popoverController:PopoverController,
    private acRoute: ActivatedRoute,
    private events: Events,
    private zone: NgZone,
    private native: NativeService,
    private feedService :FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    public menuService: MenuService,
    public appService:AppService,
    public modalController: ModalController,
    private logUtils: LogUtils,
    private titleBarService: TitleBarService,
    private viewHelper: ViewHelper) {
  }

  initData(isInit:boolean){
    let channel = this.feedService.getChannelFromId(this.nodeId, this.channelId) || "";

    this.channelWName = channel["name"] || "";
    this.channelName = UtilService.moreNanme(channel["name"]);
    this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);
    this.channelWOwner = channel["owner_name"] || "";
    this.channelOwner = UtilService.moreNanme(channel["owner_name"],40);

    this.initPostContent();
    this.initnodeStatus();
    if(isInit){
       this.initRefresh();
    }else{
       this.refreshCommentList();
    }
  }

  initRefresh(){
    this.startIndex = 0;
    this.totalData = this.sortCommentList();
    if(this.totalData.length-this.pageNumber > 0){
      this.captainCommentList = this.totalData.slice(0,this.pageNumber);

      this.startIndex++;
      this.infiniteScroll.disabled =false;
    }else{
      this.captainCommentList = this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.initOwnCommentObj();
  }



  initOwnCommentObj(){
   let captainCommentList =  _.cloneDeep(this.captainCommentList);

    _.each(captainCommentList ,(item:any)=>{
        let key = item.id;
        this.userNameList[key] = item["user_name"];
        this.checkCommentIsMine(item);
        let commentId = item.id;
        let replayCommentList = this.feedService.getReplayCommentList(this.nodeId,this.channelId,this.postId,commentId) || [];
        item["replayCommentSum"] = replayCommentList.length;
    });

    this.captainCommentList = _.cloneDeep(captainCommentList);
  }

  refreshCommentList(){
    this.totalData = this.sortCommentList();
    if (this.startIndex!=0&&this.totalData.length - this.pageNumber*this.startIndex > 0){
      this.captainCommentList = this.totalData.slice(0,(this.startIndex)*this.pageNumber);
      this.infiniteScroll.disabled =false;
     } else {
      this.captainCommentList =  this.totalData;
      this.infiniteScroll.disabled =true;
    }
    this.initOwnCommentObj();
  }

  sortCommentList(){
   let captainCommentList = this.feedService.getCaptainCommentList(this.nodeId, this.channelId, this.postId) || [];
   this.hideDeletedComments = this.feedService.getHideDeletedComments();
   if(!this.hideDeletedComments){
    captainCommentList = _.filter(captainCommentList ,(item:any)=> { return item.status != 1; });
   }
   return captainCommentList;
  }

  ngOnInit() {
    this.acRoute.params.subscribe((data)=>{
      this.nodeId = data.nodeId;
      this.channelId = data.channelId;
      this.postId = data.postId;
    });
  }

  initPostContent(){
    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    this.postStatus = post.post_status || 0;
    this.mediaType = post.content.mediaType;
    this.postContent = post.content;
    this.updatedTime = post.updated_at;
    this.likesNum = post.likes;
    this.commentsNum = post.comments;

    if(this.mediaType === 1){
      this.getImage();
    }
    if(post.content.mediaType === 2){
      let key = this.feedService.getVideoThumbStrFromId(this.nodeId,this.channelId,this.postId,0) || "";
      if(key!=""){
        this.getVideoPoster(key);
      }
    }
  }

  ionViewWillEnter() {

    if(this.platform.is("ios")){
      this.isAndroid = false;
    }

    this.hideDeletedComments = this.feedService.getHideDeletedComments();
    this.initTitle();
    this.styleObj.width = (screen.width - 55)+'px';
    this.dstyleObj.width= (screen.width - 105)+'px';
    this.initData(true);
    this.connectionStatus = this.feedService.getConnectionStatus();
    this.feedService.refreshPostById(this.nodeId,this.channelId,this.postId);

    //if (this.connectionStatus == 0)
      //this.feedService.updateComment(this.nodeId, Number(this.channelId) ,Number(this.postId));
    this.events.subscribe(FeedsEvent.PublishType.connectionChanged,(status)=>{
      this.zone.run(() => {
        this.logUtils.logd("Received connectionChanged event, Connection change to "+ status,TAG);
        this.connectionStatus = status;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.commentDataUpdate,()=>{
      this.zone.run(() => {
        this.logUtils.logd("Received commentDataUpdate event",TAG);
        this.startIndex = 0;
        this.initData(true);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.getCommentFinish,(getCommentData: FeedsEvent.getCommentData)=>{
      this.zone.run(() => {
        let nodeId = getCommentData.nodeId;
        let channelId = getCommentData.channelId;
        let postId = getCommentData.postId;
        this.logUtils.logd("Received getCommentFinish event, nodeId is "+ nodeId + " channelId is"+channelId+" postId is "+postId,TAG);
        if (nodeId == this.nodeId && channelId == this.channelId && postId == this.postId){
          this.startIndex = 0;
          this.initData(true);
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.friendConnectionChanged, (friendConnectionChangedData: FeedsEvent.FriendConnectionChangedData)=>{
      this.zone.run(()=>{
        let nodeId = friendConnectionChangedData.nodeId;
        let connectionStatus = friendConnectionChangedData.connectionStatus;
        this.nodeStatus[nodeId] = connectionStatus;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.updateTitle,()=>{
      this.logUtils.logd("Received updateTitle event",TAG);
      if(this.menuService.postDetail!=null){
        this.menuService.hideActionSheet();
        this.menuMore();
      }

      if(this.menuService.commentPostDetail!=null){
         this.menuService.hideCommetActionSheet();
          this.openEditTool(this.curComment);
      }
      this.initTitle();
    });

    this.events.subscribe(FeedsEvent.PublishType.refreshPostDetail, ()=>{
      this.zone.run(() => {
        this.logUtils.logd("Received refreshPostDetail event",TAG);
        let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
        this.postContent = post.content;
        this.updatedTime = post.updated_at;
        this.likesNum = post.likes;
        this.commentsNum = post.comments;
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.editPostFinish, () => {
      this.logUtils.logd("Received editPostFinish event",TAG);
      this.initData(true);
    });

    this.events.subscribe(FeedsEvent.PublishType.deletePostFinish, () => {
      this.logUtils.logd("Received deletePostFinish event",TAG);
      this.events.publish(FeedsEvent.PublishType.updateTab);
      this.native.hideLoading();
      this.initData(true);
    });

    this.events.subscribe(FeedsEvent.PublishType.editCommentFinish, () => {
      this.logUtils.logd("Received editCommentFinish event",TAG);
      this.initData(false);
    });

    this.events.subscribe(FeedsEvent.PublishType.deleteCommentFinish, () => {
      this.logUtils.logd("Received deleteCommentFinish event",TAG);
      this.native.hideLoading();
      this.initData(false);
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcRequestError, () => {
      this.zone.run(() => {
        this.logUtils.logd("Received rpcRequest error event",TAG);
        this.native.hideLoading();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.rpcResponseError, () => {
      this.zone.run(() => {
        this.logUtils.logd("Received rpcResponse error event",TAG);
        this.native.hideLoading();
      });
    });

   this.events.subscribe(FeedsEvent.PublishType.rpcRequestSuccess, () => {
    this.zone.run(() => {
      this.logUtils.logd("Received rpcRequest success event",TAG);
      this.startIndex = 0;
      this.initRefresh();
      this.native.hideLoading();
      this.hideComment =true;
      this.native.toast_trans("CommentPage.tipMsg1");
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.streamGetBinaryResponse, () => {
      this.zone.run(() => {
        this.logUtils.logd("Received streamGetBinaryResponse event",TAG);

      });
    });

    this.events.subscribe(FeedsEvent.PublishType.getBinaryFinish, (getBinaryData: FeedsEvent.GetBinaryData) => {
      this.zone.run(() => {
        let nodeId = getBinaryData.nodeId;
        let key = getBinaryData.key;
        let value = getBinaryData.value;
        this.logUtils.logd("Received getBinaryFinish event, nodeId is "+nodeId+", key is "+key, TAG);
        if(this.nodeId != nodeId){
           return;
        }
        this.processGetBinaryResult(key, value);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.streamGetBinarySuccess, (getBinaryData: FeedsEvent.GetBinaryData) => {
      this.zone.run(() => {
        let nodeId = getBinaryData.nodeId;
        let key = getBinaryData.key;
        let value = getBinaryData.value;
        this.logUtils.logd("Received streamGetBinarySuccess event, nodeId is "+nodeId+", key is "+key, TAG);
        if(this.nodeId != nodeId){
          return;
        }
        this.feedService.closeSession(nodeId);
        this.processGetBinaryResult(key, value);
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.streamError, (streamErrorData: FeedsEvent.StreamErrorData) => {
      this.zone.run(() => {
        let nodeId = streamErrorData.nodeId;
        let error = streamErrorData.error;
        this.logUtils.logd("Received streamError event, nodeId is "+nodeId, TAG);
        if(this.nodeId != nodeId){
          return;
        }
        this.isImgLoading = false;
        this.isImgPercentageLoading = false;
        this.imgDownStatus = "";
        this.isVideoLoading = false;
        this.isVideoPercentageLoading = false;
        this.videoDownStatus = "";
        this.feedService.handleSessionError(nodeId, error);
        this.pauseVideo();
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.streamOnStateChangedCallback, (streamStateChangedData: FeedsEvent.StreamStateChangedData) => {
      this.zone.run(() => {
        let nodeId = streamStateChangedData.nodeId;
        let state = streamStateChangedData.streamState;
        this.logUtils.logd("Received streamOnStateChangedCallback event, nodeId is "+nodeId, TAG);
        if(this.nodeId!=nodeId){
           return;
        }
        if (this.cacheGetBinaryRequestKey == "")
          return;

        if (state === FeedsData.StreamState.CONNECTED){
          this.feedService.getBinary(this.nodeId, this.cacheGetBinaryRequestKey, this.cachedMediaType);
        }
      });
    });

    this.events.subscribe(FeedsEvent.PublishType.streamProgress,(streamProgressData: FeedsEvent.StreamProgressData)=>{
        this.zone.run(() => {
          let nodeId = streamProgressData.nodeId;
          let progress = streamProgressData.progress;
          this.logUtils.logd("Received streamProgress event, nodeId is "+nodeId, TAG);
          if(this.nodeId!=nodeId){
            return;
          }

          if(this.cachedMediaType === 'img'&&this.imgDownStatus==="1"){
            this.imgPercent = progress;
            if(progress<100){
              this.imgRotateNum["transform"] = "rotate("+(18/5)*progress+"deg)";
             }else{
             if(progress === 100){
              this.imgRotateNum["transform"] = "rotate("+(18/5)*progress+"deg)";
             }
            }
            return;
          }

          if(this.cachedMediaType ==='video'&&this.videoDownStatus==="1"){
            this.videoPercent = progress;
            if(progress<100){
              this.videoRotateNum["transform"] = "rotate("+(18/5)*progress+"deg)";
             }else{
             if(progress === 100){
              this.videoRotateNum["transform"] = "rotate("+(18/5)*progress+"deg)";
             }
            }
            return;
          }
        });
    })

    this.events.subscribe(FeedsEvent.PublishType.openRightMenu,()=>{
      this.logUtils.logd("Received openRightMenu event",TAG);
      this.isImgLoading = false;
      this.isImgPercentageLoading = false;
      this.imgDownStatus = "";
      this.isVideoPercentageLoading =false;
      this.isVideoLoading = false;
      this.videoDownStatus = "";
      this.feedService.closeSession(this.nodeId);
      this.native.hideLoading();
      this.pauseVideo();
      this.hideFullScreen();
     });

     this.events.subscribe(FeedsEvent.PublishType.streamClosed,(nodeId)=>{
      this.logUtils.logd("Received streamClosed event, nodeId is "+nodeId,TAG);
      if(this.nodeId!=nodeId){
        return;
      }
      this.isImgLoading = false;
      this.isImgPercentageLoading = false;
      this.imgDownStatus = "";
      this.isVideoPercentageLoading =false;
      this.isVideoLoading = false;
      this.videoDownStatus = "";
      this.feedService.closeSession(this.nodeId);
      this.pauseVideo();
      this.hideFullScreen();
    });
  }


  ionViewWillLeave(){

    let value =  this.popoverController.getTop()["__zone_symbol__value"] || "";
    if(value!=""){
      this.popoverController.dismiss();
      this.popover = null;
    }

     this.events.unsubscribe(FeedsEvent.PublishType.editCommentFinish);
     this.events.unsubscribe(FeedsEvent.PublishType.editPostFinish);

     this.events.unsubscribe(FeedsEvent.PublishType.connectionChanged);
     this.events.unsubscribe(FeedsEvent.PublishType.commentDataUpdate);
     this.events.unsubscribe(FeedsEvent.PublishType.friendConnectionChanged);
     this.events.unsubscribe(FeedsEvent.PublishType.updateTitle);
     this.events.unsubscribe(FeedsEvent.PublishType.refreshPostDetail);


     this.events.unsubscribe(FeedsEvent.PublishType.deletePostFinish);
     this.events.unsubscribe(FeedsEvent.PublishType.deleteCommentFinish);

     this.events.unsubscribe(FeedsEvent.PublishType.getBinaryFinish);

     this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestError);
     this.events.unsubscribe(FeedsEvent.PublishType.rpcResponseError);
     this.events.unsubscribe(FeedsEvent.PublishType.rpcRequestSuccess);

     this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinaryResponse);
     this.events.unsubscribe(FeedsEvent.PublishType.streamGetBinarySuccess);
     this.events.unsubscribe(FeedsEvent.PublishType.streamError);
     this.events.unsubscribe(FeedsEvent.PublishType.streamOnStateChangedCallback);
     this.events.unsubscribe(FeedsEvent.PublishType.streamProgress);
     this.events.unsubscribe(FeedsEvent.PublishType.openRightMenu);
     this.events.unsubscribe(FeedsEvent.PublishType.streamClosed);
     this.events.publish(FeedsEvent.PublishType.updateTab);
     this.events.publish(FeedsEvent.PublishType.addBinaryEvevnt);
     this.events.publish(FeedsEvent.PublishType.addProflieEvent);
     this.events.unsubscribe(FeedsEvent.PublishType.getCommentFinish);
  }


  ionViewDidLeave(){
    this.menuService.hideActionSheet();
    if(this.popover!=null){
      this.popover.dismiss();
    }

    this.imgDownStatus ="";
    this.isImgPercentageLoading = false;
    this.isImgLoading = false;
    this.isVideoPercentageLoading =false;
    this.isVideoLoading = false;
    this.videoDownStatus = "";
    this.hideComment = true;
    this.postImage = "";
    this.isFullContent = {};
    this.isOwnComment = {};
    this.feedService.closeSession(this.nodeId);
    this.clearVideo();
    this.hideFullScreen();
  }

  ionViewDidEnter() {

  }

  initTitle(){
    this.titleBarService.setTitle(this.titleBar, this.translate.instant("PostdetailPage.postview"));
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  getContentText(content: string): string{
    return this.feedService.parsePostContentText(content);
  }

  getContentImg(content: any): string{
    return this.feedService.parsePostContentImg(content);
  }

  indexText(text: string,limit: number, indexLength: number):string{
    return this.feedService.indexText(text,limit,indexLength);
  }

  showComment(comment:any) {
    if(comment === null){
      this.commentId = 0;
      this.commentName = this.channelName;
      this.commentAvatar = this.channelAvatar;
    }else{
      this.commentId = comment.id;
      this.commentName = comment.user_name;
      this.commentAvatar = "./assets/images/default-contact.svg";
    }
    if(this.checkServerStatus(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }

    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    this.pauseVideo();
    this.hideComment = false;
  }

  checkMyLike(){
    return this.feedService.checkMyLike(this.nodeId, Number(this.channelId), Number(this.postId));
  }

  checkLikedComment(commentId: number){
    return this.feedService.checkLikedComment(this.nodeId, Number(this.channelId), Number(this.postId), commentId);
  }

  like(){
    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.checkServerStatus(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }

    if (this.checkMyLike()){
      this.feedService.postUnlike(this.nodeId,Number(this.channelId),Number(this.postId),0);
      return ;
    }

    this.feedService.postLike(this.nodeId,Number(this.channelId),Number(this.postId),0);
  }

  likeComment(commentId: number){

    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    if(this.checkServerStatus(this.nodeId) != 0){
      this.native.toastWarn('common.connectionError1');
      return;
    }

    if (this.checkLikedComment(commentId)){
      this.feedService.postUnlike(this.nodeId,Number(this.channelId),Number(this.postId),commentId);
      return ;
    }

    this.feedService.postLike(this.nodeId,Number(this.channelId),Number(this.postId),commentId);
  }

  handleUpdateDate(updatedTime:number){
    let updateDate = new Date(updatedTime*1000);
    return UtilService.dateFormat(updateDate,'yyyy-MM-dd HH:mm:ss')
  }

  menuMore(){
    let isMine = this.checkChannelIsMine();
    this.pauseVideo();
    if(isMine === 0 && this.postStatus != 1){
      this.menuService.showPostDetailMenu(this.nodeId, Number(this.channelId), this.channelName,this.postId);
    }else{
      this.menuService.showShareMenu(this.nodeId, Number(this.channelId), this.channelName,this.postId);
    }
  }

  showBigImage(){
    this.zone.run(()=>{
        if(this.imgDownStatus != ""){
          return;
        }
        let imagesId = UtilService.gethtmlId("postdetail","img",this.nodeId,this.channelId,this.postId);
        let imagesObj = document.getElementById(imagesId);
        let  imagesWidth = imagesObj.clientWidth;
        let  imagesHeight = imagesObj.clientHeight;
        this.imgloadingStyleObj["position"] = "absolute";
        this.imgloadingStyleObj["left"] = (imagesWidth-this.roundWidth)/2+"px";
        this.imgloadingStyleObj["top"] = (imagesHeight-this.roundWidth)/2+8+"px";
        this.isImgLoading = true;
        let contentVersion = this.feedService.getContentVersion(this.nodeId,this.channelId,this.postId,0);
        let thumbkey= this.feedService.getImgThumbKeyStrFromId(this.nodeId,this.channelId,this.postId,0,0);
        let key = this.feedService.getImageKey(this.nodeId,this.channelId,this.postId,0,0);
        if(contentVersion == "0"){
             key = thumbkey;
        }

        this.feedService.getData(key).then((realImg)=>{
          let img = realImg || "";
          if(img!=""){
            this.imgDownStatus = "";
            this.isImgLoading = false;
            this.viewHelper.openViewer(this.titleBar, realImg,"common.image","PostdetailPage.postview",this.appService);
          }else{
            this.cachedMediaType = "img";
            this.feedService.processGetBinary(this.nodeId, this.channelId, this.postId, 0, 0, FeedsData.MediaType.containsImg, key,
              (transDataChannel)=>{
                this.cacheGetBinaryRequestKey = key;
                if (transDataChannel == FeedsData.TransDataChannel.SESSION){
                  this.imgDownStatus = "1";//session down
                  this.isImgLoading = false;
                  this.isImgPercentageLoading =true;
                  return;
                }
                if (transDataChannel == FeedsData.TransDataChannel.MESSAGE){
                  this.imgDownStatus = "0";//message down
                  return;
                }
              },
              (err)=>{
                this.imgDownStatus = "";
                this.isImgLoading = false;
                this.isImgPercentageLoading = false;
              });
          }
        });
    });
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
     let status = this.checkServerStatus(this.nodeId);
     this.nodeStatus[this.nodeId] = status;
  }

  getImage(){
    let key = this.feedService.getImgThumbKeyStrFromId(this.nodeId,this.channelId,this.postId,0,0) || "";
    if(key !=""){
      this.feedService.getData(key).then((image)=>{
        this.postImage = image || "";
      }).catch((reason)=>{
        this.logUtils.loge("Excute 'getImage' in post page is error , get image data error, error msg is "+JSON.stringify(reason),TAG);
      })
    }

  }

  doRefresh(event:any){
    let sId =  setTimeout(() => {
      //this.postImage = "";
      this.initData(true);
      event.target.complete();
      clearTimeout(sId);
    },500);
  }

  loadData(event:any){
    let sId = setTimeout(() => {
      let arr = [];
      if(this.totalData.length - this.pageNumber*this.startIndex>0){
       arr = this.totalData.slice(this.startIndex*this.pageNumber,(this.startIndex+1)*this.pageNumber);
       this.startIndex++;
       this.zone.run(()=>{
       this.captainCommentList = this.captainCommentList.concat(arr);
       });
       this.initnodeStatus();
       this.initOwnCommentObj();
       event.target.complete();
      }else{
       arr = this.totalData.slice(this.startIndex*this.pageNumber,this.totalData.length);
       this.zone.run(()=>{
           this.captainCommentList = this.captainCommentList.concat(arr);
       });
       this.infiniteScroll.disabled =true;
       this.initnodeStatus();
       this.initOwnCommentObj();
       event.target.complete();
       clearTimeout(sId);
      }
    },500);
  }

  pressName(){
    if(this.channelWName!= "" && this.channelWName.length>15){
      this.viewHelper.createTip(this.channelWName);
    }
  }

  pressOwnerName(){
    if(this.channelWOwner!= "" && this.channelWOwner.length>40){
      this.viewHelper.createTip(this.channelWOwner);
    }
  }

  userName(userName:string){

    let name = userName || "";

    if(name!=""){
      this.viewHelper.createTip(name);
    }

  }

  async openEditTool(comment:any) {
    this.curComment = comment;
    this.menuService.showCommentDetailMenu(comment);
  }

  handleCommentStatus(){
    let status = "(edit)"
    return status;
  }

  checkChannelIsMine(){
    if (this.feedService.checkChannelIsMine(this.nodeId, this.channelId))
      return 0;

    return 1;
  }

  navTo(nodeId:string, channelId:number){
    this.native.navigateForward(['/channels', nodeId, channelId],"");
  }

  checkCommentIsMine(comment:any){
    let commentId = comment.id;
    let isOwnComment = this.feedService.checkCommentIsMine(comment.nodeId,Number(comment.channel_id),Number(comment.post_id),Number(comment.id));
    this.isOwnComment[commentId] = isOwnComment;
  }

  hideComponent(event) {
    this.hideComment = true;
  }

  getVideoPoster(id:string){
    this.videoisShow = true;
    this.feedService.getData(id).then((imagedata)=>{
      let image = imagedata || "";
      if(image!=""){
        this.zone.run(()=>{
            this.posterImg = imagedata;
            let id = this.nodeId+this.channelId+this.postId;
            let sid =setTimeout(()=>{
              let  video:any = document.getElementById(id+"postdetailvideo") || "";
              video.setAttribute("poster",this.posterImg);
              this.setFullScreen();
              this.setOverPlay();
              clearTimeout(sid);
            },0);

        })
      }else{
        this.videoisShow = false;
      }
   }).catch((err)=>{

   })
  }

  getVideo(key:string){
    let videoId = UtilService.gethtmlId("postdetail","video",this.nodeId,this.channelId,this.postId);
    let videoObj = document.getElementById(videoId);
    let  videoWidth = videoObj.clientWidth;
    let  videoHeight = videoObj.clientHeight;
    this.videoloadingStyleObj["z-index"] = 999;
    this.videoloadingStyleObj["position"] = "absolute";
    this.videoloadingStyleObj["left"] = (videoWidth-this.roundWidth)/2+"px";
    this.videoloadingStyleObj["top"] = (videoHeight-this.roundWidth)/2+"px";
    this.isVideoLoading = true;

    this.feedService.getData(key).then((videodata:string)=>{
      this.zone.run(()=>{
        let videoData = videodata || "";
        if (videoData == ""){
          this.cachedMediaType = "video";
          this.feedService.processGetBinary(this.nodeId, this.channelId, this.postId, 0, 0, FeedsData.MediaType.containsVideo, key,
            (transDataChannel)=>{
              this.cacheGetBinaryRequestKey = key;
              if (transDataChannel == FeedsData.TransDataChannel.SESSION){
                this.videoDownStatus = '1';
                this.isVideoLoading = false;
                this.isVideoPercentageLoading =true;
                return;
              }
              if (transDataChannel == FeedsData.TransDataChannel.MESSAGE){
                this.videoDownStatus = '0';
                return;
              }
            },
            (err)=>{
              this.pauseVideo();
            });
        return;
        }
        this.videoObj = videoData;
        this.loadVideo(videoData);
      });
      });
  }

  loadVideo(videodata:any){
    this.isVideoLoading = false;
    this.isVideoPercentageLoading = false;
    this.videoDownStatus = "";
    let id = this.nodeId+this.channelId+this.postId;
    let source:any = document.getElementById(id+"postdetailsource") || "";
    source.setAttribute("src",videodata);
    let  video:any = document.getElementById(id+"postdetailvideo") || "";
    let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaypostdetail");
    let vgcontrol:any = document.getElementById(id+"vgcontrolspostdetail");
    video.addEventListener('ended',()=>{

        vgoverlayplay.style.display = "block";
        vgcontrol.style.display = "none";
    });

    video.addEventListener('pause',()=>{
      vgoverlayplay.style.display = "block";
      vgcontrol.style.display = "none";
    });

    video.addEventListener('play',()=>{
      vgcontrol.style.display = "block";
     });


     video.addEventListener('canplay',()=>{
          video.play();
     });
     video.load();
  }

  pauseVideo(){
    if(this.postStatus != 1&&this.mediaType===2){
      let id = this.nodeId+this.channelId+this.postId;
      let  video:any = document.getElementById(id+"postdetailvideo") || "";
      if(!video.paused){  //判断是否处于暂停状态
          video.pause();  //停止播放
      }
    }
  }

  clearVideo(){
    if(this.postStatus != 1&&this.mediaType===2){
      this.posterImg ="";
      this.videoObj ="";
      let id = this.nodeId+this.channelId+this.postId;
      let video:any = document.getElementById(id+"postdetailvideo") || "";
      if(video!=""){
        //video.removeAttribute('poster');
      }

      let source:any = document.getElementById(id+"postdetailsource") || "";
      if(source != ""){
        source.removeAttribute('src'); // empty source
      }
      if(video!=""){
        // let sid=setTimeout(()=>{
        //   video.load();
        //   clearTimeout(sid);
        // },10)
      }
    }
  }

  setFullScreen(){
    let id = this.nodeId+this.channelId+this.postId;
    let vgfullscreen:any = document.getElementById(id+"vgfullscreenpostdetail") || "";
    if(vgfullscreen !=""){
      vgfullscreen.onclick=()=>{
         this.pauseVideo();
         let postImg:string = document.getElementById(id+"postdetailvideo").getAttribute("poster");
         let videoSrc:string = document.getElementById(id+"postdetailsource").getAttribute("src");
         this.fullScreenmodal = this.native.setVideoFullScreen(postImg,videoSrc);
     }
    }
  }

  hideFullScreen(){
    if(this.fullScreenmodal != ""){
      this.modalController.dismiss();
      this.fullScreenmodal = "";
    }
  }

  setOverPlay(){

    let id = this.nodeId+this.channelId+this.postId;
    let vgoverlayplay:any = document.getElementById(id+"vgoverlayplaypostdetail") || "";
    if(vgoverlayplay!=""){
     vgoverlayplay.onclick = ()=>{
      this.zone.run(()=>{

        if(this.checkServerStatus(this.nodeId) != 0){
          this.pauseVideo();
          this.native.toastWarn('common.connectionError1');
          return;
        }

        let source:any = document.getElementById(id+"postdetailsource") || "";
        let sourceSrc = source.getAttribute("src") || "";
        if (sourceSrc != "")
          return;

        let key = this.feedService.getVideoKey(this.nodeId,this.channelId,this.postId,0,0);
        this.getVideo(key);
      });
     }
    }
  }

  handleTotal(){
    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    let videoThumbKey = post.content["videoThumbKey"] || "";
    let duration = 29;
    if(videoThumbKey != ""){
      duration = videoThumbKey["duration"] || 0;
    }
    return UtilService.timeFilter(duration);
  }

  processGetBinaryResult(key: string, value: string){
    this.cacheGetBinaryRequestKey = "";
    if (key.indexOf("img")>-1){
      this.imgDownStatus = "";
      this.isImgPercentageLoading = false;
      this.isImgLoading = false;
      this.viewHelper.openViewer(this.titleBar, value,"common.image","PostdetailPage.postview",this.appService);
    } else if (key.indexOf("video")>-1){
      this.videoDownStatus = "";
      this.isVideoPercentageLoading = false;
      this.isVideoLoading = false;
      this.videoObj = value;
      this.loadVideo(value);
    }
  }

  getPostContentTextSize(content:string){
    let size = UtilService.getSize(content);
    return size;
  }

  handleCommentContent(text:string){
    return text.substring(0,180);
  }

  showFullContent(commentId:string){
     this.isFullContent[commentId] = true;
  }

  hideFullContent(commentId:string){
    this.isFullContent[commentId] = false;
  }

  pressContent(postContent:string){
    if(this.platform.is('ios')){
      this.isPress = true;
   }
    let text = this.feedService.parsePostContentText(postContent);
    this.native.copyClipboard(text).then(()=>{
      this.native.toast_trans("common.textcopied");
    }).catch(()=>{

    });
  }

  clickUrl(event:any){
    event = event || "";
    if(event!=""){
     let e = event||window.event; //兼容IE8
     let target = e.target||e.srcElement;  //判断目标事件
     if(target.tagName.toLowerCase()=="span"){
      if(this.isPress){
        this.isPress =false;
       return;
      }
      let url = target.textContent || target.innerText;
      this.native.clickUrl(url,event);
     }
    }
  }

  handleDisplayTime(createTime:number){
    let obj = UtilService.handleDisplayTime(createTime);
    if(obj.type === 's'){
      return this.translate.instant('common.just');
    }
    if(obj.type==='m'){
      if(obj.content === 1){
        return obj.content+this.translate.instant('HomePage.oneminuteAgo');
      }
      return obj.content+this.translate.instant('HomePage.minutesAgo');
    }
    if(obj.type==='h'){
      if(obj.content === 1){
        return obj.content+this.translate.instant('HomePage.onehourAgo');
      }
      return obj.content+this.translate.instant('HomePage.hoursAgo');
    }
    if(obj.type === 'day'){

      if(obj.content === 1){
        return this.translate.instant('common.yesterday');
      }
      return obj.content +this.translate.instant('HomePage.daysAgo');
    }
    return  obj.content;
  }

  clickDashang(){

    if(this.feedService.getConnectionStatus() != 0){
      this.native.toastWarn('common.connectionError');
      return;
    }

    let server = this.feedService.getServerbyNodeId(this.nodeId)|| {};
    let elaAddress = server["elaAddress"] || null;

    if (elaAddress == null){
      this.native.toast('common.noElaAddress');
      return;
    }
    this.pauseVideo();
    this.viewHelper.showPayPrompt(this.nodeId,this.channelId,elaAddress);
  }

  clickComment(comment:any){
    let commentId:number = comment.id;
    this.native.navigateForward(['commentlist'],{
      queryParams: {
        nodeId:this.nodeId,
        channelId:this.channelId,
        postId:this.postId,
        commentId: commentId,
        username:comment["user_name"]
      }
    });
  }
  retry(nodeId: string, feedId: number, postId: number){
    this.feedService.republishOnePost(nodeId, feedId, postId);
  }
}