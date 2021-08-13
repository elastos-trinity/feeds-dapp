import { Injectable } from '@angular/core';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { DataHelper } from 'src/app/services/DataHelper';
import { Events } from 'src/app/services/events.service';

import Web3 from 'web3';
import { Config } from './config';
import { Logger } from './logger';

const TAG: string = 'WalletConnectController';
@Injectable()
export class WalletConnectControllerService {
  private url = Config.CONTRACT_URI;
  private chainId = Config.CONTRACT_CHAINID;
  private rpc: { [chainId: number]: string } = Config.CONTRACT_RPC;
  private bridge: string = Config.BRIDGE;
  // private infuraId: "0dd3ab5ca24946938c6d411a1637cc59";
  private accountAddress = '';
  private walletConnectProvider: WalletConnectProvider;
  private walletConnectWeb3: Web3;
  constructor(
    private dataHelper: DataHelper,
    private events: Events,
  ) {
    // this.initWalletConnectProvider();
    // this.disconnect();
  }

  public async connect() {
    return this.setupWalletConnectProvider();
  }

  public async initWalletConnectProvider() {
    Logger.log(TAG, "Init WalletConnect provider, params", this.rpc, this.bridge);

    //  Create WalletConnect Provider
    this.walletConnectProvider = new WalletConnectProvider({
      // infuraId: '0dd3ab5ca24946938c6d411a1637cc59',
      rpc: this.rpc,
      bridge: this.bridge,
      qrcodeModalOptions: {
        mobileLinks: ['metamask'],
      },
    });

    this.updateRpcUrl(this.chainId, this.url);
    Logger.log(TAG, 'Connected?', this.walletConnectProvider.connected);
    // Subscribe to accounts change
    this.walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
      Logger.log(TAG, 'accountsChanged', accounts);
    });

    // Subscribe to chainId change
    this.walletConnectProvider.on('chainChanged', (chainId: number) => {
      Logger.log(TAG, 'chainChanged', chainId);
    });

    // Subscribe to session disconnection
    // this.walletConnectProvider.on(
    //   'disconnect',
    //   (code: number, reason: string) => {
    //     Logger.log(TAG, 'disconnect', code, reason);
    //   },
    // );

    // Subscribe to session disconnection
    this.walletConnectProvider.on('error', (code: number, reason: string) => {
      // Logger.error(TAG, 'error', code, reason);
    });

    Logger.log(TAG, 'Current account address is', this.accountAddress);
    if (this.accountAddress == '')
      this.anonymousInitWeb3();
  }

  private async setupWalletConnectProvider() {
    if (
      this.walletConnectProvider == null ||
      this.walletConnectProvider == undefined
    ) {
      await this.initWalletConnectProvider();
    }

    //  Enable session (triggers QR Code modal)
    Logger.log(TAG, 'Connecting to wallet connect');
    try {
      await this.walletConnectProvider.enable();
      Logger.log(TAG,
        'CONNECTED to wallet connect',
        this.walletConnectProvider,
      );
      this.initWeb3();
    } catch (err) {
      //Work around
      this.destroyWalletConnect();
      // Logger.log(TAG, 'CONNECT error to wallet connect', err);
    }
  }

  async initWeb3() {
    Logger.log(TAG, 'Init web3, walletConnet provider is', this.walletConnectProvider);
    this.walletConnectWeb3 = new Web3(this.walletConnectProvider as any);
    this.accountAddress = await this.parseAccountAddress();
    Logger.log(TAG, 'Account address', this.accountAddress);
    // this.dataHelper.saveWalletAccountAddress(this.accountAddress);

    this.events.publish(FeedsEvent.PublishType.walletConnected);
    this.events.publish(FeedsEvent.PublishType.walletConnectedRefreshPage);
    this.events.publish(FeedsEvent.PublishType.walletConnectedRefreshSM);

    return this.walletConnectWeb3;
  }

  public getWeb3() {
    return this.walletConnectWeb3;
  }

  private async parseAccountAddress() {
    const accounts = await this.walletConnectWeb3.eth.getAccounts();
    return accounts[0];
  }

  public getAccountAddress() {
    return this.accountAddress;
  }

  public disconnect(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      if (this.walletConnectProvider) {
        Logger.log(TAG, 'Disconnecting from wallet connect');
        try {
          this.walletConnectProvider.on(
            'disconnect',
            (code: number, reason: string) => {
              Logger.log(TAG, 'disconnect', code, reason);
              if (code == 1000) {
                resolve('');
                return;
              }
            },
          );

          this.walletConnectProvider.close()
          // await (await this.walletConnectProvider.getWalletConnector()).killSession();
          await this.walletConnectProvider.disconnect();
        } catch (error) {
          Logger.log(TAG, 'Disconnect wallet error', error);
          reject(error);
        }
      } else {
        const error: string = 'Not connected to wallet connect';
        reject(error);
        Logger.log(TAG, error);
      }
    });

  }

  destroyWalletConnect() {
    Logger.log('Destroy WalletConnect');
    this.walletConnectProvider = null;
    this.accountAddress = '';
    this.walletConnectWeb3 = null;
    // this.dataHelper.saveWalletAccountAddress(this.accountAddress);
    this.events.publish(FeedsEvent.PublishType.walletDisconnected);
    this.events.publish(FeedsEvent.PublishType.walletDisconnectedRefreshSM);
    this.events.publish(FeedsEvent.PublishType.walletDisconnectedRefreshPage);
  }

  anonymousInitWeb3() {
    if (this.walletConnectWeb3 != null && typeof this.walletConnectWeb3 !== 'undefined') {
      this.walletConnectWeb3 = new Web3(this.walletConnectWeb3.currentProvider);
    } else {
      this.walletConnectWeb3 = new Web3(
        new Web3.providers.HttpProvider(this.url, { agent: {} }),
      );
      Logger.log(TAG, 'Web3 version is ', this.walletConnectWeb3.version, ', url is', this.url);
    }
  }

  setTestMode(mode: boolean) {
    if (mode) {
      this.chainId = Config.CONTRACT_TEST_CHAINID;
      this.url = Config.CONTRACT_TEST_URI;
      this.rpc = Config.CONTRACT_TEST_RPC;
      return;
    }

    this.chainId = Config.CONTRACT_CHAINID;
    this.url = Config.CONTRACT_URI;
    this.rpc = Config.CONTRACT_RPC;
  }

  setBridge(bridge: string) {
    this.bridge = bridge;
  }

  updateRpcUrl(chainId: number, rpcUrl: string) {
    this.walletConnectProvider.updateRpcUrl(chainId, rpcUrl);
    Logger.log(TAG, "Update rpc, chainId is", chainId, 'url is', rpcUrl);
  }

}
