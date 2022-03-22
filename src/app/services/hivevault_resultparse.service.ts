import { Injectable } from '@angular/core';
import { Logger } from './logger';
const TAG = 'HiveVaultResultParse';

@Injectable()
export class HiveVaultResultParse {
  /** parse post result start */
  public static parsePostResult(destDid: string, result: any): Promise<FeedsData.PostV3[]> {
    return new Promise(async (resolve, reject) => {
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
        const posts = result.find_message.items;
        let parseResult = [];
        console.log('result', posts);
        if (posts) {
          posts.forEach(post => {
            if (post) {
              const postResult: FeedsData.PostV3 = {
                destDid: destDid,
                postId: post.post_id,

                channelId: post.channel_id,
                createdAt: post.created_at,
                updatedAt: post.updated_at,
                content: post.content,
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
        resolve(parseResult);
      } catch (error) {
        Logger.error(TAG, 'Parse post result error', error);
        reject(error);
      }
    });
  }
  /** parse post result end */

  /** parse channel result start */
  public static parseChannelResult(destDid: string, result: any): Promise<FeedsData.ChannelV3[]> {
    return new Promise(async (resolve, reject) => {
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
        const channels = result.find_message.items;
        let parseResult = [];
        console.log('result', channels);
        if (channels) {
          channels.forEach(channel => {
            if (channel) {
              const channelResult: FeedsData.ChannelV3 = {
                destDid: destDid,
                channelId: channel.channel_id,

                createdAt: channel.created_at,
                updatedAt: channel.updated_at,
                name: channel.name,
                intro: channel,
                avatar: channel,
                type: channel,
                tipping_address: channel,
                nft: channel,
                category: channel,
                proof: '',
                memo: channel,
              }
              parseResult.push(channelResult);
            }
          });
        }
        resolve(parseResult);
      } catch (error) {
        Logger.error(TAG, 'Parse channel result error', error);
        reject(error);
      }
    });
  }
  /** parse channel result end */

  /** parse comment result start*/
  public static parseCommentResult(destDid: string, result: any) {
    return new Promise(async (resolve, reject) => {
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
        resolve(parseResult);
      } catch (error) {
        Logger.error(TAG, 'Parse comment result error', error);
        reject(error);
      }
    });
  }
  /** parse comment result end*/

  /** parse like result start */
  public static pareLikeResult(destDid: string, result: any) {
    return new Promise(async (resolve, reject) => {
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
        resolve(parseResult);
      } catch (error) {
        Logger.error(TAG, 'Parse like result error', error);
        reject(error);
      }
    });
  }
  /** parse like result end */

  /** parse subscription result start */
  public static parseSubscriptionResult(destDid: string, result: any) {
    return new Promise(async (resolve, reject) => {
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
        resolve(parseResult);
      } catch (error) {
        Logger.error(TAG, 'Parse subscription result error', error);
        reject(error);
      }
    });
  }
  /** parse subscription result end */
}
