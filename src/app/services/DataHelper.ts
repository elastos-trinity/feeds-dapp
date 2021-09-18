import { Injectable } from '@angular/core';
import { StorageService } from 'src/app/services/StorageService';

import * as _ from 'lodash';
import { UtilService } from './utilService';
import { Config } from './config';
import { SignInData } from './FeedService';
import { Events } from 'src/app/services/events.service';

let TAG: string = 'DataHelper';

@Injectable()
export class DataHelper {
  private channelsMap: { [nodeChannelId: string]: FeedsData.Channels } = {};
  private postMap: { [ncpId: string]: FeedsData.Post } = {};
  private commentsMap: {
    [nodeId: string]: FeedsData.NodeChannelPostComment;
  } = {};
  private serverMap: { [nodeId: string]: FeedsData.Server } = {};
  private accessTokenMap: { [nodeId: string]: FeedsData.AccessToken } = {};
  private likeMap: { [key: string]: FeedsData.Likes } = {};
  private likeCommentMap: {
    [nodechannelpostCommentId: string]: FeedsData.LikedComment;
  } = {};

  private lastSubscribedFeedsUpdateMap: {
    [nodeId: string]: FeedsData.FeedUpdateTime;
  } = {};
  private lastCommentUpdateMap: {
    [key: string]: FeedsData.CommentUpdateTime;
  } = {};
  private lastMultiLikesAndCommentsCountUpdateMap: {
    [key: string]: FeedsData.LikesAndCommentsCountUpdateTime;
  } = {};
  private lastMultiLikesAndCommentsCountUpdateMapCache: {
    [key: string]: FeedsData.LikesAndCommentsCountUpdateTime;
  } = {};
  private lastPostUpdateMap: {
    [nodeChannelId: string]: FeedsData.PostUpdateTime;
  } = {};

  private syncPostStatusMap: {
    [nodeChannelId: string]: FeedsData.SyncPostStatus;
  } = {};
  private syncCommentStatusMap: {
    [nodeChannelId: string]: FeedsData.SyncCommentStatus;
  } = {};

  private unreadMap: { [nodeChannelId: string]: number } = {};
  private serverStatisticsMap: {
    [nodeId: string]: FeedsData.ServerStatistics;
  } = {};

  private serversStatus: { [nodeId: string]: FeedsData.ServerStatus } = {};

  private bindingServer: FeedsData.Server = null;
  private bindingServerCache: FeedsData.Server = null;

  private notificationList: FeedsData.Notification[] = [];
  private cacheBindingAddress: string = '';
  private localCredential: string = '';
  private cachedPost: { [key: string]: FeedsData.Post } = {};

  private localSignInData = null; //TODO

  private developerMode = false;
  private hideDeletedPosts = false;
  private hideDeletedComments = false;
  private hideOfflineFeeds = false;
  private currentLang = '';

  private serverVersions: { [nodeId: string]: FeedsData.ServerVersion } = {};

  private curtab: string = 'home';
  private nonce = '';
  private realm = '';
  private serviceNonce = '';
  private serviceRealm = '';
  private profileIamge = 'assets/images/profile-1.svg';
  private clipProfileIamge = '';

  private carrierStatus = FeedsData.ConnState.disconnected;
  private networkStatus = FeedsData.ConnState.disconnected;
  private connectionStatus = FeedsData.ConnState.disconnected;
  private lastConnectionStatus = FeedsData.ConnState.disconnected;
  private isLogging: { [nodeId: string]: boolean } = {};
  private signinChallengeTimeout = null;
  private isSavingChannel = false;
  private isDeclearing = false;
  private declareOwnerTimeout = null;
  private declareOwnerInterval = null;
  private isDeclareFinish: boolean = false;

  private feedPublicStatus: any = {};
  private channelInfo: any = {};
  private cachedUpdateServer: { [nodeId: string]: FeedsData.Server } = {};
  private tempIdDataList: number[] = [];
  private tempDataMap: { [key: string]: FeedsData.TempData } = {};

  private walletAccountAddress: string = '';
  private developLogMode: boolean = false;
  private developNet: string = 'MainNet';

  private apiProvider: string = 'elastos.io';

  private newPostCount: number = 0;

  constructor(
    private storageService: StorageService,
    private events: Events
  ) {}

  ////subscribedChannelsMap
  getSubscribedFeedsList(): FeedsData.Channels[] {
    let list: FeedsData.Channels[] = [];
    let map = this.getChannelsMap();
    let keys: string[] = Object.keys(map) || [];
    for (let index = 0; index < keys.length; index++) {
      const feed = this.getChannel(keys[index]);
      if (feed == null || feed == undefined) continue;
      if (feed.isSubscribed) list.push(feed);
    }
    return list;
  }

  ////signin
  setSigninData(signinData: SignInData) {
    this.localSignInData = signinData;
  }

  getSigninData() {
    return this.loadData(FeedsData.PersistenceKey.signInData);
  }

  ////channelsMap
  setChannelsMap(channelsMap: { [nodeChannelId: string]: FeedsData.Channels }) {
    this.channelsMap = channelsMap;
    this.saveData(FeedsData.PersistenceKey.channelsMap, this.channelsMap);
  }

