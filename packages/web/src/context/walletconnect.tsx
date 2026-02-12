import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  initWalletConnect,
  getWeb3Wallet,
  pair as wcPair,
  approveSession as wcApproveSession,
  rejectSession as wcRejectSession,
  respondRequest as wcRespondRequest,
  rejectRequest as wcRejectRequest,
  disconnectSession as wcDisconnectSession,
  getActiveSessions,
  type SessionTypes,
  type SessionProposal,
  type SessionRequest,
} from '../lib/walletconnect.js';

export interface PendingRequest extends SessionRequest {
  peerMeta: SessionTypes.Struct['peer']['metadata'] | null;
}

export interface WalletConnectState {
  ready: boolean;
  sessions: SessionTypes.Struct[];
  pendingProposal: SessionProposal | null;
  pendingRequest: PendingRequest | null;
  pair: (uri: string) => Promise<void>;
  approveSession: (
    proposal: SessionProposal,
    accounts: string[],
    chains: number[],
  ) => Promise<void>;
  rejectSession: (id: number) => Promise<void>;
  respondRequest: (topic: string, id: number, result: string) => Promise<void>;
  rejectRequest: (topic: string, id: number) => Promise<void>;
  disconnectSession: (topic: string) => Promise<void>;
  clearProposal: () => void;
  clearRequest: () => void;
}

const WalletConnectContext = createContext<WalletConnectState | null>(null);

export function WalletConnectProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<SessionTypes.Struct[]>([]);
  const [pendingProposal, setPendingProposal] = useState<SessionProposal | null>(null);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);

  const refreshSessions = useCallback(() => {
    try {
      const active = getActiveSessions();
      setSessions(Object.values(active));
    } catch {
      // SDK not ready yet
    }
  }, []);

  useEffect(() => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
      console.warn('VITE_WALLETCONNECT_PROJECT_ID not set — WalletConnect disabled');
      return;
    }

    initWalletConnect(projectId).then((wc) => {
      wc.on('session_proposal', (proposal) => {
        setPendingProposal(proposal);
      });

      wc.on('session_request', (request) => {
        const active = getActiveSessions();
        const session = active[request.topic];
        setPendingRequest({
          ...request,
          peerMeta: session?.peer?.metadata ?? null,
        });
      });

      wc.on('session_delete', () => refreshSessions());

      refreshSessions();
      setReady(true);
    });
  }, [refreshSessions]);

  const pair = useCallback(async (uri: string) => {
    await wcPair(uri);
  }, []);

  const approveSession = useCallback(async (
    proposal: SessionProposal,
    accounts: string[],
    chains: number[],
  ) => {
    await wcApproveSession(proposal, accounts, chains);
    setPendingProposal(null);
    refreshSessions();
  }, [refreshSessions]);

  const rejectSession = useCallback(async (id: number) => {
    await wcRejectSession(id);
    setPendingProposal(null);
  }, []);

  const respondRequest = useCallback(async (topic: string, id: number, result: string) => {
    await wcRespondRequest(topic, id, result);
    setPendingRequest(null);
  }, []);

  const rejectRequest = useCallback(async (topic: string, id: number) => {
    await wcRejectRequest(topic, id);
    setPendingRequest(null);
  }, []);

  const disconnectSession = useCallback(async (topic: string) => {
    await wcDisconnectSession(topic);
    refreshSessions();
  }, [refreshSessions]);

  const clearProposal = useCallback(() => setPendingProposal(null), []);
  const clearRequest = useCallback(() => setPendingRequest(null), []);

  return (
    <WalletConnectContext.Provider value={{
      ready,
      sessions,
      pendingProposal,
      pendingRequest,
      pair,
      approveSession,
      rejectSession,
      respondRequest,
      rejectRequest,
      disconnectSession,
      clearProposal,
      clearRequest,
    }}>
      {children}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect(): WalletConnectState {
  const ctx = useContext(WalletConnectContext);
  if (!ctx) throw new Error('useWalletConnect must be used within WalletConnectProvider');
  return ctx;
}
