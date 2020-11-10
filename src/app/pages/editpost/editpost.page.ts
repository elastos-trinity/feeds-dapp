import { Component, OnInit, NgZone,ElementRef} from '@angular/core';
import { NavController,Events } from '@ionic/angular';
import { FeedService } from 'src/app/services/FeedService';
import { ActivatedRoute } from '@angular/router';
import { NativeService } from '../../services/NativeService';
import { CameraService } from 'src/app/services/CameraService';
import { ThemeService } from '../../services/theme.service';
import { TranslateService } from "@ngx-translate/core";
import { VideoEditor } from '@ionic-native/video-editor/ngx';
import { VgFullscreenAPI } from 'ngx-videogular';
import { AppService } from 'src/app/services/AppService';
import { UtilService } from 'src/app/services/utilService';
import * as _ from 'lodash';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
@Component({
  selector: 'app-editpost',
  templateUrl: './editpost.page.html',
  styleUrls: ['./editpost.page.scss'],
})
export class EditpostPage implements OnInit {
  public connectionStatus = 1;
  public nodeStatus = {};
  public channelAvatar = "";
  public channelName = "";
  public subscribers:string = "";
  public newPost: string="";
  public oldNewPost: string = "";
  public imgUrl: string = "";
  public oldImgUrl: string = "";
  public nodeId: string = "";
  public channelId: number = 0;
  public postId: number = 0;

  public posterImg:string = "";
  public oldPosterImg:string ="";
  public flieUri:any = "";
  public uploadProgress:number = 0;
  public videotype:string = "video/mp4";
  public transcode:number = 0;
  public cacheGetBinaryRequestKey:string ="";
  public cachedMediaType = "";
  public duration:any = 0;

  public totalProgress:number = 0;

  constructor(
    private events: Events,
    private native: NativeService,
    private navCtrl: NavController,
    private acRoute: ActivatedRoute,
    private camera: CameraService,
    private zone: NgZone,
    private feedService: FeedService,
    public theme:ThemeService,
    private translate:TranslateService,
    public vgFullscreenAPI:VgFullscreenAPI,
    public videoEditor:VideoEditor,
    public appService:AppService,
    public el:ElementRef 
  ) {
  }

  ngOnInit() {
    this.acRoute.queryParams.subscribe((data) => {
      let item = _.cloneDeep(data);
      this.nodeId = item["nodeId"] || "";
      this.channelId = item["channelId"] || "";  
      this.postId = item["postId"] || "";    
    });
  }

  ionViewWillEnter() {
    this.initTitle();
    this.native.setTitleBarBackKeyShown(true);
    this.initData();

    this.events.subscribe('feeds:connectionChanged',(status)=>{
      this.zone.run(() => {
        this.connectionStatus = status;
      });
    });

    this.events.subscribe("feeds:friendConnectionChanged", (nodeId, status)=>{
      this.zone.run(()=>{
        this.nodeStatus[nodeId] = status;
      });
     });

    this.events.subscribe('rpcRequest:error', () => {
          this.native.hideLoading();
    });

    this.events.subscribe('rpcResponse:error', () => {
      this.zone.run(() => {
        this.native.hideLoading();
      });
    });

    this.events.subscribe("feeds:updateTitle",()=>{
      this.initTitle();
    });

    this.events.subscribe('feeds:editPostFinish', () => {
      this.zone.run(()=>{
        if(this.imgUrl === "" && this.posterImg ===""){
          this.zone.run(() => {
              this.events.publish("update:tab");
              this.native.hideLoading();
              this.native.pop();
          });
        }
        this.feedService.sendData(this.nodeId,this.channelId,this.postId, 0 ,0, this.flieUri,this.imgUrl);
      });
      
    });

    this.events.subscribe('stream:getBinaryResponse', () => {
      this.zone.run(() => {
       
      });
    });

    this.events.subscribe('stream:getBinarySuccess', (nodeId, key: string, value, mediaType) => {
      this.zone.run(() => {
        this.feedService.closeSession(nodeId);
        this.cacheGetBinaryRequestKey = "";
        if (key.indexOf("img")>-1){
          this.native.hideLoading();
          this.native.openViewer(value,"common.image","PostdetailPage.postview",this.appService);
        } else if (key.indexOf("video")>-1){
          this.flieUri = value;
          this.loadVideo();
        }
        
      });
    });

    this.events.subscribe('stream:error', (nodeId, response) => {
      this.zone.run(() => {

        if (response.code == -107){

        }
        this.native.hideLoading();
        
      });
    });
   
    this.events.subscribe('stream:onStateChangedCallback', (nodeId, state) => {
      this.zone.run(() => {

        if (this.cacheGetBinaryRequestKey == "")
          return;

        if (state === 4){
          this.feedService.getBinary(this.nodeId, this.cacheGetBinaryRequestKey, this.cachedMediaType);
        }
      });
    });


    this.events.subscribe('stream:setBinarySuccess', (nodeId, key) => {
      this.zone.run(() => {
        this.feedService.closeSession(nodeId);
        this.navCtrl.pop().then(()=>{
          this.events.publish("update:tab");
          this.posterImg ="";
          this.oldImgUrl="";
          this.flieUri="";
          this.imgUrl="";
          this.oldImgUrl="";
          this.native.hideLoading();
          this.native.toast_trans("CreatenewpostPage.tipMsg1");
        });
      });
    });

    this.events.subscribe('stream:setBinaryError', (nodeId, response) => {
      this.zone.run(() => {
        //response.code
        this.native.hideLoading();
      });
    });

    this.events.subscribe("feeds:openRightMenu",()=>{
      //this.clVideo();
      this.pauseVideo();
    });

    this.initnodeStatus();
  }

