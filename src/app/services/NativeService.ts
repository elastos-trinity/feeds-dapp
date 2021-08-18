import { Injectable } from '@angular/core';
import { ToastController, LoadingController, NavController,PopoverController} from '@ionic/angular';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { Router } from '@angular/router';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { TranslateService} from '@ngx-translate/core';
import { ModalController } from '@ionic/angular';
import { VideofullscreenComponent } from './../components/videofullscreen/videofullscreen.component';
import { IntentService } from 'src/app/services/IntentService';
import { Network } from '@ionic-native/network/ngx';

@Injectable()
export class NativeService {
    public loading:any = null;
    constructor(
        private popoverController:PopoverController,
        public modalController: ModalController,
        private toastCtrl: ToastController,
        private clipboard: Clipboard,
        private inappBrowser: InAppBrowser,
        private loadingCtrl: LoadingController,
        private navCtrl: NavController,
        private router: Router,
        private translate: TranslateService,
        private intentService: IntentService,
        private network: Network) {
    }

    public toast(message: string = 'Operation completed', duration: number = 3000): void {
        message = this.translate.instant(message);
        this.toastCtrl.create({
            mode: 'ios',
            color: 'success',
            message,
            duration: 3000,
            position: 'top'
        }).then(toast => toast.present());
    }

    public toastWarn(message: string = 'Operation completed', duration: number = 3000): void {
        message = this.translate.instant(message);
        this.toastCtrl.create({
            mode: 'ios',
            color: 'warning',
            message,
            duration: 3000,
            position: 'top'
        }).then(toast => toast.present());
    }

    public toastdanger(message: string = 'Operation completed', duration: number = 3000): void {
        message = this.translate.instant(message);
        this.toastCtrl.create({
            mode: 'ios',
            color: 'danger',
            message,
            duration: 3000,
            position: 'top'
        }).then(toast => toast.present());
    }

    public toast_trans(_message: string = '', duration: number = 3000): void {
        _message = this.translate.instant(_message);
        this.toastCtrl.create({
            mode: 'ios',
            color: 'success',
            message: _message,
            duration: duration,
            position: 'top'
        }).then(toast => toast.present());
    }


    public copyClipboard(text) {
        return this.clipboard.copy(text);
    }

    public go(page: any, options: any = {}) {
        this.navCtrl.navigateForward(page,{ queryParams: options });
    }

    public pop() {
        this.navCtrl.pop();
    }

    public setRootRouter(router) {
        this.navCtrl.navigateRoot(router);
    }


    public async showLoading(content: string = '', dismissCallback?: (isDissmiss: boolean) => void, durationTime: number = 30000) {
        content = this.translate.instant(content);
        let isTimeout = false;
        let sid =setTimeout(()=>{
            isTimeout = true;
            clearTimeout(sid);
        },durationTime);

        this.loading = await this.loadingCtrl.create({
            cssClass: 'loading-class',
            message: content,
            duration: durationTime
        });

        this.loading.onWillDismiss().then(()=>{
            this.loading = null;
            let temp = dismissCallback || "";
            if(temp!="")
            dismissCallback(isTimeout);
        });



        return await this.loading.present();
    };

    public updateLoadingMsg(msg: string){
        if (this.loading!= null && this.loading != undefined)
            this.loading.message = msg;
    }

    public hideLoading(): void {
            if(this.loading !=null){
               this.loading.dismiss();
            }
    };

    public getTimestamp() {
        return new Date().getTime().toString();
    }

    public openUrl(url: string) {
        const target = "_system";
        const options = "location=no";
        this.inappBrowser.create(url, target, options);
    }

    // setTitleBarBackKeyShown(show: boolean) {
        // if (show) {
        //     titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, {
        //         key: "back",
        //         iconPath: TitleBarPlugin.BuiltInIcon.BACK
        //     });
        // }
        // else {
        //     titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_LEFT, null);
        // }
    // }

    getNavCtrl(){
        return this.navCtrl;
    }

    navigateForward(router:any, options:any):Promise<boolean>{
        let option = options || "";
        if(option !== ""){
            return this.navCtrl.navigateForward(router, options);
        } else {
            return this.navCtrl.navigateForward(router);
        }
    }

      getRouter(){
          return this.router;
      }

      iGetInnerText(testStr:string) {
        var resultStr = testStr.replace(/\s+/g,""); //去掉空格
        if(resultStr!=''){
            resultStr = testStr.replace(/[\r\n]/g, ""); //去掉回车换行
        }
        return resultStr;
    }

    networkInfoInit() {
        // navigator.connection.Initialize();
    }

    addNetworkListener(offline:()=>void, online:()=>void){
        // watch network for a disconnection
        let disconnectSubscription = this.network.onDisconnect().subscribe(() => {
            console.log('network was disconnected :-(');
            offline();
        });

        // stop disconnect watch
        // disconnectSubscription.unsubscribe();

        // watch network for a connection
        let connectSubscription = this.network.onConnect().subscribe(() => {
            console.log('network connected!');
            online();
        });

        // stop connect watch
        // connectSubscription.unsubscribe();
    }

