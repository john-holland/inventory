/**
 * saurce Cave calls via RobotCopy (sole public transport path).
 */

import { getSaurceRobotCopy } from '../cave/saurceInventoryCave';
import { isServiceConfigured } from './soaRegistry';
import {
  MSG_COMMERCE_WALLET_BALANCE,
  MSG_CRYPTO_PORTFOLIO_SNAPSHOT,
  MSG_INVESTMENT_ELIGIBILITY,
  MSG_INVESTMENT_MODE_ENABLE,
  MSG_REVIEW_CABIN_SUBMIT,
  MSG_REVIEW_QUEUE_LIST,
  MSG_WALLET_HOLD_APPLY,
  MSG_WALLET_LIST,
  MSG_WALLET_TRANSACTIONS_LIST,
} from './soaRoutes';

export type PortfolioSnapshot = Record<string, unknown> & { ok?: boolean; skipped?: boolean };

async function rcSend(message: string, payload: Record<string, unknown>): Promise<PortfolioSnapshot> {
  if (!isServiceConfigured('saurce')) {
    return { ok: false, skipped: true, reason: 'REACT_APP_SOA_SAURCE_URL unset' };
  }
  const rc = await getSaurceRobotCopy();
  if (!rc) return { ok: false, skipped: true, reason: 'saurce_cave_shell_unavailable' };
  return rc.sendMessage(message, payload, { service: 'saurce' });
}

export async function fetchCryptoPortfolioSnapshot(context: {
  userId: string;
  walletId?: string;
}): Promise<PortfolioSnapshot> {
  return rcSend(MSG_CRYPTO_PORTFOLIO_SNAPSHOT, {
    user_id: context.userId,
    wallet_id: context.walletId ?? '',
  });
}

export async function fetchCommerceWalletBalance(walletId: string): Promise<PortfolioSnapshot> {
  return rcSend(MSG_COMMERCE_WALLET_BALANCE, { wallet_id: walletId });
}

export async function fetchSaurceWalletList(): Promise<PortfolioSnapshot> {
  return rcSend(MSG_WALLET_LIST, {});
}

export async function fetchSaurceWalletTransactions(walletId: string): Promise<PortfolioSnapshot> {
  return rcSend(MSG_WALLET_TRANSACTIONS_LIST, { wallet_id: walletId });
}

export async function applySaurceWalletHold(payload: {
  wallet_id: string;
  item_id: string;
  lines: Array<{
    type: string;
    amount_usd: number;
    description: string;
    fund_type?: string;
    hold_type?: string;
  }>;
}): Promise<PortfolioSnapshot> {
  return rcSend(MSG_WALLET_HOLD_APPLY, payload as Record<string, unknown>);
}

export async function evaluateSaurceInvestmentEligibility(payload: {
  item_id: string;
  hold_type: string;
  shipping_item_status?: string;
  risky_mode_enabled?: boolean;
}): Promise<PortfolioSnapshot> {
  return rcSend(MSG_INVESTMENT_ELIGIBILITY, payload as Record<string, unknown>);
}

export async function enableSaurceInvestmentMode(payload: Record<string, unknown>): Promise<PortfolioSnapshot> {
  return rcSend(MSG_INVESTMENT_MODE_ENABLE, payload);
}

export async function submitSaurceCabinReview(payload: Record<string, unknown>): Promise<PortfolioSnapshot> {
  return rcSend(MSG_REVIEW_CABIN_SUBMIT, payload);
}

export async function listSaurceReviewQueue(): Promise<PortfolioSnapshot> {
  return rcSend(MSG_REVIEW_QUEUE_LIST, {});
}