  ionViewWillLeave(){
    this.events.unsubscribe("feeds:connectionChanged");
    this.events.unsubscribe("feeds:friendConnectionChanged");
    this.events.unsubscribe("feeds:updateTitle");
    this.events.unsubscribe("rpcRequest:error");
    this.events.unsubscribe("rpcResponse:error");
    this.events.unsubscribe("feeds:editPostFinish");

    this.events.unsubscribe("stream:setBinarySuccess");
    this.events.unsubscribe("stream:setBinaryError");
    this.events.unsubscribe("stream:getBinarySuccess");
    this.events.unsubscribe("stream:onStateChangedCallback");
    this.events.unsubscribe("feeds:openRightMenu");
    this.posterImg ="";
    this.oldImgUrl="";
    this.flieUri="";
    this.imgUrl="";
    this.oldImgUrl="";
      
    this.removeVideo();
    this.events.publish("addBinaryEvevnt");
    this.feedService.closeSession(this.nodeId);

  }

  pauseVideo(){
    let video:any = document.getElementById('eidtVideo') || "";
     if(this.flieUri!=""&&video!=""){
       video.pause();
     }
   }

  ionViewDidEnter() {
    let sid = setTimeout(()=>{
      this.setFullScreen();
      this.setOverPlay();
      clearTimeout(sid);
    },100);
  }

  initTitle(){
    titleBarManager.setTitle(this.translate.instant("EditpostPage.title"));
  }

  post(){
    let newPost = this.native.iGetInnerText(this.newPost);
    if (newPost === "" && this.imgUrl === ""&&this.flieUri === ""){
      this.native.toast_trans("CreatenewpostPage.tipMsg");
      return false;
    }

    if(this.oldNewPost === newPost && this.oldImgUrl === this.imgUrl&&this.oldPosterImg === this.posterImg){
      this.native.toast_trans("common.nochanges");
      return false;
    }

    if(this.flieUri!=""&&this.posterImg === ""){
      this.native.toast_trans("CreatenewpostPage.tipMsg2");
       return false;
    }
    
    this.native.showLoading("common.waitMoment").then(()=>{
          this.editPost();
    }).catch(()=>{
          this.native.hideLoading();
    });
  }

  editPost(){
    if (this.imgUrl == ""&& this.flieUri == ""){
      let content = this.feedService.createContent(this.newPost,null,null);
      this.feedService.editPost(
        this.nodeId,
        this.channelId,
        this.postId,
        content
      );
    }else{
      this.publishPostThrowMsg(); 
    }
  }
  