    checkConnection() {
        // var networkState = navigator.connection.type;
        var states = {};
        states[Connection.UNKNOWN]  = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI]     = 'WiFi connection';
        states[Connection.CELL_2G]  = 'Cell 2G connection';
        states[Connection.CELL_3G]  = 'Cell 3G connection';
        states[Connection.CELL_4G]  = 'Cell 4G connection';
        states[Connection.CELL]     = 'Cell generic connection';
        states[Connection.NONE]     = 'No network connection';
        // console.log('Connection type: ' + states[networkState]);
    }


    // async openViewer(titleBar: TitleBarComponent, imgPath:string,newNameKey:string,oldNameKey:string,appService?:any,isOwer?:boolean) {
    //     this.titleBarService.setTitle(titleBar, this.translate.instant(newNameKey));
    //     this.titleBarService.setTitleBarBackKeyShown(titleBar, false);
    //     appService.hideright();
    //     const modal = await this.modalController.create({
    //       component: ViewerModalComponent,
    //       componentProps: {
    //         src: imgPath,
    //         slideOptions:{ centeredSlides: true, passiveListeners:true, zoom: { enabled: true } }
    //       },
    //       cssClass: 'ion-img-viewer',
    //       keyboardClose:true,
    //       showBackdrop:true,
    //     });

    //     modal.onWillDismiss().then(()=>{
    //         document.removeEventListener('click',(event)=> this.hide(modal),false);
    //         this.titleBarService.setTitle(titleBar, this.translate.instant(oldNameKey));

    //         if(oldNameKey!='FeedsPage.tabTitle2'&&oldNameKey!='FeedsPage.tabTitle1'){
    //             this.titleBarService.setTitleBarBackKeyShown(titleBar, true);
    //         }
    //         // if(isOwer){
    //         //     titleBarManager.setIcon(TitleBarPlugin.TitleBarIconSlot.INNER_RIGHT, {
    //         //         key: "editChannel",
    //         //         iconPath: TitleBarPlugin.BuiltInIcon.EDIT
    //         //       });
    //         // }
    //         appService.addright();

    //     })

    //     return await modal.present().then(()=>{

    //             const el:any = document.querySelector('ion-modal') || "";
    //             el.addEventListener('click', (event) => this.hide(modal), true);

    //     });

    //   }

      hide(modal:any){
         modal.dismiss();
      }

      parseJSON(str:string): any{
        if (typeof(str)== 'string') {
            try {
                var obj = JSON.parse(str);
                if (typeof obj == 'object') {
                    return obj;
                } else {
                    return str;
                }
            } catch (e) {
                return str;
            }
        }else{
            return str;
        }
    }

    // async createTip(name:string){
    //     let popover = await this.popoverController.create({
    //       mode:'ios',
    //       component:MorenameComponent,
    //       cssClass: 'genericPopup',
    //       componentProps: {
    //         "name":name
    //       }
    //     });
    //     popover.onWillDismiss().then(() => {
    //         popover = null;
    //     });
    //     return await popover.present();
    // }

      /**
 * 防抖节流
 * @param {*} action 回调
 * @param {*} delay 等待的时间
 * @param {*} context this指针
 * @param {Boolean} iselapsed 是否等待上一次
 * @returns {Function}
 */

  public throttle(action:any, delay:number, context:any, iselapsed:boolean): Function {
    let timeout = null;
    let lastRun = 0;
    return function () {
        if (timeout) {
            if (iselapsed) {
                return;
            } else {
                clearTimeout(timeout);
                timeout = null;
            }
        }
        let elapsed = Date.now() - lastRun;
        let args = arguments;
        if (iselapsed && elapsed >= delay) {
            runCallback();
        } else {
            timeout = setTimeout(runCallback, delay);
        }
        /**
         * 执行回调
         */
        function runCallback() {
            lastRun = Date.now();
            timeout = false;
            action.apply(context, args);
        }
    };
  }


async setVideoFullScreen(postImg:string,videoSrc:string) {
    const modal = await this.modalController.create({
          component: VideofullscreenComponent,
          componentProps: {
            'postImg': postImg,
            'videoSrc': videoSrc,
          }
        });
    await modal.present();
    return modal;
}

public clickUrl(url:string,event:any){
        this.openUrl(url);
        event.stopPropagation();
}

//   async showPayPrompt(elaAddress:string) {

//     let popover = await this.popoverController.create({
//       mode: 'ios',
//       cssClass: 'PaypromptComponent',
//       component: PaypromptComponent,
//       backdropDismiss: false,
//       componentProps: {
//         "title": this.translate.instant("ChannelsPage.tip"),
//         "elaAddress": elaAddress,
//         "defalutMemo": ""
//       }
//     });
//     popover.onWillDismiss().then(() => {
//       popover = null;
//     });
//     return await popover.present();
//   }

  getShare(qrCodeString:string){
    this.intentService.share("", qrCodeString);
  }
}
