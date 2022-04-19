import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { NativeService } from 'src/app/services/NativeService';
import { TranslateService } from '@ngx-translate/core';
import { ThemeService } from 'src/app/services/theme.service';
import { TitleBarService } from 'src/app/services/TitleBarService';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { FeedService } from 'src/app/services/FeedService';
import { DataHelper } from 'src/app/services/DataHelper';
import { Logger, LogLevel } from 'src/app/services/logger';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { FileHelperService } from 'src/app/services/FileHelperService';
import { FeedsSqliteHelper } from 'src/app/services/sqlite_helper.service';
import { UtilService } from 'src/app/services/utilService';


@Component({
  selector: 'app-hive-interface-test',
  templateUrl: './hive-interface-test.page.html',
  styleUrls: ['./hive-interface-test.page.scss'],
})


export class HiveInterfaceTestPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  public openLog: boolean = false;
  public selectedNetwork: any = "MainNet";
  private destDid = 'did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D';
  constructor(
    private translate: TranslateService,
    public theme: ThemeService,
    private titleBarService: TitleBarService,
    private native: NativeService,
    private feedService: FeedService,
    private zone: NgZone,
    private dataHelper: DataHelper,
    private hiveVaultApi: HiveVaultApi,
    private hiveVaultController: HiveVaultController,
    private fileHelperService: FileHelperService,
    private sqliteHelper: FeedsSqliteHelper
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.initTitle();
    this.selectedNetwork = this.dataHelper.getDevelopNet();
    this.openLog = this.dataHelper.getDevelopLogMode();
  }

  initTitle() {
    this.titleBarService.setTitle(
      this.titleBar,
      'Interface Test'
    );
    this.titleBarService.setTitleBarBackKeyShown(this.titleBar, true);
    this.titleBarService.setTitleBarMoreMemu(this.titleBar);
  }

  createCollection() {
    this.hiveVaultApi.createAllCollections();
  }

  //
  registeScripting() {
    this.hiveVaultApi.registeScripting();
  }

  // channel
  createChannel() {
    // this.hiveVaultApi.createChannel('channelId01', 'channel01 desc', 'address');
    this.hiveVaultController.createChannel('channelTestName', 'channelTest desc', 'avatar address');
  }

  updateChannel() {
    //TODO
    // this.hiveVaultApi.updateChannel();
    // alert('updateChannel');
    this.hiveVaultController.updateChannel('b434c0d62c83ccdf1ecaabf831894f87b086c58bd2f4711d889ae832056d9c7d', 'test new name', 'test new intro', '');
  }

  queryChannelInfo() {
    this.hiveVaultApi.queryChannelInfo(this.destDid, 'b434c0d62c83ccdf1ecaabf831894f87b086c58bd2f4711d889ae832056d9c7d');
    // this.hiveVaultApi.queryChannelInfo(this.destDid, 'channelId01');

  }

  // post
  publishPost() {
    // this.hiveVaultApi.publishPost('channelId01', 'tag01', 'testContent');
    this.hiveVaultController.publishPost('channelId01', 'haha', [], null, 'test');
  }

  updatePost() {
    //TODO
    // this.hiveVaultApi.updatePost('');
    // alert('updatePost');
    // this.hiveVaultController.updatePost('90d7fa220d1e2e97be2b1c7cc00fc0563f953a39ea25ef40d9ae8f40af23cd36', 'channelId01', 'testNewType', 'testNewTag', 'testNewContent');
  }

  deletePost() {
    //TODO
    // this.hiveVaultApi.deletePost('');
    // alert('deletePost');
    // this.hiveVaultController.deletePost('channelId01', '90d7fa220d1e2e97be2b1c7cc00fc0563f953a39ea25ef40d9ae8f40af23cd36');
  }

  queryPostByChannelId() {
    // this.hiveVaultApi.queryPostByChannelId(this.destDid, 'channelId01');
    this.hiveVaultController.getPostListByChannel(this.destDid, '0999ede0515410e8f7716c708868fde605ef25289fd2a7502e5f1982748bd41b');
    alert('queryPostByChannelId');
  }

  queryPostById() {
    this.hiveVaultApi.queryPostById(this.destDid, 'channelId01', 'need Input postId');
    alert('queryPostById');
  }

  //subscription
  querySubscrptionInfoByChannelId() {
    this.hiveVaultApi.querySubscrptionInfoByChannelId('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01');
    // alert('getSubscriptionInfo');
  }

  querySubscriptionInfoByUserDID() {
    this.hiveVaultApi.querySubscriptionInfoByUserDID('did:elastos:imZgAo9W38Vzo1pJQfHp6NJp9LZsrnRPRr', 'did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D');
    // alert('getSubscriptionByUser');
  }

  subscribeChannel() {
    this.hiveVaultApi.subscribeChannel('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'wangran', 0, 0);
    // alert('subscribe');
  }

  unSubscribeChannel() {
    this.hiveVaultApi.
      unSubscribeChannel('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01');
    // alert('unSubscribe');
  }

  // v
  //comment
  createComment() {
    this.hiveVaultApi.createComment('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'refcommentId01', 'test content');
    // alert('addComment');
  }

  // v
  updateComment() {
    // this.hiveVaultApi.updateComment();
    this.hiveVaultApi.updateComment('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6', 'update content');
    // alert('updateComment');
  }

  // v
  queryCommentByPostId() {
    // this.hiveVaultApi.getComment();
    this.hiveVaultApi.queryCommentByPostId('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01');
    // alert('getComments');
  }

  deleteComment() {
    this.hiveVaultApi.deleteComment('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6');
    // alert('deleteComment');
  }

  queryCommentByID() {
    alert('queryCommentByID');
  }

  //like
  queryLikeById() {
    // this.hiveVaultApi.findLikeById();
    this.hiveVaultApi.queryLikeById('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6');
    alert('getLikes');
  }

  queryLikeByPost() {
    // this.hiveVaultApi.findLikeById();
    this.hiveVaultApi.queryLikeByPost('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'b473b33e385f4a4dea1d4ed55eaa1d57c70888b43432cd1c63bddbd605d6a8a9', '5d91a4cd5708ee9ccb8788933eeeb5048c5d79fc7d43625307a243da881d545c');
    alert('getLikes');
  }

  async queryLikeByChannel() {
    // this.hiveVaultApi.findLikeById();
    this.hiveVaultApi.queryLikeByChannel('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'b473b33e385f4a4dea1d4ed55eaa1d57c70888b43432cd1c63bddbd605d6a8a9');

    console.log('......');
    const list = await this.sqliteHelper.queryLikeData();
    console.log('......queryLikeData = ', list);


    const result = this.dataHelper.getSelfLikeV3('5d91a4cd5708ee9ccb8788933eeeb5048c5d79fc7d43625307a243da881d545c', '0');
    console.log('......getSelfLikeV3', result);
    alert('getLikes');
  }

  async addLike() {
    // await this.hiveVaultApi.addLike('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', 'e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6', 0, 0);
    // this.hiveVaultApi.addLike();
    // alert('addLike');
  }

  removeLike() {
    // this.hiveVaultApi.removeLike('did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D', 'channelId01', 'postId01', '', 0, 1);
    // this.hiveVaultApi.removeLike();
    // alert('removeLike');
  }

  downloadCustomeAvatar() {
    alert('downloadCustomeAvatar');
  }

  downloadEssAvatar() {
    alert('downloadEssAvatar');
  }

  uploadMediaData() {
    alert('uploadMediaData');
  }

  syncSelfChannel() {
    this.hiveVaultController.syncSelfChannel();
  }

  syncSelfPost() {
    this.hiveVaultController.syncSelfPosts();
  }

  downloadData() {
    // this.hiveVaultController.getV3Data('','');


  }

  async writeData() {
    const fileName = 'testFile';
    const data = '1234567890';
    await this.fileHelperService.saveV3Data(fileName, data);
  }

  async readData() {
    const fileName = 'testFile';
    const type = '';
    const result = await this.fileHelperService.getV3Data(fileName, type);
    if (result && result != '') {
      console.log('read from local fileName', fileName);
      console.log('read from local type', type);
      console.log('read from local result', result);
      console.log('read from local result length', result.length);
      return;
    }
  }

  async getSubscriptionChannel() {
    const list = await this.dataHelper.getSubscribedChannelV3List();
    console.log('list', list);
    list.forEach(element => {
      console.log('element = ', element);
    });



    const postList = await this.dataHelper.getPostV3List();
    console.log('postList', postList);
    postList.forEach(element => {
      console.log('postList element = ', element);
    });
  }


  async createTables() {
    console.log('createTables');
    try {
      await this.sqliteHelper.createTables();
    } catch (error) {

    }
  }

  queryPostData() {
    console.log('queryPostData');
    this.sqliteHelper.queryPostData();
  }

  queryPostDataByID() {
    console.log('queryPostDataByID');
    this.sqliteHelper.queryPostDataByID('testPostId');
  }

  insertPostData() {
    console.log('insertPostData');
    const mediaDataV3: FeedsData.mediaDataV3 = {
      kind: 'kind',           //"image/video/audio"
      originMediaPath: 'originMediaPath',
      type: 'type',           //"image/jpg",
      size: 0,           //origin file size
      thumbnailPath: 'testpath',    //"thumbnailCid"
      duration: 0,
      imageIndex: 0,
      additionalInfo: 'additionalInfo',
      memo: 'memo'
    }
    const testContent: FeedsData.postContentV3 = {
      version: "3.0",
      content: '',
      mediaData: [mediaDataV3],// 已经上传的到hive(size/type/scriptName@path)
      mediaType: FeedsData.MediaType.containsImg
    }
    const post: FeedsData.PostV3 = {
      destDid: 'testdestDid',
      postId: 'testPostId',

      channelId: 'testChannelId',
      createdAt: UtilService.getCurrentTimeNum(),
      updatedAt: UtilService.getCurrentTimeNum(),
      content: testContent,
      status: FeedsData.PostCommentStatus.available,
      type: 'public',
      tag: 'no tag',
      proof: 'string',
      memo: 'string'
    }
    this.sqliteHelper.insertPostData(post)

    // this.sqliteHelper.test();
  }

  queryPostDataByTime() {
    console.log('queryPostDataByTime');
    this.sqliteHelper.queryPostDataByTime(1648801128610, 1648803967893)
  }


  updatePostData() {
    console.log('updatePostData');
    // this.sqliteHelper.updatePostData();
  }

  deletePostData() {
    console.log('updatePostData');
    // this.sqliteHelper.deletePostData();
  }

  getDisplayName() {
    console.log('getDisplayName');
    this.hiveVaultController.getDisplayName(this.destDid, '7fdb0f185e7d8c412e7208f25b5a4b380566b463a8b4f32c8859561e399fe1d1', this.destDid);
    // this.sqliteHelper.deletePostData();
  }

  querySubscription() {
    console.log('querySubscription');
    this.hiveVaultApi.querySubscription(this.destDid, '7fdb0f185e7d8c412e7208f25b5a4b380566b463a8b4f32c8859561e399fe1d1');
  }

  queryRemotePostByTime() {
    this.hiveVaultApi.queryPostByRangeOfTime(this.destDid, "0999ede0515410e8f7716c708868fde605ef25289fd2a7502e5f1982748bd41b", 0, 1650210408911);
  }

}