  publishPostThrowMsg(){
    if (this.flieUri != ""){
      let videoThumbs: FeedsData.VideoThumb = {
        videoThumb   :   this.posterImg,
        duration     :   this.duration
      };
      let content = this.feedService.createContent(this.newPost, null, videoThumbs);
      this.feedService.editPost(
        this.nodeId,
        this.channelId,
        this.postId,
        content
      );
      return;
    }

    if (this.imgUrl != ""){
      this.feedService.compress(this.imgUrl).then((imageThumb)=>{
        let imgThumbs: FeedsData.ImgThumb[] = [];
        let imgThumb: FeedsData.ImgThumb = {
          index   : 0,
          imgThumb: imageThumb
        }
        imgThumbs.push(imgThumb);

        let content = this.feedService.createContent(this.newPost,imgThumbs,null);
        this.feedService.editPost(
          this.nodeId,
          this.channelId,
          this.postId,
          content
        );
      });
    }
  }
 
  addImg(type: number) {
    this.camera.openCamera(
      30, 0, type,
      (imageUrl: any) => {
        this.zone.run(() => {
          this.imgUrl = imageUrl;
        });
      },
      (err: any) => {
        console.error('Add img err', err);
        let imgUrl = this.imgUrl || "";
        if (imgUrl === "") {
          this.native.toast_trans('common.noImageSelected');
        }
      }
    );
  }

  showBigImage(content: any){
     this.native.openViewer(content,"common.image","EditpostPage.title");
  }

  checkServerStatus(nodeId: string){
    return this.feedService.getServerStatusFromId(nodeId);
  }

  initnodeStatus(){
    let status = this.checkServerStatus(this.nodeId);
   this.nodeStatus[this.nodeId] = status;
  }

  pressName(channelName:string){
    this.native.createTip(channelName);
  }

  getImage(){
    let contentVersion = this.feedService.getContentVersion(this.nodeId,this.channelId,this.postId,0);
    let thumbkey= this.feedService.getImgThumbKeyStrFromId(this.nodeId,this.channelId,this.postId,0,0);
    let key = this.feedService.getImageKey(this.nodeId,this.channelId,this.postId,0,0);
    if(contentVersion == "0"){
         key = thumbkey;
    }  
    this.feedService.getData(key).then((image)=>{
      this.oldImgUrl = image || "";
      this.imgUrl = image || "";
    }).catch(()=>{
      console.log("getImageError");
    })
  }

  getContent(){
    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    let postContent = post.content;
    this.oldNewPost = this.feedService.parsePostContentText(postContent) || "";
    this.newPost = this.feedService.parsePostContentText(postContent) || "";
  }

  initData(){
    let channel = this.feedService.getChannelFromId(this.nodeId,this.channelId) || {};

    this.channelName = channel["name"] || "";
    this.subscribers = channel["subscribers"] || "";
    this.channelAvatar = this.feedService.parseChannelAvatar(channel["avatar"]);
    let post = this.feedService.getPostFromId(this.nodeId, this.channelId, this.postId);
    if(post.content.mediaType === 1){
      this.getImage();
    }

    if(post.content.mediaType === 2){
      this.duration = post.content["videoThumbKey"]["duration"];
      this.initVideo();
    }
   
    this.getContent();

    this.connectionStatus = this.feedService.getConnectionStatus();
  }


  videocam(){
    this.removeVideo();
    this.transcode =0;
    this.uploadProgress =0;
    navigator.device.capture.captureVideo((videosdata:any)=>{
      this.zone.run(()=>{
        let videodata = videosdata[0];
        this.transcodeVideo(videodata['fullPath']).then((newfileUri)=>{
          this.transcode =100;
          newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
          newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");  
          let lastIndex = newfileUri.lastIndexOf("/");
          let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
          let filepath =  newfileUri.substring(0,lastIndex);
          this.readFile(fileName,filepath);
        });
     });
  }, (error)=>{
  }, {limit:1,duration:30});
  }

