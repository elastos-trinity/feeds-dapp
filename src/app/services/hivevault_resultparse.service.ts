import { Injectable } from '@angular/core';
import { Logger } from './logger';
const TAG = 'HiveVaultResultParse';

@Injectable()
export class HiveVaultResultParse {
  /** parse post result start */
  // const posts = result.find_message.items;
  // const post = result;
  public static parsePostResult(targetDid: string, result: any): FeedsData.PostV3[] {
    try {
      /**
       * channel_id: "channelId01"
       * content: "testContent"
       * created: {$date: 1647853513817}
       * created_at: 1647853515908
       * memo: ""
       * modified: {$date: 1647853513817}
       * post_id: "90d7fa220d1e2e97be2b1c7cc00fc0563f953a39ea25ef40d9ae8f40af23cd36"
       * status: 0
       * tag: "tag01"
       * type: "public"
       * updated_at: 1647853515908
       */
      const posts = result;
      let parseResult = [];
      console.log('result ===== ', posts);
      if (posts) {
        posts.forEach(post => {
          if (post) {
            const contents = JSON.parse(post['content'])
            let mDatas = contents['mediaData'];
            let mData = {}
            for (let index = 0; index < mDatas.length; index++) {
              mData = mDatas[index];
            }
            // mediaDataV3
            const mediaDataV3: FeedsData.mediaDataV3 = {
              kind: mData['kind'],
              originMediaPath: mData['originMediaPath'],
              type: mData['type'],
              size: mData['size'],
              thumbnailPath: mData['thumbnailPath'],
              duration: mData['duration'],
              imageIndex: mData['imageIndex'],
              additionalInfo: mData['additionalInfo'],
              memo: mData['memo']
            }
            let mediaDatasV3: FeedsData.mediaDataV3[] = []
            mediaDatasV3.push(mediaDataV3)

            // postContentV3
            let content: FeedsData.postContentV3 = {
              version: contents['version'],
              mediaData: mediaDatasV3,
              content: contents['content'],
              mediaType: contents['mediaType']
            }
            // PostV3
            const postResult: FeedsData.PostV3 = {
              destDid: targetDid,
              postId: post.post_id,
              channelId: post.channel_id,
              createdAt: post.created_at,
              updatedAt: post.updated_at,
              content: content,
              status: post.status,
              type: post.type,
              tag: post.tag,
              proof: '',
              memo: post.memo
            }
            parseResult.push(postResult);
          }
        });
      }
      return parseResult;
    } catch (error) {
      Logger.error(TAG, 'Parse post result error', error);
    }
  }
  /** parse post result end */

  /** parse channel result start */
  // const channels = result.find_message.items;
  // const channels = result
  public static parseChannelResult(targetDid: string, result: any): FeedsData.ChannelV3[] {
    try {
      /**
       * avatar: "address"
       * channel_id: "b434c0d62c83ccdf1ecaabf831894f87b086c58bd2f4711d889ae832056d9c7d"
       * created: {$date: 1647859734867}
       * created_at: 1647859737317
       * intro: "channel01 desc"
       * memo: ""
       * modified: {$date: 1647859734867}
       * name: "channelId01"
       * nft: ""
       * tipping_address: ""
       * type: "public"
       * updated_at: 1647859737317
       */
      const channels = result;
      let parseResult = [];
      console.log('parseChannelResult result ====== ', channels);
      if (channels) {
        channels.forEach(channel => {
          if (channel) {
            const channelResult: FeedsData.ChannelV3 = {
              destDid: targetDid,
              channelId: channel.channel_id,

              createdAt: channel.created_at,
              updatedAt: channel.updated_at,
              name: channel.name,
              intro: channel.intro,
              avatar: channel.avatar,
              type: channel.type,
              tipping_address: channel.tipping_address,
              nft: channel.nft,
              category: channel.category,
              proof: '',
              memo: channel.memo,
            }
            parseResult.push(channelResult);
          }
        });
      }
      return parseResult;
    } catch (error) {
      Logger.error(TAG, 'Parse channel result error', error);
    }
  }
  /** parse channel result end */

  /** parse comment result start*/
  public static parseCommentResult(destDid: string, result: any): FeedsData.CommentV3[] {
    try {
      /**
       * channel_id: "channelId01"
       * comment_id: "c5bc7101e68ced5941ac87432176e2e2c20254d955e7b69f0d003e4d9a3d8b34"
       * content: "test content"
       * created: 1647326414.184314
       * created_at: 1647326414404
       * creater_did: "did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D"
       * modified: 1647326414.184314
       * post_id: "postId01"
       * refcomment_id: "refcommentId01"
       * status: 0
       * updated_at: 1647326414404
       */
      const comments = result.find_message.items;
      let parseResult = [];
      console.log('result', comments);
      if (comments) {
        comments.forEach(comment => {
          if (comment) {
            const commentResult: FeedsData.CommentV3 = {
              destDid: destDid,
              commentId: comment.comment_id,

              channelId: comment.channel_id,
              postId: comment.post_id,
              refcommentId: comment.refcomment_id,
              content: comment.content,
              status: comment.status,
              updatedAt: comment.updated_at,
              createdAt: comment.created_at,
              proof: '',
              memo: comment.memo
            }
            parseResult.push(commentResult);
          }

        });
      }
      return parseResult;
    } catch (error) {
      Logger.error(TAG, 'Parse comment result error', error);
    }
  }
  /** parse comment result end*/

  /** parse like result start */
  public static pareLikeResult(destDid: string, result: any): FeedsData.LikeV3[] {
    try {
      /**
       * channel_id: "channelId01"
       * comment_id: "e008c6785f40e5a4e3b502562f1edab276de2a093c9dc1d584617ebda0e61bd6"
       * created: 1647918917.274691
       * created_at: 1647918923817
       * creater_did: "did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D"
       * modified: 1647918917.274691
       * post_id: "postId01"
       */
      const likes = result.find_message.items;
      let parseResult = [];
      console.log('result', likes);
      if (likes) {
        likes.forEach(like => {
          if (like) {
            const likeResult: FeedsData.LikeV3 = {
              destDid: destDid,
              postId: like.post_id,
              commentId: like.comment_id,

              channelId: like.channel_id,
              createdAt: like.created_at,
              createrDid: like.creater_did,
              proof: like.proof,
              memo: like.memo
            }
            parseResult.push(likeResult);
          }
        });
      }
      return parseResult;
    } catch (error) {
      Logger.error(TAG, 'Parse like result error', error);
    }
  }
  /** parse like result end */

  /** parse subscription result start */
  public static parseSubscriptionResult(destDid: string, result: any): FeedsData.SubscriptionV3[] {
    try {
      /**
       * channel_id: "channelId01"
       * created: 1647394426.255574
       * created_at: 1647394427804
       * display_name: "wangran"
       * modified: 1647394426.255574
       * user_did: "did:elastos:iXB82Mii9LMEPn3U7cLECswLmex9KkZL8D"
       */
      const subscriptions = result.find_message.items;
      let parseResult = [];
      console.log('result', subscriptions);
      if (subscriptions) {
        subscriptions.forEach(subscription => {
          const subscriptionResult: FeedsData.SubscriptionV3 = {
            destDid: destDid,
            channelId: subscription.channel_id,

            userDid: subscription.user_did,
            createdAt: subscription.created_at,
            displayName: subscription.display_name,
          }
          parseResult.push(subscriptionResult);
        });
      }
      return parseResult;
    } catch (error) {
      Logger.error(TAG, 'Parse subscription result error', error);
    }
  }
  /** parse subscription result end */
}