  loadChannelsMap(): Promise<{ [nodeChannelId: string]: FeedsData.Channels }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.channelsMap) == '{}') {
          this.channelsMap =
            (await this.loadData(FeedsData.PersistenceKey.channelsMap)) || {};
          resolve(this.channelsMap);
          return;
        }
        resolve(this.channelsMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  getChannelsMap(): { [nodeChannelId: string]: FeedsData.Channels } {
    return this.channelsMap || {};
  }

  getChannel(key: string): FeedsData.Channels {
    if (!this.channelsMap) {
      return null;
    }
    return this.channelsMap[key] || null;
  }

  updateChannel(key: string, channel: FeedsData.Channels) {
    this.channelsMap[key] = channel;
    this.saveData(FeedsData.PersistenceKey.channelsMap, this.channelsMap);
  }

  deleteChannel(key: string): Promise<any> {
    this.channelsMap[key] = null;
    delete this.channelsMap[key];
    return this.saveData(
      FeedsData.PersistenceKey.channelsMap,
      this.channelsMap,
    );
  }

  isExistChannel(key: string): boolean {
    if (this.channelsMap[key] == null || this.channelsMap[key] == undefined)
      return false;

    return true;
  }

  initChannelsMap() {
    this.channelsMap = {};
  }

  getChannelsList(): FeedsData.Channels[] {
    let list: FeedsData.Channels[] = [];
    let keys: string[] = Object.keys(this.channelsMap);
    for (let index in keys) {
      let item = this.getChannel(keys[index]);
      if (item == null || item == undefined) continue;
      list.push(item);
    }
    let sortArr = [];

    sortArr = _.sortBy(list, (item: any) => {
      return -Number(item.last_update);
    });
    return sortArr;
  }

  getChannelsListFromNodeId(nodeId: string): FeedsData.Channels[] {
    let list: FeedsData.Channels[] = [];
    let keys: string[] = Object.keys(this.channelsMap);
    for (const index in keys) {
      let feed = this.getChannel(keys[index]);
      if (feed == null) continue;

      if (feed.nodeId == nodeId) list.push(feed);
    }
    return list;
  }

  //// myChannelsMap
  getMyChannelList(nodeId: string) {
    return this.getChannelsListFromNodeId(nodeId);
  }

  //// postMap
  setPostMap(postMap: { [ncpId: string]: FeedsData.Post }) {
    this.postMap = postMap;
    this.saveData(FeedsData.PersistenceKey.postMap, this.postMap);
  }

  loadPostMap(): Promise<{ [ncpId: string]: FeedsData.Post }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.postMap) == '{}') {
          this.postMap =
            (await this.loadData(FeedsData.PersistenceKey.postMap)) || {};
          resolve(this.postMap);
          return;
        }
        resolve(this.postMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  deletePost(key: string) {
    if (this.postMap == null || this.postMap == undefined) return;
    this.postMap[key].post_status = FeedsData.PostCommentStatus.deleted;
    this.saveData(FeedsData.PersistenceKey.postMap, this.postMap);
  }

  deletePostDeeply(key: string) {
    if (this.postMap == null || this.postMap == undefined) return;
    this.postMap[key] = null;
    delete this.postMap[key];
    this.saveData(FeedsData.PersistenceKey.postMap, this.postMap);
  }

  updatePost(key: string, post: FeedsData.Post) {
    this.updatePostWithoutSave(key, post);
    this.saveData(FeedsData.PersistenceKey.postMap, this.postMap);
  }

  updatePostWithoutSave(key: string, post: FeedsData.Post) {
    if (this.postMap == null || this.postMap == undefined) this.postMap = {};
    this.postMap[key] = post;
  }

  getPost(key: string): FeedsData.Post {
    if (!this.postMap) return null;
    return this.postMap[key];
  }

  generatePost(
    nodeId: string,
    feedId: number,
    postId: number,
    content: any,
    comments: number,
    likes: number,
    createdAt: number,
    updatedAt: number,
    postStatus: FeedsData.PostCommentStatus,
  ) {
    let post: FeedsData.Post = {
      nodeId: nodeId,
      channel_id: feedId,
      id: postId,
      content: content,
      comments: comments,
      likes: likes,
      created_at: createdAt,
      updated_at: updatedAt,
      post_status: postStatus,
    };
    return post;
  }

  isExistPost(key: string): boolean {
    if (this.postMap[key] == null || this.postMap[key] == undefined)
      return false;
    return true;
  }

  getPostList(): FeedsData.Post[] {
    let list: FeedsData.Post[] = [];
    this.postMap = this.postMap || {};
    let keys: string[] = Object.keys(this.postMap) || [];
    for (let index in keys) {
      if (
        this.postMap[keys[index]] == null ||
        this.postMap[keys[index]] == undefined
      )
        continue;

      let nodeChannelId = this.getKey(
        this.postMap[keys[index]].nodeId,
        this.postMap[keys[index]].channel_id,
        0,
        0,
      );
      let feed = this.getChannel(nodeChannelId);
      if (feed == null || feed == undefined) continue;
      if (feed.isSubscribed) list.push(this.postMap[keys[index]]);
    }

    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  getPostListFromChannel(nodeId: string, channelId: number) {
    let list: FeedsData.Post[] = [];
    let keys: string[] = Object.keys(this.postMap);
    // localPostList = [];
    for (const index in keys) {
      if (
        this.postMap[keys[index]] == null ||
        this.postMap[keys[index]] == undefined
      )
        continue;

      if (
        this.postMap[keys[index]].nodeId == nodeId &&
        this.postMap[keys[index]].channel_id == channelId
      )
        list.push(this.postMap[keys[index]]);
    }

    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  initPostMap() {
    this.channelsMap = {};
  }
  //// commentsMap
  setCommentsMap(commentsMap: {
    [nodeId: string]: FeedsData.NodeChannelPostComment;
  }) {
    this.commentsMap = commentsMap;
    this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
  }

  loadCommentsMap(): Promise<{
    [nodeId: string]: FeedsData.NodeChannelPostComment;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.commentsMap) == '{}') {
          this.commentsMap =
            (await this.loadData(FeedsData.PersistenceKey.commentsMap)) || {};
          resolve(this.commentsMap);
          return;
        }
        resolve(this.commentsMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  getComment(
    nodeId: string,
    feedId: number,
    postId: number,
    commentId: number,
  ): FeedsData.Comment {
    if (
      this.commentsMap == null ||
      this.commentsMap == undefined ||
      this.commentsMap[nodeId] == null ||
      this.commentsMap[nodeId] == undefined ||
      this.commentsMap[nodeId][feedId] == null ||
      this.commentsMap[nodeId][feedId] == undefined ||
      this.commentsMap[nodeId][feedId][postId] == null ||
      this.commentsMap[nodeId][feedId][postId] == undefined ||
      this.commentsMap[nodeId][feedId][postId][commentId] == null ||
      this.commentsMap[nodeId][feedId][postId][commentId] == undefined
    ) {
      return null;
    }
    return this.commentsMap[nodeId][feedId][postId][commentId];
  }

  updateComment(
    nodeId: string,
    feedId: number,
    postId: number,
    commentId: number,
    comment: FeedsData.Comment,
  ) {
    if (this.commentsMap == null || this.commentsMap == undefined)
      this.commentsMap = {};
    if (
      this.commentsMap[nodeId] == null ||
      this.commentsMap[nodeId] == undefined
    )
      this.commentsMap[nodeId] = {};
    if (
      this.commentsMap[nodeId][feedId] == null ||
      this.commentsMap[nodeId][feedId] == undefined
    )
      this.commentsMap[nodeId][feedId] = {};
    if (
      this.commentsMap[nodeId][feedId][postId] == null ||
      this.commentsMap[nodeId][feedId][postId] == undefined
    )
      this.commentsMap[nodeId][feedId][postId] = {};
    this.commentsMap[nodeId][feedId][postId][commentId] = comment;
    this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
  }

  deleteComment(
    nodeId: string,
    feedId: number,
    postId: number,
    commentId: number,
  ) {
    if (this.commentsMap == null || this.commentsMap == undefined)
      this.commentsMap = {};
    if (
      this.commentsMap[nodeId] == null ||
      this.commentsMap[nodeId] == undefined
    )
      this.commentsMap[nodeId] = {};
    if (
      this.commentsMap[nodeId][feedId] == null ||
      this.commentsMap[nodeId][feedId] == undefined
    )
      this.commentsMap[nodeId][feedId] = {};
    if (
      this.commentsMap[nodeId][feedId][postId] == null ||
      this.commentsMap[nodeId][feedId][postId] == undefined
    )
      this.commentsMap[nodeId][feedId][postId] = {};
    this.commentsMap[nodeId][feedId][postId][commentId] = null;
    delete this.commentsMap[nodeId][feedId][postId][commentId];
    this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
  }

  deleteCommentFromPost(nodeId: string, feedId: number, postId: number) {
    if (this.commentsMap == null || this.commentsMap == undefined)
      this.commentsMap = {};
    if (
      this.commentsMap[nodeId] == null ||
      this.commentsMap[nodeId] == undefined
    )
      this.commentsMap[nodeId] = {};
    if (
      this.commentsMap[nodeId][feedId] == null ||
      this.commentsMap[nodeId][feedId] == undefined
    )
      this.commentsMap[nodeId][feedId] = {};
    this.commentsMap[nodeId][feedId][postId] = null;
    delete this.commentsMap[nodeId][feedId][postId];
    this.saveData(FeedsData.PersistenceKey.commentsMap, this.commentsMap);
  }

  getCommentList(
    nodeId: string,
    channelId: number,
    postId: number,
  ): FeedsData.Comment[] {
    if (
      this.commentsMap == null ||
      this.commentsMap == undefined ||
      this.commentsMap[nodeId] == null ||
      this.commentsMap == undefined ||
      this.commentsMap[nodeId][channelId] == null ||
      this.commentsMap[nodeId][channelId] == undefined ||
      this.commentsMap[nodeId][channelId][postId] == null ||
      this.commentsMap[nodeId][channelId][postId] == undefined
    ) {
      return [];
    }

    let list: FeedsData.Comment[] = [];
    let keys: string[] = Object.keys(
      this.commentsMap[nodeId][channelId][postId],
    );
    for (const index in keys) {
      let comment: FeedsData.Comment = this.commentsMap[nodeId][channelId][
        postId
      ][keys[index]];
      if (comment == undefined) continue;

      list.push(comment);
    }

    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  getCaptainCommentList(
    nodeId: string,
    feedId: number,
    postId: number,
  ): FeedsData.Comment[] {
    return this.getSpecifiedCommentList(nodeId, feedId, postId, 0);
  }

  getReplayCommentList(
    nodeId: string,
    feedId: number,
    postId: number,
    commentId: number,
  ): FeedsData.Comment[] {
    return this.getSpecifiedCommentList(nodeId, feedId, postId, commentId);
  }

  getSpecifiedCommentList(
    nodeId: string,
    feedId: number,
    postId: number,
    commentId: number,
  ): FeedsData.Comment[] {
    let list: FeedsData.Comment[] = [];
    let commentList = this.getCommentList(nodeId, feedId, postId);
    for (let index = 0; index < commentList.length; index++) {
      const comment = commentList[index];
      if (comment.comment_id == commentId) list.push(comment);
    }
    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  initCommentsMap() {
    this.commentsMap = {};
  }
  ////serverMap
  setServerMap(serverMap: { [nodeId: string]: FeedsData.Server }) {
    this.serverMap = serverMap;
    this.saveData(FeedsData.PersistenceKey.serverMap, this.serverMap);
  }

  loadServerMap(): Promise<{ [nodeId: string]: FeedsData.Server }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.serverMap) == '{}') {
          this.serverMap =
            (await this.loadData(FeedsData.PersistenceKey.serverMap)) || {};
          resolve(this.serverMap);
          return;
        }
        resolve(this.serverMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  getServerList(): FeedsData.Server[] {
    if (this.serverMap == null || this.serverMap == undefined)
      this.serverMap = {};
    let list: FeedsData.Server[] = [];
    let nodeIdArray: string[] = Object.keys(this.serverMap) || [];
    for (const index in nodeIdArray) {
      let server = this.serverMap[nodeIdArray[index]];
      if (server == null || server == undefined) continue;

      list.push(this.serverMap[nodeIdArray[index]]);
    }
    return list;
  }

  isContainsServer(nodeId: string): boolean {
    let server = this.getServer(nodeId);
    if (server == null || server == undefined) return false;
    return true;
  }

  getOtherServerList(): FeedsData.Server[] {
    if (this.serverMap == null || this.serverMap == undefined)
      this.serverMap = {};
    let list: FeedsData.Server[] = [];
    let nodeIdArray: string[] = Object.keys(this.serverMap);
    for (const index in nodeIdArray) {
      if (this.serverMap[nodeIdArray[index]] == undefined) continue;
      if (this.isBindingServer(this.serverMap[nodeIdArray[index]].nodeId))
        continue;
      list.push(this.serverMap[nodeIdArray[index]]);
    }
    return list;
  }

  updateServer(nodeId: string, server: FeedsData.Server) {
    this.updateServerWithoutSave(nodeId, server);
    this.saveData(FeedsData.PersistenceKey.serverMap, this.serverMap);
  }

  updateServerWithoutSave(nodeId: string, server: FeedsData.Server) {
    if (this.serverMap == null || this.serverMap == undefined)
      this.serverMap = {};
    this.serverMap[nodeId] = server;
  }

  getServer(nodeId: string): FeedsData.Server {
    if (this.serverMap == null || this.serverMap == undefined)
      this.serverMap = {};
    return this.serverMap[nodeId];
  }

  generateServer(
    name: string,
    owner: string,
    introduction: string,
    did: string,
    carrierAddress: string,
    nodeId: string,
    feedsUrl: string,
    elaAddress: string,
  ): FeedsData.Server {
    return {
      name: name,
      owner: owner,
      introduction: introduction,
      did: did,
      carrierAddress: carrierAddress,
      nodeId: nodeId,
      feedsUrl: feedsUrl,
      elaAddress: elaAddress,
    };
  }

  deleteServer(nodeId: string) {
    this.serverMap[nodeId] = null;
    delete this.serverMap[nodeId];
    this.saveData(FeedsData.PersistenceKey.serverMap, this.serverMap);
  }

  initServerMap() {
    this.serverMap = {};
  }
  ////accessTokenMap
  setAccessTokenMap(accessTokenMap: {
    [nodeId: string]: FeedsData.AccessToken;
  }) {
    this.accessTokenMap = accessTokenMap;
    this.saveData(FeedsData.PersistenceKey.accessTokenMap, this.accessTokenMap);
  }

  loadAccessTokenMap(): Promise<{ [nodeId: string]: FeedsData.AccessToken }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.accessTokenMap) == '{}') {
          this.accessTokenMap =
            (await this.loadData(FeedsData.PersistenceKey.accessTokenMap)) ||
            {};
          resolve(this.accessTokenMap);
          return;
        }
        resolve(this.accessTokenMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  getAccessToken(nodeId: string): FeedsData.AccessToken {
    if (this.accessTokenMap == null || this.accessTokenMap == undefined)
      this.accessTokenMap = {};
    return this.accessTokenMap[nodeId];
  }

  generateAccessToken(token: string, isExpire: boolean): FeedsData.AccessToken {
    return {
      token: token,
      isExpire: isExpire,
    };
  }

  updateAccessToken(nodeId: string, accessToken: FeedsData.AccessToken) {
    if (this.accessTokenMap == null || this.accessTokenMap == undefined)
      this.accessTokenMap = {};
    this.accessTokenMap[nodeId] = accessToken;
    this.saveData(FeedsData.PersistenceKey.accessTokenMap, this.accessTokenMap);
  }

  deleteAccessToken(nodeId) {
    if (this.accessTokenMap == null || this.accessTokenMap == undefined)
      this.accessTokenMap = {};
    this.accessTokenMap[nodeId] = null;
    delete this.accessTokenMap[nodeId];
    this.saveData(FeedsData.PersistenceKey.accessTokenMap, this.accessTokenMap);
  }

  initAccessTokenMap() {
    this.accessTokenMap = {};
  }

  ////likeMap
  setLikeMap(likeMap: { [key: string]: FeedsData.Likes }) {
    this.likeMap = likeMap;
    this.saveData(FeedsData.PersistenceKey.likeMap, this.likeMap);
  }

  loadLikeMap(): Promise<{ [key: string]: FeedsData.Likes }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.likeMap) == '{}') {
          this.likeMap =
            (await this.loadData(FeedsData.PersistenceKey.likeMap)) || {};
          resolve(this.likeMap);
          return;
        }
        resolve(this.likeMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateLikes(
    nodeId: string,
    feedId: number,
    postId: number,
    commentId: number,
  ): FeedsData.Likes {
    return {
      nodeId: nodeId,
      channelId: feedId,
      postId: postId,
      commentId: commentId,
    };
  }

  getLikes(key: string): FeedsData.Likes {
    if (
      this.likeMap == null ||
      this.likeMap == undefined ||
      this.likeMap[key] == null ||
      this.likeMap[key] == undefined
    )
      return null;
    return this.likeMap[key];
  }

  updateLikes(key: string, likes: FeedsData.Likes) {
    this.updateLikesWithoutSave(key, likes);
    this.saveData(FeedsData.PersistenceKey.likeMap, this.likeMap);
  }

  updateLikesWithoutSave(key: string, likes: FeedsData.Likes) {
    if (this.likeMap == null || this.likeMap == undefined) this.likeMap = {};
    this.likeMap[key] = likes;
  }

  deleteLikes(key: string) {
    this.likeMap[key] = null;
    delete this.likeMap[key];
    this.saveData(FeedsData.PersistenceKey.likeMap, this.likeMap);
  }

  getLikedPostList(): FeedsData.Post[] {
    let list: FeedsData.Post[] = [];

    let keys: string[] = [];
    if (this.likeMap != null && this.likeMap != undefined)
      keys = Object.keys(this.likeMap);

    for (const index in keys) {
      let like = this.likeMap[keys[index]];
      if (like == null || like == undefined) continue;
      let key = this.getKey(like.nodeId, like.channelId, like.postId, 0);
      let post = this.getPost(key);
      if (post == undefined) continue;
      list.push(post);
    }

    list.sort((a, b) => Number(b.created_at) - Number(a.created_at));
    return list;
  }

  initLikeMap() {
    this.likeMap = {};
  }
  ////likeCommentMap
  setLikeCommentMap(likeCommentMap: {
    [nodechannelpostCommentId: string]: FeedsData.LikedComment;
  }) {
    this.likeCommentMap = likeCommentMap;
    this.saveData(FeedsData.PersistenceKey.likeCommentMap, this.likeCommentMap);
  }

  loadLikeCommentMap(): Promise<{
    [nodechannelpostCommentId: string]: FeedsData.LikedComment;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.likeCommentMap) == '{}') {
          this.likeCommentMap =
            (await this.loadData(FeedsData.PersistenceKey.likeCommentMap)) ||
            {};
          resolve(this.likeCommentMap);
          return;
        }
        resolve(this.likeCommentMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generatedLikedComment(
    nodeId: string,
    feedId: number,
    postId: number,
    commentId: number,
  ): FeedsData.LikedComment {
    return {
      nodeId: nodeId,
      channel_id: feedId,
      post_id: postId,
      id: commentId,
    };
  }

  getLikedComment(key: string): FeedsData.LikedComment {
    if (this.likeCommentMap == null || this.likeCommentMap == undefined)
      return null;
    return this.likeCommentMap[key];
  }

  updateLikedComment(key: string, likedComment: FeedsData.LikedComment) {
    if (this.likeCommentMap == null || this.likeCommentMap == undefined)
      this.likeCommentMap = {};
    this.likeCommentMap[key] = likedComment;
    this.saveData(FeedsData.PersistenceKey.likeCommentMap, this.likeCommentMap);
  }

  deleteLikedComment(key: string) {
    if (this.likeCommentMap == null || this.likeCommentMap == undefined)
      this.likeCommentMap = {};
    this.likeCommentMap[key] = null;
    delete this.likeCommentMap[key];
    this.saveData(FeedsData.PersistenceKey.likeCommentMap, this.likeCommentMap);
  }

  getCommentFromLikedComment() {}

  initLikedCommentMap() {
    this.likeCommentMap = {};
  }

  ////lastSubscribedFeedsUpdateMap
  setLastSubscribedFeedsUpdateMap(lastSubscribedFeedsUpdateMap: {
    [nodeId: string]: FeedsData.FeedUpdateTime;
  }) {
    this.lastSubscribedFeedsUpdateMap = lastSubscribedFeedsUpdateMap;
    this.saveData(
      FeedsData.PersistenceKey.lastSubscribedFeedsUpdateMap,
      this.lastSubscribedFeedsUpdateMap,
    );
  }

  loadLastSubscribedFeedsUpdateMap(): Promise<{
    [nodeId: string]: FeedsData.FeedUpdateTime;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.lastSubscribedFeedsUpdateMap) == '{}') {
          this.lastSubscribedFeedsUpdateMap =
            (await this.loadData(
              FeedsData.PersistenceKey.lastSubscribedFeedsUpdateMap,
            )) || {};
          resolve(this.lastSubscribedFeedsUpdateMap);
          return;
        }
        resolve(this.lastSubscribedFeedsUpdateMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateLastSubscribedFeedsUpdate(
    nodeId: string,
    updateTime: number,
  ): FeedsData.FeedUpdateTime {
    return {
      nodeId: nodeId,
      time: updateTime,
    };
  }

  getLastSubscribedFeedsUpdate(nodeId: string): FeedsData.FeedUpdateTime {
    if (
      this.lastSubscribedFeedsUpdateMap == null ||
      this.lastSubscribedFeedsUpdateMap == undefined
    )
      this.lastSubscribedFeedsUpdateMap = {};
    return this.lastSubscribedFeedsUpdateMap[nodeId];
  }

  getLastSubscribedFeedsUpdateTime(nodeId: string): number {
    let lastSubscribedFeedUpdate: FeedsData.FeedUpdateTime =
      this.getLastSubscribedFeedsUpdate(nodeId) || null;
    if (
      lastSubscribedFeedUpdate == null ||
      lastSubscribedFeedUpdate == undefined
    )
      return 0;
    return lastSubscribedFeedUpdate.time || 0;
  }

  updateLastSubscribedFeedsUpdate(
    nodeId: string,
    lastUpdate: FeedsData.FeedUpdateTime,
  ) {
    if (
      this.lastSubscribedFeedsUpdateMap == null ||
      this.lastSubscribedFeedsUpdateMap == undefined
    )
      this.lastSubscribedFeedsUpdateMap = {};
    this.lastSubscribedFeedsUpdateMap[nodeId] = lastUpdate;
    this.saveData(
      FeedsData.PersistenceKey.lastSubscribedFeedsUpdateMap,
      this.lastSubscribedFeedsUpdateMap,
    );
  }

  deleteLastSubscribedFeedsUpdate(nodeId: string) {
    if (
      this.lastSubscribedFeedsUpdateMap == null ||
      this.lastSubscribedFeedsUpdateMap == undefined
    )
      this.lastSubscribedFeedsUpdateMap = {};
    this.lastSubscribedFeedsUpdateMap[nodeId] = null;
    delete this.lastSubscribedFeedsUpdateMap[nodeId];
    this.saveData(
      FeedsData.PersistenceKey.lastSubscribedFeedsUpdateMap,
      this.lastSubscribedFeedsUpdateMap,
    );
  }

  initLastSubscribedFeedsUpdateMap() {
    this.lastSubscribedFeedsUpdateMap = {};
  }

  ////lastCommentUpdateMap
  setLastCommentUpdateMap(lastCommentUpdateMap: {
    [key: string]: FeedsData.CommentUpdateTime;
  }) {
    this.lastCommentUpdateMap = lastCommentUpdateMap;
    this.saveData(
      FeedsData.PersistenceKey.lastCommentUpdateMap,
      this.lastCommentUpdateMap,
    );
  }

  loadLastCommentUpdateMap(): Promise<{
    [key: string]: FeedsData.CommentUpdateTime;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.lastCommentUpdateMap) == '{}') {
          this.lastCommentUpdateMap =
            (await this.loadData(
              FeedsData.PersistenceKey.lastCommentUpdateMap,
            )) || {};
          resolve(this.lastCommentUpdateMap);
          return;
        }
        resolve(this.lastCommentUpdateMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateLastCommentUpdate(
    nodeId: string,
    feedId: number,
    postId: number,
    updateTime: number,
  ): FeedsData.CommentUpdateTime {
    return {
      nodeId: nodeId,
      channelId: feedId,
      postId: postId,
      time: updateTime,
    };
  }

  getLastCommentUpdate(key: string): FeedsData.CommentUpdateTime {
    if (
      this.lastCommentUpdateMap == null ||
      this.lastCommentUpdateMap == undefined
    )
      this.lastCommentUpdateMap = {};
    return this.lastCommentUpdateMap[key];
  }

  getLastCommentUpdateTime(key: string): number {
    let lastCommentUpdate: FeedsData.CommentUpdateTime =
      this.getLastCommentUpdate(key) || null;
    if (lastCommentUpdate == null || lastCommentUpdate == undefined) return 0;
    return lastCommentUpdate.time || 0;
  }

  updateLastComment(
    key: string,
    lastCommentUpdate: FeedsData.CommentUpdateTime,
  ) {
    if (
      this.lastCommentUpdateMap == null ||
      this.lastCommentUpdateMap == undefined
    )
      this.lastCommentUpdateMap = {};
    this.lastCommentUpdateMap[key] = lastCommentUpdate;
    this.saveData(
      FeedsData.PersistenceKey.lastCommentUpdateMap,
      this.lastCommentUpdateMap,
    );
  }

  deleteLastComment(key: string) {
    if (
      this.lastCommentUpdateMap == null ||
      this.lastCommentUpdateMap == undefined
    )
      this.lastCommentUpdateMap = {};
    this.lastCommentUpdateMap[key] = null;
    delete this.lastCommentUpdateMap[key];
    this.saveData(
      FeedsData.PersistenceKey.lastCommentUpdateMap,
      this.lastCommentUpdateMap,
    );
  }

  initLastCommentUpdateMap() {
    this.lastCommentUpdateMap = {};
  }

  ////lastMultiLikesAndCommentsCountUpdateMap
  setLastMultiLikesAndCommentsCountUpdateMap(lastMultiLikesAndCommentsCountUpdateMap: {
    [key: string]: FeedsData.LikesAndCommentsCountUpdateTime;
  }) {
    this.lastMultiLikesAndCommentsCountUpdateMap = lastMultiLikesAndCommentsCountUpdateMap;
    this.saveData(
      FeedsData.PersistenceKey.lastMultiLikesAndCommentsCountUpdateMap,
      this.lastMultiLikesAndCommentsCountUpdateMap,
    );
  }

  loadLastMultiLikesAndCommentsCountUpdateMap(): Promise<{
    [key: string]: FeedsData.LikesAndCommentsCountUpdateTime;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (
          JSON.stringify(this.lastMultiLikesAndCommentsCountUpdateMap) == '{}'
        ) {
          this.lastMultiLikesAndCommentsCountUpdateMap =
            (await this.loadData(
              FeedsData.PersistenceKey.lastMultiLikesAndCommentsCountUpdateMap,
            )) || {};
          resolve(this.lastMultiLikesAndCommentsCountUpdateMap);
          return;
        }
        resolve(this.lastMultiLikesAndCommentsCountUpdateMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  getLastMultiLikesAndCommentsCountUpdate(
    nodeId: string,
  ): FeedsData.LikesAndCommentsCountUpdateTime {
    if (
      this.lastMultiLikesAndCommentsCountUpdateMap == null ||
      this.lastMultiLikesAndCommentsCountUpdateMap == undefined
    )
      this.lastMultiLikesAndCommentsCountUpdateMap = {};
    return this.lastMultiLikesAndCommentsCountUpdateMap[nodeId];
  }

  getLastMultiLikesAndCommentsCountUpdateTime(nodeId: string): number {
    let lastUpdate: FeedsData.LikesAndCommentsCountUpdateTime =
      this.getLastMultiLikesAndCommentsCountUpdate(nodeId) || null;
    if (lastUpdate == null || lastUpdate == undefined) return 0;
    return lastUpdate.time || 0;
  }

  updateLastMultiLikesAndCommentsCountUpdate(
    nodeId: string,
    lastUpdate: FeedsData.LikesAndCommentsCountUpdateTime,
  ) {
    if (
      this.lastMultiLikesAndCommentsCountUpdateMap == null ||
      this.lastMultiLikesAndCommentsCountUpdateMap == undefined
    )
      this.lastMultiLikesAndCommentsCountUpdateMap = {};
    this.lastMultiLikesAndCommentsCountUpdateMap[nodeId] = lastUpdate;
    this.saveData(
      FeedsData.PersistenceKey.lastMultiLikesAndCommentsCountUpdateMap,
      this.lastMultiLikesAndCommentsCountUpdateMap,
    );
  }

  deleteLastMultiLikesAndCommentsCountUpdateMap(nodeId: string) {
    if (
      this.lastMultiLikesAndCommentsCountUpdateMap == null ||
      this.lastMultiLikesAndCommentsCountUpdateMap == undefined
    )
      this.lastMultiLikesAndCommentsCountUpdateMap = {};
    this.lastMultiLikesAndCommentsCountUpdateMap[nodeId] = null;
    delete this.lastMultiLikesAndCommentsCountUpdateMap[nodeId];
    this.saveData(
      FeedsData.PersistenceKey.lastMultiLikesAndCommentsCountUpdateMap,
      this.lastMultiLikesAndCommentsCountUpdateMap,
    );
  }

  initLastMultiLikesAndCommentsCountUpdateMap() {
    this.lastMultiLikesAndCommentsCountUpdateMap = {};
  }

  ////lastMultiLikesAndCommentsCountUpdateMapCache
  setLastMultiLikesAndCommentsCountUpdateMapCache(lastMultiLikesAndCommentsCountUpdateMapCache: {
    [key: string]: FeedsData.LikesAndCommentsCountUpdateTime;
  }) {
    this.lastMultiLikesAndCommentsCountUpdateMapCache = lastMultiLikesAndCommentsCountUpdateMapCache;
  }

  getLastMultiLikesAndCommentsCountUpdateMapCache(): {
    [key: string]: FeedsData.LikesAndCommentsCountUpdateTime;
  } {
    return this.lastMultiLikesAndCommentsCountUpdateMapCache;
  }

  ////lastPostUpdateMap
  setLastPostUpdateMap(lastPostUpdateMap: {
    [nodeChannelId: string]: FeedsData.PostUpdateTime;
  }) {
    this.lastPostUpdateMap = lastPostUpdateMap;
    this.saveData(
      FeedsData.PersistenceKey.lastPostUpdateMap,
      this.lastPostUpdateMap,
    );
  }

  loadLastPostUpdateMap(): Promise<{
    [nodeChannelId: string]: FeedsData.PostUpdateTime;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.lastPostUpdateMap) == '{}') {
          this.lastPostUpdateMap =
            (await this.loadData(FeedsData.PersistenceKey.lastPostUpdateMap)) ||
            {};
          resolve(this.lastPostUpdateMap);
          return;
        }
        resolve(this.lastPostUpdateMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateLastPostUpdate(
    nodeId: string,
    feedId: number,
    updateTime: number,
  ): FeedsData.PostUpdateTime {
    return {
      nodeId: nodeId,
      channelId: feedId,
      time: updateTime,
    };
  }

  getLastPostUpdate(key: string): FeedsData.PostUpdateTime {
    if (this.lastPostUpdateMap == null || this.lastPostUpdateMap == undefined)
      this.lastPostUpdateMap = {};
    return this.lastPostUpdateMap[key];
  }

  getLastPostUpdateTime(key: string): number {
    let lastPostUpdate: FeedsData.PostUpdateTime =
      this.getLastPostUpdate(key) || null;
    if (lastPostUpdate == null || lastPostUpdate == undefined) return 0;
    return lastPostUpdate.time || 0;
  }

  updateLastPostUpdate(key: string, lastPostUpdate: FeedsData.PostUpdateTime) {
    if (this.lastPostUpdateMap == null || this.lastPostUpdateMap == undefined)
      this.lastPostUpdateMap = {};

    this.lastPostUpdateMap[key] = lastPostUpdate;
    this.saveData(
      FeedsData.PersistenceKey.lastPostUpdateMap,
      this.lastPostUpdateMap,
    );
  }

  deleteLastPostUpdate(key: string) {
    if (this.lastPostUpdateMap == null || this.lastPostUpdateMap == undefined)
      this.lastPostUpdateMap = {};
    this.lastPostUpdateMap[key] = null;
    delete this.lastPostUpdateMap[key];
    this.saveData(
      FeedsData.PersistenceKey.lastPostUpdateMap,
      this.lastPostUpdateMap,
    );
  }

  initLastPostUpdateMap() {
    this.lastPostUpdateMap = {};
  }

  ////unreadMap
  setUnreadMap(unreadMap: { [nodeChannelId: string]: number }) {
    this.unreadMap = unreadMap;
    this.saveData(FeedsData.PersistenceKey.unreadMap, this.unreadMap);
  }

  loadUnreadMap(): Promise<{ [nodeChannelId: string]: number }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.unreadMap) == '{}') {
          this.unreadMap =
            (await this.loadData(FeedsData.PersistenceKey.unreadMap)) || {};
          resolve(this.unreadMap);
          return;
        }
        resolve(this.unreadMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  getUnreadNumber(nodeChannelId: string): number {
    if (this.unreadMap == null || this.unreadMap == undefined)
      this.unreadMap = {};
    if (
      this.unreadMap[nodeChannelId] == null ||
      this.unreadMap[nodeChannelId] == undefined
    )
      return 0;
    return this.unreadMap[nodeChannelId];
  }

  readMsg(nodeChannelId: string) {
    if (this.unreadMap == null || this.unreadMap == undefined)
      this.unreadMap = {};
    this.unreadMap[nodeChannelId] = 0;
    this.saveData(FeedsData.PersistenceKey.unreadMap, this.unreadMap);
  }

  receivedUnread(nodeChannelId: string) {
    if (this.unreadMap == null || this.unreadMap == undefined)
      this.unreadMap = {};
    this.unreadMap[nodeChannelId] = this.unreadMap[nodeChannelId] + 1;
    this.saveData(FeedsData.PersistenceKey.unreadMap, this.unreadMap);
  }

  deleteUnread(nodeChannelId: string) {
    this.unreadMap[nodeChannelId] = 0;
    delete this.unreadMap[nodeChannelId];
    this.saveData(FeedsData.PersistenceKey.unreadMap, this.unreadMap);
  }

  initUnreadMap() {
    this.unreadMap = {};
  }

  ////serverStatisticsMap
  setServerStatisticsMap(serverStatisticsMap: {
    [nodeId: string]: FeedsData.ServerStatistics;
  }) {
    this.serverStatisticsMap = serverStatisticsMap;
    this.saveData(
      FeedsData.PersistenceKey.serverStatisticsMap,
      this.serverStatisticsMap,
    );
  }

  loadServerStatisticsMap(): Promise<{
    [nodeId: string]: FeedsData.ServerStatistics;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.serverStatisticsMap) == '{}') {
          this.serverStatisticsMap =
            (await this.loadData(
              FeedsData.PersistenceKey.serverStatisticsMap,
            )) || {};
          resolve(this.serverStatisticsMap);
          return;
        }
        resolve(this.serverStatisticsMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateServerStatistics(
    did: string,
    connectingClients: number,
    totalClients: number,
  ): FeedsData.ServerStatistics {
    return {
      did: did,
      connecting_clients: connectingClients,
      total_clients: totalClients,
    };
  }

  generateEmptyStatistics(did: string) {
    return this.generateServerStatistics(did, 0, 0);
  }

  getServerStatisticsNumber(nodeId: string): number {
    if (
      this.serverStatisticsMap == null ||
      this.serverStatisticsMap == undefined
    )
      this.serverStatisticsMap = {};
    if (
      this.serverStatisticsMap[nodeId] == null ||
      this.serverStatisticsMap[nodeId] == undefined
    )
      return 0;
    return this.serverStatisticsMap[nodeId].total_clients || 0;
  }

  updateServerStatistics(
    nodeId: string,
    serverStatistics: FeedsData.ServerStatistics,
  ) {
    if (
      this.serverStatisticsMap == null ||
      this.serverStatisticsMap == undefined
    )
      this.serverStatisticsMap = {};
    this.serverStatisticsMap[nodeId] = serverStatistics;
    this.saveData(
      FeedsData.PersistenceKey.serverStatisticsMap,
      this.serverStatisticsMap,
    );
  }

  deleteServerStatistics(nodeId: string) {
    if (
      this.serverStatisticsMap == null ||
      this.serverStatisticsMap == undefined
    )
      this.serverStatisticsMap = {};
    this.serverStatisticsMap[nodeId] = null;
    delete this.serverStatisticsMap[nodeId];
    this.saveData(
      FeedsData.PersistenceKey.serverStatisticsMap,
      this.serverStatisticsMap,
    );
  }

  initServerStatisticMap() {
    this.serverStatisticsMap = {};
  }

  ////serversStatus
  setServersStatus(serversStatus: {
    [nodeId: string]: FeedsData.ServerStatus;
  }) {
    this.serversStatus = serversStatus;
    this.saveData(FeedsData.PersistenceKey.serversStatus, this.serversStatus);
  }

  loadServersStatus(): Promise<{ [nodeId: string]: FeedsData.ServerStatus }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.serversStatus) == '{}') {
          this.serversStatus =
            (await this.loadData(FeedsData.PersistenceKey.serversStatus)) || {};
          let keys: string[] = Object.keys(this.serversStatus);
          for (const index in keys) {
            if (this.serversStatus[keys[index]] == undefined) continue;
            this.serversStatus[keys[index]].status =
              FeedsData.ConnState.disconnected;
          }

          resolve(this.serversStatus);
          return;
        }
        resolve(this.serversStatus);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateServerStatus(
    nodeId: string,
    did: string,
    status: FeedsData.ConnState,
  ) {
    return {
      nodeId: nodeId,
      did: did,
      status: status,
    };
  }

  getServerStatusStatus(nodeId: string): FeedsData.ConnState {
    if (
      this.getConnectionStatus() == FeedsData.ConnState.disconnected ||
      this.serversStatus[nodeId] == null ||
      this.serversStatus[nodeId] == undefined
    )
      return 1;

    return this.serversStatus[nodeId].status;
  }

  getServerStatus(nodeId: string) {
    if (this.serversStatus == null || this.serversStatus == undefined)
      this.serversStatus = {};
    if (
      this.serversStatus[nodeId] == null ||
      this.serversStatus[nodeId] == undefined
    ) {
      let serverStatus = this.generateServerStatus(
        nodeId,
        '',
        FeedsData.ConnState.disconnected,
      );
      this.serversStatus[nodeId] = serverStatus;
    }
    return this.serversStatus[nodeId];
  }

  updateServerStatus(nodeId: string, serverStatus: FeedsData.ServerStatus) {
    if (this.serversStatus == null || this.serversStatus == undefined)
      this.serversStatus = {};
    if (
      this.serversStatus[nodeId] == null ||
      this.serversStatus[nodeId] == undefined
    ) {
      let serverStatus = this.generateServerStatus(
        nodeId,
        '',
        FeedsData.ConnState.disconnected,
      );
      this.serversStatus[nodeId] = serverStatus;
    }
    this.serversStatus[nodeId] = serverStatus;
    this.saveData(FeedsData.PersistenceKey.serversStatus, this.serversStatus);
  }

  deleteServerStatus(nodeId: string) {
    this.serversStatus[nodeId] = null;
    delete this.serversStatus[nodeId];
    this.saveData(FeedsData.PersistenceKey.serversStatus, this.serversStatus);
  }

  resetServerConnectionStatus() {
    let serverConnectionMap = this.serversStatus || {};
    let keys: string[] = Object.keys(serverConnectionMap) || [];
    for (let index = 0; index < keys.length; index++) {
      let serverStatus = this.serversStatus[keys[index]];
      if (serverStatus == null || serverStatus == undefined) continue;
      serverStatus.status = FeedsData.ConnState.disconnected;
      this.updateServerStatus(serverStatus.nodeId, serverStatus);
    }
  }

  initServersConnectionStatus() {
    this.serversStatus = {};
  }

  ////bindingServer
  setBindingServer(bindingServer: FeedsData.Server) {
    this.bindingServer = bindingServer;
    this.saveData(FeedsData.PersistenceKey.bindingServer, this.bindingServer);
  }

  loadBindingServer(): Promise<FeedsData.Server> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.bindingServer == null) {
          this.bindingServer =
            (await this.loadData(FeedsData.PersistenceKey.bindingServer)) ||
            null;
          resolve(this.bindingServer);
          return;
        }
        resolve(this.bindingServer);
      } catch (error) {
        reject(error);
      }
    });
  }

  getBindingServer(): FeedsData.Server {
    return this.bindingServer;
  }

  updateBindingServer(server: FeedsData.Server) {
    this.bindingServer = server;
    this.saveData(FeedsData.PersistenceKey.bindingServer, this.bindingServer);
  }

  deleteBindingServer() {
    this.bindingServer = null;
    this.saveData(FeedsData.PersistenceKey.bindingServer, this.bindingServer);
  }

  isBindingServer(nodeId: string): boolean {
    if (this.bindingServer == null || this.bindingServer == undefined)
      return false;
    if (this.bindingServer.nodeId != nodeId) return false;
    return true;
  }

  initBindingServer() {
    this.bindingServer = null;
  }

  ////bindingServerCache
  setBindingServerCache(bindingServerCache: FeedsData.Server) {
    this.bindingServerCache = bindingServerCache;
  }

  getBindingServerCache(): FeedsData.Server {
    return this.bindingServerCache;
  }

  ////notificationList
  setnotificationList(notificationList: FeedsData.Notification[]) {
    this.notificationList = notificationList;
    this.saveData(
      FeedsData.PersistenceKey.notificationList,
      this.notificationList,
    );
  }

  loadNotificationList() {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.notificationList.length == 0) {
          this.notificationList =
            (await this.loadData(FeedsData.PersistenceKey.notificationList)) ||
            [];
          resolve(this.notificationList);
          return;
        }
        resolve(this.notificationList);
      } catch (error) {
        reject(error);
      }
    });
  }

  appendNotification(notification: FeedsData.Notification) {
    if (this.notificationList == null || this.notificationList == undefined)
      this.notificationList = [];
    this.notificationList.push(notification);
    this.saveData(
      FeedsData.PersistenceKey.notificationList,
      this.notificationList,
    );
  }

  getNotificationList(): FeedsData.Notification[] {
    if (
      this.notificationList == null ||
      this.notificationList == undefined ||
      this.notificationList.length == 0
    )
      return [];
    let list: FeedsData.Notification[] = this.notificationList.sort(
      (a, b) => Number(b.time) - Number(a.time),
    );
    return list;
  }

  deleteAllNotification() {
    this.notificationList.splice(0, this.notificationList.length);
    this.saveData(
      FeedsData.PersistenceKey.notificationList,
      this.notificationList,
    );
  }

  deleteNotification(notification: FeedsData.Notification) {
    let index = this.notificationList.indexOf(notification);
    this.notificationList.splice(index, 1);
    this.saveData(
      FeedsData.PersistenceKey.notificationList,
      this.notificationList,
    );
  }

  initNotificationList() {
    this.notificationList = [];
  }
  ////cacheBindingAddress
  setCacheBindingAddress(cacheBindingAddress: string) {
    this.cacheBindingAddress = cacheBindingAddress;
  }

  getCacheBindingAddress(): string {
    return this.cacheBindingAddress;
  }

  ////localCredential
  setLocalCredential(localCredential: string) {
    this.localCredential = localCredential;
    this.saveData(FeedsData.PersistenceKey.credential, this.localCredential);
  }

  loadLocalCredential(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.localCredential == '') {
          this.localCredential =
            (await this.loadData(FeedsData.PersistenceKey.credential)) || '';
          resolve(this.localCredential);
          return;
        }
        resolve(this.localCredential);
      } catch (error) {
        reject(error);
      }
    });
  }

  updateLocalCredential(credential: string) {
    this.localCredential = credential;
    this.saveData(FeedsData.PersistenceKey.credential, this.localCredential);
  }

  getLocalCredential() {
    return this.localCredential;
  }

  initLocalCredential() {
    this.localCredential = '';
  }

  //// syncCommentStatusMap
  setSyncCommentStatusMap(syncCommentStatusMap: {
    [nodeChannelId: string]: FeedsData.SyncCommentStatus;
  }) {
    this.syncCommentStatusMap = syncCommentStatusMap;
    this.saveData(
      FeedsData.PersistenceKey.syncCommentStatusMap,
      this.syncCommentStatusMap,
    );
  }

  loadSyncCommentStatusMap(): Promise<{
    [nodeChannelId: string]: FeedsData.SyncCommentStatus;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.syncCommentStatusMap) == '{}') {
          this.syncCommentStatusMap =
            (await this.loadData(
              FeedsData.PersistenceKey.syncCommentStatusMap,
            )) || {};
          resolve(this.syncCommentStatusMap);
          return;
        }
        resolve(this.syncCommentStatusMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateSyncCommentStatus(
    nodeId: string,
    feedsId: number,
    postId: number,
    isSyncFinish: boolean,
    lastUpdate: number,
  ): FeedsData.SyncCommentStatus {
    return {
      nodeId: nodeId,
      feedsId: feedsId,
      postId: postId,
      isSyncFinish: isSyncFinish,
      lastUpdate: lastUpdate,
    };
  }

  getSyncCommentStatus(key: string): FeedsData.SyncCommentStatus {
    if (
      this.syncCommentStatusMap == null ||
      this.syncCommentStatusMap == undefined
    )
      this.syncCommentStatusMap = {};
    return this.syncCommentStatusMap[key];
  }
  getSyncCommentLastUpdateTime(key: string): number {
    let syncCommentStatus = this.getSyncCommentStatus(key);
    if (syncCommentStatus == null || syncCommentStatus == undefined) return 0;
    return syncCommentStatus.lastUpdate || 0;
  }

  updateSyncCommentStatus(
    key: string,
    syncCommentStatus: FeedsData.SyncCommentStatus,
  ) {
    if (
      this.syncCommentStatusMap == null ||
      this.syncCommentStatusMap == undefined
    )
      this.syncCommentStatusMap = {};
    this.syncCommentStatusMap[key] = syncCommentStatus;
    this.saveData(
      FeedsData.PersistenceKey.syncCommentStatusMap,
      this.syncCommentStatusMap,
    );
  }

  isSyncCommnetFinish(key: string): boolean {
    if (
      this.syncCommentStatusMap == null ||
      this.syncCommentStatusMap == undefined
    )
      this.syncCommentStatusMap = {};
    if (
      this.syncCommentStatusMap[key] == null ||
      this.syncCommentStatusMap[key] == undefined
    )
      return false;
    return this.syncCommentStatusMap[key].isSyncFinish || false;
  }

  ////syncPostStatusMap
  setSyncPostStatusMap(syncPostStatusMap: {
    [nodeChannelId: string]: FeedsData.SyncPostStatus;
  }) {
    this.syncPostStatusMap = syncPostStatusMap;
    this.saveData(
      FeedsData.PersistenceKey.syncPostStatusMap,
      this.syncPostStatusMap,
    );
  }

  loadSyncPostStatusMap(): Promise<{
    [nodeChannelId: string]: FeedsData.SyncPostStatus;
  }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.syncPostStatusMap) == '{}') {
          this.syncPostStatusMap =
            (await this.loadData(FeedsData.PersistenceKey.syncPostStatusMap)) ||
            {};
          resolve(this.syncPostStatusMap);
          return;
        }
        resolve(this.syncPostStatusMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateSyncPostStatus(
    nodeId: string,
    feedId: number,
    isSyncFinish: boolean,
    lastUpdate: number,
  ): FeedsData.SyncPostStatus {
    return {
      nodeId: nodeId,
      feedsId: feedId,
      isSyncFinish: isSyncFinish,
      lastUpdate: lastUpdate,
    };
  }

  getSyncPostStatus(key: string): FeedsData.SyncPostStatus {
    if (this.syncPostStatusMap == null || this.syncPostStatusMap == undefined)
      this.syncPostStatusMap = {};
    return this.syncPostStatusMap[key];
  }

  getSyncPostStatusLastUpdateTime(key: string): number {
    let syncPostStatus = this.getSyncPostStatus(key) || null;
    if (syncPostStatus == null || syncPostStatus == undefined) {
      return 0;
    }
    return syncPostStatus.lastUpdate || 0;
  }

  updateSyncPostStatus(key: string, syncPostStatus: FeedsData.SyncPostStatus) {
    if (this.syncPostStatusMap == null || this.syncPostStatusMap == undefined)
      this.syncPostStatusMap = {};
    this.syncPostStatusMap[key] = syncPostStatus;
    this.saveData(
      FeedsData.PersistenceKey.syncPostStatusMap,
      this.syncPostStatusMap,
    );
  }

  isSyncPostFinish(key: string) {
    if (this.syncPostStatusMap == null || this.syncPostStatusMap == undefined)
      this.syncPostStatusMap = {};
    if (
      this.syncPostStatusMap[key] == null ||
      this.syncPostStatusMap[key] == undefined
    )
      return false;
    return this.syncPostStatusMap[key].isSyncFinish || false;
  }

  ////cachedPost
  setCachedPost(cachedPost: { [key: string]: FeedsData.Post }) {
    this.cachedPost = cachedPost;
  }

  getCachedPost(): { [key: string]: FeedsData.Post } {
    return this.cachedPost;
  }

  ////feedPublicStatus
  setFeedPublicStatus(feedPublicStatus: any) {
    this.feedPublicStatus = feedPublicStatus;
  }

  getFeedPublicStatus(): any {
    return this.feedPublicStatus;
  }

  ////carrierStatus
  setCarrierStatus(carrierStatus: FeedsData.ConnState) {
    this.carrierStatus = carrierStatus;
  }

  getCarrierStatus(): FeedsData.ConnState {
    return this.carrierStatus;
  }

  ////networkStatus
  setNetworkStatus(networkStatus: FeedsData.ConnState) {
    this.networkStatus = networkStatus;
  }

  getNetworkStatus(): FeedsData.ConnState {
    return this.networkStatus;
  }

  ////connectionStatus
  setConnectionStatus(connectionStatus: FeedsData.ConnState) {
    this.connectionStatus = connectionStatus;
  }

  getConnectionStatus(): FeedsData.ConnState {
    return this.connectionStatus;
  }

  ////lastConnectionStatus
  setLastConnectionStatus(lastConnectionStatus: FeedsData.ConnState) {
    this.lastConnectionStatus = lastConnectionStatus;
  }

  getlastConnectionStatus(): FeedsData.ConnState {
    return this.lastConnectionStatus;
  }

  ////isDeclareFinish
  setIsDeclareFinish(isDeclareFinish: boolean) {
    this.isDeclareFinish = isDeclareFinish;
  }

  getisDeclareFinish(): boolean {
    return this.isDeclareFinish;
  }

  ////serverVersions
  setServerVersions(serverVersions: {
    [nodeId: string]: FeedsData.ServerVersion;
  }) {
    this.serverVersions = serverVersions;
  }

  loadServerVersion(): Promise<{ [nodeId: string]: FeedsData.ServerVersion }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.serverVersions) == '{}') {
          this.serverVersions =
            (await this.loadData(FeedsData.PersistenceKey.serverVersions)) ||
            {};
          resolve(this.serverVersions);
          return;
        }
        resolve(this.serverVersions);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateServerVersion(
    nodeId: string,
    name: string,
    code: number,
  ): FeedsData.ServerVersion {
    return {
      nodeId: nodeId,
      versionName: name,
      versionCode: code,
    };
  }

  getServerVersion(key: string): FeedsData.ServerVersion {
    if (this.serverVersions == null || this.serverVersions == undefined)
      this.serverVersions = {};
    return this.serverVersions[key];
  }

  getServerVersionCode(key: string): number {
    let serverVersion = this.getServerVersion(key) || null;
    if (serverVersion == null || serverVersion == undefined) return 0;
    return serverVersion.versionCode || 0;
  }

  getServerVersionName(key: string): string {
    let serverVersion = this.getServerVersion(key) || null;
    if (serverVersion == null || serverVersion == undefined) return '';
    return serverVersion.versionName || '';
  }

  updateServerVersion(key: string, serverVersion: FeedsData.ServerVersion) {
    if (this.serverVersions == null || this.serverVersions == undefined)
      this.serverVersions = {};
    this.serverVersions[key] = serverVersion;
    this.saveData(FeedsData.PersistenceKey.serverVersions, this.serverVersions);
  }
  initServerVersion() {
    this.serverVersions = {};
  }
  ////currentLang
  setCurrentLang(currentLang: string) {
    this.currentLang = currentLang;
  }

  getCurrentLang(): string {
    return this.currentLang;
  }

  ////developerMode
  setDeveloperMode(developerMode: boolean) {
    this.developerMode = developerMode;
  }

  getDeveloperMode(): boolean {
    return this.developerMode;
  }

  ////hideDeletedPosts
  setHideDeletedPosts(hideDeletedPosts: boolean) {
    this.hideDeletedPosts = hideDeletedPosts;
  }

  getHideDeletedPosts(): boolean {
    return this.hideDeletedPosts;
  }

  ////hideDeletedComments
  setHideDeletedComments(hideDeletedComments: boolean) {
    this.hideDeletedComments = hideDeletedComments;
  }

  getHideDeletedComments(): boolean {
    return this.hideDeletedComments;
  }

  ////hideOfflineFeeds
  setHideOfflineFeeds(hideOfflineFeeds: boolean) {
    this.hideOfflineFeeds = hideOfflineFeeds;
  }

  getHideOfflineFeeds() {
    return this.hideOfflineFeeds;
  }

  ////channelInfo
  setChannelInfo(channelInfo: any) {
    this.channelInfo = channelInfo;
  }

  getChannelInfo(): any {
    return this.channelInfo;
  }

  ////curtab
  setCurtab(curtab: string) {
    this.curtab = curtab;
  }

  getCurtab() {
    return this.curtab;
  }

  //// nonce
  setNonce(nonce: string) {
    this.nonce = nonce;
  }

  getNonce(): string {
    return this.nonce;
  }

  //// realm
  setRealm(realm: string) {
    this.realm = realm;
  }

  getRealm(): string {
    return this.realm;
  }

  ////serviceNonce
  setServiceNonce(serviceNonce: string) {
    this.serviceNonce = serviceNonce;
  }

  getServiceNonce(): string {
    return this.serviceNonce;
  }

  ////serviceRealm
  setServiceRealm(serviceRealm: string) {
    this.serviceRealm = serviceRealm;
  }

  getServiceRealm() {
    return this.serviceRealm;
  }

  ////profileIamge
  setProfileIamge(profileIamge: string) {
    this.profileIamge = profileIamge;
  }

  getProfileIamge(): string {
    return this.profileIamge;
  }

  ////clipProfileIamge
  setClipProfileIamge(clipProfileIamge: string) {
    this.clipProfileIamge = clipProfileIamge;
  }

  getClipProfileIamge() {
    return this.clipProfileIamge;
  }

  ////isLogging
  setIsLogging(isLogging: { [nodeId: string]: boolean }) {
    this.isLogging = isLogging;
  }

  getIsLogging(): { [nodeId: string]: boolean } {
    return this.isLogging;
  }

  //// tempIdData
  setTempIdData(tempIdDataList: number[]) {
    this.tempIdDataList = tempIdDataList;
  }

  loadTempIdData(): Promise<number[]> {
    return new Promise(async (resolve, reject) => {
      try {
        if (
          this.tempIdDataList == null ||
          this.tempIdDataList == undefined ||
          this.tempIdDataList.length == 0
        ) {
          this.tempIdDataList =
            (await this.loadData(FeedsData.PersistenceKey.tempIdDataList)) ||
            [];
          resolve(this.tempIdDataList);
          return;
        }
        resolve(this.tempIdDataList);
      } catch (error) {
        reject(error);
      }
    });
  }

  listTempIdData(): number[] {
    if (
      this.tempIdDataList == null ||
      this.tempIdDataList == undefined ||
      this.tempIdDataList.length == 0
    )
      return [];
    let list: number[] = this.tempIdDataList.sort((a, b) => b - a);
    return list;
  }

  deleteTempIdData(id: number) {
    if (this.tempIdDataList == null || this.tempIdDataList == undefined)
      this.tempIdDataList = [];
    let index = this.tempIdDataList.indexOf(id);
    this.tempIdDataList.splice(index, 1);
    this.saveData(FeedsData.PersistenceKey.tempIdDataList, this.tempIdDataList);
  }

  appendTempIdData(id: number) {
    if (this.tempIdDataList == null || this.tempIdDataList == undefined)
      this.tempIdDataList = [];
    this.tempIdDataList.push(id);
    this.saveData(FeedsData.PersistenceKey.tempIdDataList, this.tempIdDataList);
  }

  getLastTempIdData(): number {
    let list = this.listTempIdData();
    if (list == null || list == undefined || list.length == 0)
      return 100 * 1000;
    return list[0];
  }

  generateLastTempIdData(): number {
    let tempId = this.getLastTempIdData();
    let id = tempId + 1;
    this.appendTempIdData(id);
    return id;
  }

  ////tempDataMap
  setTempDataMap(tempDataMap: { [key: string]: FeedsData.TempData }) {
    this.tempDataMap = tempDataMap;
    this.saveData(FeedsData.PersistenceKey.tempDataMap, this.tempDataMap);
  }

  loadTempData(): Promise<{ [key: string]: FeedsData.TempData }> {
    return new Promise(async (resolve, reject) => {
      try {
        if (JSON.stringify(this.tempDataMap) == '{}') {
          this.tempDataMap =
            (await this.loadData(FeedsData.PersistenceKey.tempDataMap)) || {};
          resolve(this.tempDataMap);
          return;
        }
        resolve(this.tempDataMap);
      } catch (error) {
        reject(error);
      }
    });
  }

  generateTempData(
    nodeId: string,
    feedId: number,
    postId: number,
    commentId: number,
    dataHash: string,
    sendingType: FeedsData.SendingStatus,
    transDataChannel: FeedsData.TransDataChannel,
    videoData: string,
    imageData: string,
    tempPostId: number,
    tempCommentId: number,
    content: any,
  ): FeedsData.TempData {
    return {
      nodeId: nodeId,
      feedId: feedId,
      tempPostId: tempPostId,
      tempCommentId: tempCommentId,
      dataHash: dataHash,
      status: sendingType,
      transDataChannel: transDataChannel,
      videoData: videoData,
      imageData: imageData,
      postId: postId,
      commentId: commentId,
      content: content,
    };
  }

  updateTempData(key: string, tempData: FeedsData.TempData) {
    if (this.tempDataMap == null || this.tempDataMap == undefined)
      this.tempDataMap = {};
    this.tempDataMap[key] = tempData;
    this.saveData(FeedsData.PersistenceKey.tempDataMap, this.tempDataMap);
  }

  getTempData(key: string) {
    if (this.tempDataMap == null || this.tempDataMap == undefined)
      this.tempDataMap = {};
    return this.tempDataMap[key];
  }

  deleteTempData(key: string) {
    if (this.tempDataMap == null || this.tempDataMap == undefined)
      this.tempDataMap = {};
    this.tempDataMap[key] = null;
    delete this.tempDataMap[key];
    this.saveData(FeedsData.PersistenceKey.tempDataMap, this.tempDataMap);
  }

  listTempData(nodeId: string): FeedsData.TempData[] {
    if (this.tempDataMap == null || this.tempDataMap == undefined) return [];

    let list: FeedsData.TempData[] = [];
    let map = this.tempDataMap;
    let keys: string[] = Object.keys(map) || [];
    for (let index = 0; index < keys.length; index++) {
      const tempData = this.getTempData(keys[index]);
      if (tempData == null || tempData == undefined) continue;
      if (tempData.nodeId == nodeId) list.push(tempData);
    }
    return list;
  }

  ////
  getKey(
    nodeId: string,
    channelId: number,
    postId: number,
    commentId: number,
  ): string {
    return nodeId + '-' + channelId + '-' + postId + '-' + commentId;
  }

  saveData(key: string, value: any): Promise<any> {
    return this.storageService.set(key, value);
  }

  loadData(key: string): Promise<any> {
    return this.storageService.get(key);
  }

  updateCachedUpdateServer(nodeId: string, cachedServer: FeedsData.Server) {
    if (this.cachedUpdateServer == null || this.cachedUpdateServer == undefined)
      this.cachedUpdateServer = {};
    this.cachedUpdateServer[nodeId] = cachedServer;
  }

  getCachedUpdateServer(nodeId: string): FeedsData.Server {
    if (this.cachedUpdateServer == null || this.cachedUpdateServer == undefined)
      this.cachedUpdateServer = {};
    return this.cachedUpdateServer[nodeId];
  }

  getContentHash(content: string) {
    let contentHash = UtilService.SHA256(content);
    return contentHash;
  }

  ////
  //walletAccountAddress
  saveWalletAccountAddress(walletAccountAddress: string) {
    this.walletAccountAddress = walletAccountAddress;
    // this.saveData(FeedsData.PersistenceKey.walletAccountAddress, this.walletAccountAddress);
  }

  async loadWalletAccountAddress(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        if (this.walletAccountAddress == '') {
          this.walletAccountAddress =
            (await this.loadData(
              FeedsData.PersistenceKey.walletAccountAddress,
            )) || '';
          resolve(this.walletAccountAddress);
          return;
        }
        resolve(this.walletAccountAddress);
      } catch (error) {
        reject(error);
      }
    });
  }

  ////
  //save user avatar
  saveUserAvatar(userDid: string, avatar: any) {
    this.saveData(userDid, avatar);
  }

  loadUserAvatar(userDid: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let avatar = await this.loadData(userDid) || null;
        resolve(avatar);
        return;
      } catch (error) {
        reject(error);
      }
    });
  }

  ////
  //save pasar list
  saveNFTPasarList(key: string, pasarList: any) {
    return this.saveData(key, pasarList);
  }

  loadNFTPasarList(key: string) {
    return this.loadData(key);
  }

  ////
  //save collectible list
  saveNFTCollectibleList(key: string, collectiblesList: any) {
    return this.saveData(key, collectiblesList)
  }

  loadNFTCollectibleMap(key: string) {
    return this.loadData(key);
  }

  setDevelopLogMode(developLogMode: boolean) {
    this.developLogMode = developLogMode;
    this.saveData('feeds.developerLogMode', this.developLogMode);
  }

  getDevelopLogMode(): boolean {
    return this.developLogMode;
  }

  loadDevelopLogMode() {
    return new Promise(async (resolve, reject) => {
      try {
        let developLogMode = await this.loadData('feeds.developerLogMode') || false;
        this.developLogMode = developLogMode;
        resolve(this.developLogMode);
      } catch (err) {
        reject(err);
      }
    });
  }

  setDevelopNet(developNet: string) {
    this.developNet = developNet;
    this.saveData('feeds.developNet', this.developNet);
  }

  getDevelopNet(): string {
    return this.developNet;
  }

  loadDevelopNet() {
    return new Promise(async (resolve, reject) => {
      try {
        let developNet = await this.loadData('feeds.developNet') || 'MainNet';
        this.developNet = developNet;
        resolve(this.developNet);
      } catch (err) {
        reject(err);
      }
    });
  }

  setApiProvider(apiProviderName: string) {
    this.apiProvider = apiProviderName;
    this.saveData('feeds:apiprovidername', this.apiProvider);
  }

  getApiProvider() {
    return this.apiProvider;
  }

  loadApiProvider(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        let apiProvider = await this.loadData('feeds:apiprovidername') || Config.ELASTOS_API;
        this.apiProvider = apiProvider;
        resolve(this.apiProvider);
      } catch (err) {
        reject(err);
      }
    });
  }

  //newPostCount
  receiveNewPost() {
    this.newPostCount++;
    console.log("receiveNewPost", this.newPostCount);
    this.events.publish(FeedsEvent.PublishType.receiveNewPost, this.newPostCount);
  }

  getNewPostCount() {
    return this.newPostCount
  }

  resetNewPost() {
    this.newPostCount = 0;
    console.log("resetNewPost", this.newPostCount);
    this.events.publish(FeedsEvent.PublishType.receiveNewPost, this.newPostCount);
  }
}
