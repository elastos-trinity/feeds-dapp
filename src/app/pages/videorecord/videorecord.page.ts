import { Component, OnInit,NgZone  } from '@angular/core';
import { CameraService } from 'src/app/services/CameraService';
import { DomSanitizer } from '@angular/platform-browser';
declare let titleBarManager: TitleBarPlugin.TitleBarManager;
declare let appManager: AppManagerPlugin.AppManager;
@Component({
  selector: 'app-videorecord',
  templateUrl: './videorecord.page.html',
  styleUrls: ['./videorecord.page.scss'],
})
export class VideorecordPage implements OnInit {
  //videodata
  // {
  //   "name": "video_20201012_144635.mp4",
  //   "localURL": "cdvfile://localhost/sdcard/DCIM/Camera/video_20201012_144635.mp4",
  //   "type": "video/mp4",
  //   "lastModified": null,
  //   "lastModifiedDate": 1602485203000,
  //   "size": 7455582,
  //   "start": 0,
  //   "end": 0,
  //   "fullPath": "file:///storage/emulated/0/DCIM/Camera/video_20201012_144635.mp4"
  // }
  public flieUri:any ="";
  public videotype:string = "video/mp4";
  public uploadProgress:number=0;
  constructor(private camera: CameraService,
              private zone:NgZone,
              private sanitizer: DomSanitizer) { }

  ngOnInit() {
         
  }

  ionViewWillEnter() {
    appManager.setVisible('show');
  }


  videorecord(){
    this.flieUri = '';
    navigator.device.capture.captureVideo((videosdata:any)=>{
      this.zone.run(()=>{
        let videodata = videosdata[0];
        let flieUri = videodata['localURL'];
        console.log("========"+videodata['localURL']);
        let lastIndex = flieUri.lastIndexOf("/");
        let fileName =  flieUri.substring(lastIndex+1,flieUri.length);
        let filepath =  flieUri.substring(0,lastIndex);
        this.readFile(fileName,filepath);
     });
  }, (error)=>{
       console.log("===captureVideoErr==="+JSON.stringify(error));
  }, {limit:1,duration:14});
  }

  browsevideo(){
    this.flieUri = '';
    this.camera.getVideo().then((flieUri)=>{
      flieUri = flieUri.replace("/storage/emulated/0/","/sdcard/")      
      this.zone.run(()=>{
        flieUri = "cdvfile://localhost"+flieUri;
        let lastIndex = flieUri.lastIndexOf("/");
        let fileName =  flieUri.substring(lastIndex+1,flieUri.length);
        let filepath =  flieUri.substring(0,lastIndex);
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

              let fileReader = new FileReader();
              fileReader.onloadend =(event:any)=>{
                
               this.zone.run(()=>{
                 this.flieUri = fileReader.result;
               })
              };

              fileReader.onprogress = (event:any)=>{
                this.zone.run(()=>{
                  this.uploadProgress = parseInt((event.loaded/event.total)*100+'');
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

  writeFile(fileName:string,filepath:string){
    //打开选择的路径
    window.resolveLocalFileSystemURL(filepath,(dirEntry: CordovaFilePlugin.DirectoryEntry)=>{
      console.log("========sucess"+dirEntry.toInternalURL());
      dirEntry.getFile(fileName, { create: true, exclusive: false }, (fileEntry) => {
        console.log('Downloaded file entry', fileEntry);
        //write

        fileEntry.createWriter((fileWriter) => {
          let blob = new Blob();
            fileWriter.onwriteend = (event) => {
                console.log("File written");
                //resolve('trinity:///data/' + fileName);
                console.log("========"+blob.size);
            };
            fileWriter.onerror = (event) => {
                console.error('createWriter ERROR - ' + JSON.stringify(event));
                //reject(event);
                //this.resetProgress();
            };
            fileWriter.write(blob);
        }, (err) => {
            console.error('createWriter ERROR - ' + JSON.stringify(err));
            //reject(err);
            //this.resetProgress();
        });



     
        },(err) => {
            console.error('createWriter ERROR - ' + JSON.stringify(err));
            //reject(err);
            //this.resetProgress();
        });

      },(err)=>{
        console.log("========error"+JSON.stringify(err));
      });

  }
}
