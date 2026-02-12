import { Core } from '@walletconnect/core';
import { Web3Wallet, type Web3WalletTypes } from '@walletconnect/web3wallet';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import type { SessionTypes } from '@walletconnect/types';

type WalletClient = InstanceType<typeof Web3Wallet>;
type SessionProposal = Web3WalletTypes.SessionProposal;
type SessionRequest = Web3WalletTypes.SessionRequest;

let web3wallet: WalletClient | null = null;

export async function initWalletConnect(projectId: string): Promise<WalletClient> {
  if (web3wallet) return web3wallet;

  const core = new Core({ projectId });
  web3wallet = await Web3Wallet.init({
    core,
    metadata: {
      name: 'W3W',
      description: 'Web3 Wallet',
      url: 'https://w3w.app',
      icons: [],
    },
  });
  return web3wallet;
}

export function getWeb3Wallet(): WalletClient {
  if (!web3wallet) throw new Error('WalletConnect not initialized');
  return web3wallet;
}

export async function pair(uri: string): Promise<void> {
  const wc = getWeb3Wallet();
  await wc.pair({ uri });
}

export function approveSession(
  proposal: SessionProposal,
  accounts: string[],
  chains: number[],
) {
  const wc = getWeb3Wallet();

  const eipChains = chains.map((c) => `eip155:${c}`);
  const eipAccounts = accounts.flatMap((a) =>
    eipChains.map((chain) => `${chain}:${a}`),
  );

  const namespaces = buildApprovedNamespaces({
    proposal: proposal.params,
    supportedNamespaces: {
      eip155: {
        chains: eipChains,
        methods: [
          'eth_sendTransaction',
          'personal_sign',
          'eth_signTypedData_v4',
        ],
        events: ['accountsChanged', 'chainChanged'],
        accounts: eipAccounts,
      },
    },
  });

  return wc.approveSession({ id: proposal.id, namespaces });
}

export function rejectSession(id: number) {
  const wc = getWeb3Wallet();
  return wc.rejectSession({
    id,
    reason: getSdkError('USER_REJECTED'),
  });
}

export function respondRequest(
  topic: string,
  id: number,
  result: string,
) {
  const wc = getWeb3Wallet();
  return wc.respondSessionRequest({
    topic,
    response: { id, jsonrpc: '2.0', result },
  });
}

export function rejectRequest(topic: string, id: number) {
  const wc = getWeb3Wallet();
  return wc.respondSessionRequest({
    topic,
    response: {
      id,
      jsonrpc: '2.0',
      error: getSdkError('USER_REJECTED'),
    },
  });
}

export function disconnectSession(topic: string) {
  const wc = getWeb3Wallet();
  return wc.disconnectSession({
    topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });
}

export function getActiveSessions(): Record<string, SessionTypes.Struct> {
  const wc = getWeb3Wallet();
  return wc.getActiveSessions();
}

export type { SessionTypes, SessionProposal, SessionRequest };
