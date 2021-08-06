export class ApiUrl {
  /**后台服务*/
  public static SERVER: string = 'https://www.trinity-tech.io/feeds/api/v2';

  /** IPFS 测试网络 */
  public static IPFS_TEST_SERVER: string = 'https://ipfs-test.trinity-feeds.app/';
  /** IPFS 正式网络 */
  public static IPFS_SERVER: string = 'https://ipfs.trinity-feeds.app/';

  /**register*/
  public static register: string = ApiUrl.SERVER + '/register';

  /**listAll*/
  public static listAll: string = ApiUrl.SERVER + '/listAll';

  /**get*/
  public static get: string = ApiUrl.SERVER + '/get';

  /**remove*/
  public static remove: string = ApiUrl.SERVER + '/remove';

  /**listPage*/
  public static listPage: string = ApiUrl.SERVER + '/listPage';

  /**update*/
  public static update: string = ApiUrl.SERVER + '/update';

  /**NFT IPFS*/
  // public static nftAdd: string = ApiUrl.IPFS_TEST_SERVER + 'api/v0/add';
  // public static nftGet: string = ApiUrl.IPFS_TEST_SERVER + 'ipfs/';
  public static IPFS_NFT_ADD: string = 'api/v0/add';
  public static IPFS_NFT_GET: string = 'ipfs/';

  public static PASAR_ADDRESS: string = '0x2652d10A5e525959F7120b56f2D7a9cD0f6ee087';
  public static PASAR_TEST_ADDRESS: string = '0x2652d10A5e525959F7120b56f2D7a9cD0f6ee087';

  public static STICKER_ADDRESS: string = '0xed1978c53731997f4DAfBA47C9b07957Ef6F3961';
  public static STICKER_TEST_ADDRESS: string = '0xed1978c53731997f4DAfBA47C9b07957Ef6F3961';
}