  selectvideo(){
    this.removeVideo();
    this.camera.getVideo().then((flieUri)=>{
      let path = flieUri.startsWith('file://') ? flieUri : `file://${flieUri}`;
      this.getVideoInfo(path);
      this.transcodeVideo(flieUri).then((newfileUri)=>{
        this.transcode =100;
        newfileUri = "cdvfile://localhost"+newfileUri.replace("file//","");
        newfileUri = newfileUri.replace("/storage/emulated/0/","/sdcard/");  
        let lastIndex = newfileUri.lastIndexOf("/");
        let fileName =  newfileUri.substring(lastIndex+1,newfileUri.length);
        let filepath =  newfileUri.substring(0,lastIndex);
        this.readFile(fileName,filepath);
      });
    }).catch((err)=>{
      console.log("=====getVideoErr===="+JSON.stringify(err));
     })
  }

  readFile(fileName:string,filepath:string){

    window.resolveLocalFileSystemURL(filepath,
      (dirEntry: CordovaFilePlugin.DirectoryEntry)=>{
        dirEntry.getFile(fileName, 
          { create: true, exclusive: false }, 
          (fileEntry) => {

            fileEntry.file((file)=>{

              let filesize  = parseFloat((file.size/1000/1000).toFixed(2));
              if(this.isVideoTipDes(filesize)){
                 this.uploadProgress = 0;
                 this.native.toast_trans(this.translate.instant("common.filevideodes"));
                 return;
              }

              let fileReader = new FileReader();
              fileReader.onloadend =(event:any)=>{

               this.zone.run(()=>{
                 this.flieUri = fileReader.result; 
                 let sid = setTimeout(()=>{
                  //let img = new Image;
                  this.setFullScreen();
                  let video:any = document.getElementById('eidtVideo');
                  video.setAttribute('crossOrigin', 'anonymous')
                  let canvas = document.createElement('canvas');
                  canvas.width = video.clientWidth
                  canvas.height = video.clientHeight
                  video.onloadeddata = (() => {
                    this.zone.run(()=>{
                    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
                    this.posterImg= canvas.toDataURL("image/png",10);
                        
                    //video.setAttribute("poster",this.posterImg);
                    })
                    
                  });
                  clearInterval(sid);
                 },20);
                
               })
              };

              fileReader.onprogress = (event:any)=>{
                this.zone.run(()=>{
                  this.uploadProgress = parseInt((event.loaded/event.total)*100/2+'');
                  if(this.uploadProgress === 50){
                     this.totalProgress = 100;
                  }else{
                    this.totalProgress = 50+this.uploadProgress;
                  }
                })
              };
              
              fileReader.readAsDataURL(file);

           },(err)=>{
              console.log("=====readFileErr====="+JSON.stringify(err));
           });
          },
          (err)=>{
            console.log("=====getFileErr====="+JSON.stringify(err));
          });
      },
      (err:any)=>{
            console.log("=====pathErr====="+JSON.stringify(err));
      });
  }

  onChangeFullscreen(){
    alert("===onChangeFullscreen====");
  };


  async transcodeVideo(path:any):Promise<string>{
    const fileUri = path.startsWith('file://') ? path : `file://${path}`;
    const videoInfo = await this.videoEditor.getVideoInfo({ fileUri });
    this.duration = videoInfo["duration"];
    let width: number = 0;
    let height: number = 0;

    // 视频比例
    const ratio = videoInfo.width / videoInfo.height;
 
    if (ratio > 1) {
      width = videoInfo.width > 480 ? 480 : videoInfo.width;
    } else if (ratio < 1) {
      width = videoInfo.width > 360 ? 360 : videoInfo.width;
    } else if (ratio === 1) {
      width = videoInfo.width > 480 ? 480 : videoInfo.width;
    }

    let videoBitrate = videoInfo["bitrate"]/2;

    height = +(width / ratio).toFixed(0);

    return this.videoEditor.transcodeVideo({
      fileUri,
      outputFileName: `${Date.now()}`,
      outputFileType: this.videoEditor.OutputFileType.MPEG4,
      saveToLibrary:false,
      width,
      height,
      videoBitrate:videoBitrate,
      progress:(info:number)=>{
        this.zone.run(()=>{
          this.transcode = parseInt(info*100/2+'');
          this.totalProgress = this.transcode;
        })
      }
    });
  }

  isVideoTipDes(filesize:number){
   return filesize>10;
  }

