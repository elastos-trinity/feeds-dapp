import { Injectable } from '@angular/core';
import { HiveVaultApi } from 'src/app/services/hivevault_api.service';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';
import { PostHelperService } from 'src/app/services/post_helper.service';
import SparkMD5 from 'spark-md5';
import { UtilService } from 'src/app/services/utilService';
import { Logger } from './logger';

const TAG = 'HiveVaultController';
let eventBus: Events = null;

@Injectable()
export class HiveVaultController {
  public static CREATEALLCollECTION = "feeds_createALLCollections" // 本地标识是否创建了Collection
  constructor(private hiveVaultApi: HiveVaultApi,
    private dataHelper: DataHelper,
    private postHelperService: PostHelperService,

  ) {
  }

  //获得订阅的channel列表
  async getHomePostContent() {
    const subscribedChannels = await this.dataHelper.getSubscribedChannelV3List();
    subscribedChannels.forEach(async (item: FeedsData.SubscribedChannelV3) => {
      const channelId = item.channelId
      const destDid = item.destDid

      const subscribedPost = await this.hiveVaultApi.queryPostByChannelId(destDid, channelId)
      const items = subscribedPost["find_message"]["items"]
      items.forEach(async item => {
        const contents = JSON.parse(item['content'])
        let mDatas = contents['mediaData'];
        let mData = {}
        for (let index = 0; index < mDatas.length; index++) {
          mData = mDatas[index];
        }
        console.log("mData ===== ", mData)
        const mediaType = contents['mediaType']
        // mediaDataV3
        const kind = mData['kind']
        const thumbnailPath = mData['thumbnailPath']
        const originMediaPath = mData['originMediaPath']
        const type = mData['type']
        const size = mData['size']
        const duration = mData['duration']
        const imageIndex = mData['imageIndex']
        const additionalInfo = mData['additionalInfo']
        const memo = mData['memo']

        const version = contents['version']
        const postContent = contents['content']
        const mediaDataV3: FeedsData.mediaDataV3 = {
          kind: kind,
          originMediaPath: originMediaPath,
          type: type,
          size: size,
          thumbnailPath: thumbnailPath,
          duration: duration,
          imageIndex: imageIndex,
          additionalInfo: additionalInfo,
          memo: memo
        }
        let mediaDatasV3: FeedsData.mediaDataV3[] = []
        mediaDatasV3.push(mediaDataV3)
        let content: FeedsData.postContentV3 = {
          version: version,
          mediaData: mediaDatasV3,
          content: postContent,
          mediaType: mediaType
        }
        // 存储post 
        let post: FeedsData.PostV3 = {
          destDid: destDid,
          postId: item.post_id,
          channelId: item.channel_id,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          content: content,
          status: item.status,
          type: item.type,
          tag: item.tag,
          proof: '',
          memo: item.memo
        }
        await this.dataHelper.addPostV3(post)
      });
      // const getPost = await this.dataHelper.getPostV3List()
    })
    //提前加载：TODO
  }

  async downloadScripting(destDid: string, mediaPath: string) {

    return this.hiveVaultApi.downloadScripting(destDid, mediaPath)
  }

  getChannelInfoById() {

  }

  getPostListByChannel(destDid: string, channelId: string): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      //目前暂时获取全部post，后续优化
      const result = await this.hiveVaultApi.queryPostByChannelId(destDid, channelId);
      const postList = this.parsePostResult(result);
      resolve(postList);
    });
  }

  private parsePostResult(result: any): Promise<FeedsData.PostV3> {
    return new Promise(async (resolve, reject) => {
      try {
        const jsonResult = JSON.parse(result);
        console.log('jsonResult', jsonResult);

        // awaits finish
        const postList = null;
        resolve(postList);
      } catch (error) {
        Logger.error(TAG, 'Parse post result error', error);
        reject(error);
      }
    });
  }

  getCommentByChannel() {
  }

  async publishPost(channelId: string, postText: string, imagesBase64: string[], videoData: FeedsData.videoData, tag: string) {
    const mediaData = await this.postHelperService.prepareMediaDataV3(imagesBase64, videoData)
    let medaType = FeedsData.MediaType.noMeida
    if (imagesBase64[0].length > 0) {
      medaType = FeedsData.MediaType.containsImg

    } else if (videoData.video.length > 0) {
      medaType = FeedsData.MediaType.containsVideo
    }
    const content = await this.postHelperService.preparePublishPostContentV3(postText, mediaData, medaType);

    return await this.hiveVaultApi.publishPost(channelId, tag, JSON.stringify(content))
  }

  async createCollectionAndRregisteScript(callerDid: string) {
    let isCreateAllCollections = localStorage.getItem(callerDid + HiveVaultController.CREATEALLCollECTION) || ''
    if (isCreateAllCollections === '') {
      try {
        await this.hiveVaultApi.createAllCollections()
      } catch (error) {
        localStorage.setItem(callerDid + HiveVaultController.CREATEALLCollECTION, "true")
      }
      await this.hiveVaultApi.registeScripting()
    }
  }

  async createChannel(destDid: string, channelName: string, intro: string, avatarAddress: string, tippingAddress: string = '', type: string = 'public', nft: string = ''): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // 处理avatar
        const avatarHiveURL = await this.hiveVaultApi.uploadMediaData(avatarAddress)
        const doc = await this.hiveVaultApi.createChannel(channelName, intro, avatarHiveURL, tippingAddress, type, nft)
        const channelId = doc['channel_id']
        const createdAt = doc['created_at']
        const updatedAt = doc['updated_at']
        let channelV3: FeedsData.ChannelV3 = {
          destDid: destDid,
          channelId: channelId,
          createdAt: createdAt,
          updatedAt: updatedAt,
          name: channelName,
          intro: intro,
          avatar: avatarAddress, // 存储图片
          type: type,
          tipping_address: tippingAddress,
          nft: nft,
          category: "",
          proof: "",
          memo: doc.memo,
        }
        await this.dataHelper.updateChannelV3(channelV3);
        const channels = await this.dataHelper.loadChannelV3Map()
        console.log("loadChannelV3Map ==== ", channels)
        resolve(channelV3.channelId)
      } catch (error) {
        reject(error)
      }
    });
  }

  async subscribeChannel(destDid: string, channelId: string, userDisplayName: string) {
    const result = await this.hiveVaultApi.subscribeChannel(destDid, channelId, userDisplayName)
    await this.dataHelper.addSubscribedChannelV3(destDid, channelId) // 存储这个
    return result
  }

  handlePostResult(result: any): FeedsData.PostV3[] {
    return;
  }

  getAllPostScripting() {
    // const postList = this.hiveVaultApi();
  }


}