  // videocam(){
  //   this.flieUri = '';
  //   this.posterImg='';
  //   navigator.device.capture.captureVideo((videosdata:any)=>{
  //     this.zone.run(()=>{
  //       let videodata = videosdata[0];
  //       let flieUri = videodata['localURL'];
  //       let lastIndex = flieUri.lastIndexOf("/");
  //       let fileName =  flieUri.substring(lastIndex+1,flieUri.length);
  //       let filepath =  flieUri.substring(0,lastIndex);
  //       this.readFile(fileName,filepath);
  //    });
  // }, (error)=>{
  //      console.log("===captureVideoErr==="+JSON.stringify(error));
  // }, {limit:1,duration:14});
  // }

  initVideo(){
      let key = this.feedService.getVideoThumbStrFromId(this.nodeId,this.channelId,this.postId,0);
      this.feedService.getData(key).then((idata:string)=>{
        let imgageData:string = idata || "";
        if(imgageData != ""){
          this.zone.run(()=>{
            this.posterImg = imgageData;
            this.oldPosterImg = imgageData;
          });   
        }
       });
  }

  removeVideo(){
    this.totalProgress = 0;
    this.uploadProgress =0;
    this.totalProgress = 0;
    this.posterImg ="";
    this.flieUri ="";
    let video:any = document.getElementById('eidtVideo') || "";
    if(video!=""){
      let sid = setTimeout(()=>{
        video.load();
        clearTimeout(sid);
      },10);
    }
  }

  setFullScreen(){
    let vgfullscreen = this.el.nativeElement.querySelector("vg-fullscreen") || "";
    if(vgfullscreen !=""){
      vgfullscreen.onclick=()=>{
        let isFullScreen = this.vgFullscreenAPI.isFullscreen;
        if(isFullScreen){
          this.native.setTitleBarBackKeyShown(true);
          titleBarManager.setTitle(this.translate.instant("PostdetailPage.postview"));
          this.appService.addright();
        }else{
          this.native.setTitleBarBackKeyShown(false);
          titleBarManager.setTitle(this.translate.instant("common.video"));
          this.appService.hideright();
         
        }
        this.vgFullscreenAPI.toggleFullscreen(vgfullscreen);
     }
    }
  }

  setOverPlay(){
    let vgoverlayplay:any = this.el.nativeElement.querySelector("vg-overlay-play") || "";
    if(vgoverlayplay!=""){
     vgoverlayplay.onclick = ()=>{
      this.zone.run(()=>{
        if(this.flieUri === ""){
          let key = this.feedService.getVideoKey(this.nodeId,this.channelId,this.postId,0,0);
          this.getVideo(key);
         //this.getVideo(this.nodeId+this.channelId+this.postId);
        }
      });
     }
    }
  }

  getVideo(key:string){
        this.feedService.getData(key).then((videodata:string)=>{
          this.zone.run(()=>{
           
            let videoData = videodata || "";

            if (videoData == ""){
              this.cacheGetBinaryRequestKey = key;
              this.cachedMediaType = "video";
              if (this.feedService.restoreSession(this.nodeId)){
                this.feedService.getBinary(this.nodeId, key, this.cachedMediaType);
              }
              return;
            }
            this.flieUri = videoData;
            this.loadVideo();
          }) 
        }); 
  }

  loadVideo(){
    let vgbuffering:any = this.el.nativeElement.querySelector("vg-buffering");
    vgbuffering.style.display ="none";
    let video:any = this.el.nativeElement.querySelector("video");
     video.addEventListener('ended',()=>{
    let vgoverlayplay:any = this.el.nativeElement.querySelector("vg-overlay-play"); 
    vgbuffering.style.display ="none";
    vgoverlayplay.style.display = "block";  
});

   video.addEventListener('pause',()=>{
  let vgoverlayplay:any = this.el.nativeElement.querySelector("vg-overlay-play");
  vgoverlayplay.style.display = "block";  
});
video.load();
let sid = setTimeout(()=>{
  video.play();
  clearTimeout(sid);
},0);
  }

async getVideoInfo(fileUri:string){
    let videoInfo = await this.videoEditor.getVideoInfo({ fileUri:fileUri });
    this.duration = videoInfo["duration"];
} 

handleTotal(duration:any){ 
  return UtilService.timeFilter(duration);
}
}
