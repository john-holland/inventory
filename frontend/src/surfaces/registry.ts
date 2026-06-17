import type React from 'react';
import { commerceWalletViews } from './saurce/commerceWalletViews';
import { investmentViews } from './saurce/investmentViews';
import { reviewCabinViews } from './saurce/reviewCabinViews';
import { cabinSessionViews } from './saurce/cabinSession/cabinSessionViews';
import { taxDocumentsViews } from './resaurce/taxDocumentsViews';
import { legalReviewViews } from './resaurce/legalReviewViews';
import { inventoryReportsViews } from './resaurce/inventoryReportsViews';
import { salesReportsViews } from './resaurce/salesReportsViews';
import { hrHelpViews } from './resaurce/hrHelpViews';

export type SurfaceRegistryEntry = {
  viewComponents: Record<string, React.ComponentType<any>>;
  messages: Record<string, string>;
};

const REGISTRY: Record<string, SurfaceRegistryEntry> = {
  'saurce:commerce_wallet': {
    viewComponents: commerceWalletViews,
    messages: {
      wallet_list: 'wallet/list',
      wallet_transactions_list: 'wallet/transactions/list',
      wallet_hold_apply: 'wallet/hold/apply',
    },
  },
  'saurce:investment': {
    viewComponents: investmentViews,
    messages: {
      investment_eligibility: 'investment/eligibility/evaluate',
      investment_mode_enable: 'investment/mode/enable',
      wallet_hold_apply: 'wallet/hold/apply',
    },
  },
  'saurce:review_cabin': {
    viewComponents: reviewCabinViews,
    messages: {
      review_queue_list: 'review/queue/list',
      review_cabin_submit: 'review/cabin/submit',
      review_ticket_create: 'review/ticket/create',
    },
  },
  'saurce:cabin_session': {
    viewComponents: cabinSessionViews,
    messages: {
      review_queue_list: 'review/queue/list',
      review_cabin_submit: 'review/cabin/submit',
      review_ticket_create: 'review/ticket/create',
    },
  },
  'resaurce:tax_documents': {
    viewComponents: taxDocumentsViews,
    messages: {
      tax_documents_list: 'tax/documents/list',
      tax_generate_enqueue: 'tax/generate/enqueue',
      tax_generate_status: 'tax/generate/status',
      tax_generate_result: 'tax/generate/result',
    },
  },
  'resaurce:legal_review': {
    viewComponents: legalReviewViews,
    messages: {
      legal_documents_list: 'legal/documents/list',
      legal_document_enqueue: 'legal/document/enqueue',
    },
  },
  'resaurce:inventory_reports': {
    viewComponents: inventoryReportsViews,
    messages: {
      inventory_report_list: 'inventory/report/list',
      inventory_report_enqueue: 'inventory/report/enqueue',
    },
  },
  'resaurce:sales_reports': {
    viewComponents: salesReportsViews,
    messages: {
      sales_report_list: 'sales/report/list',
      sales_report_enqueue: 'sales/report/enqueue',
    },
  },
  'resaurce:hr_help': {
    viewComponents: hrHelpViews,
    messages: {
      request_hr_help: 'hr/help/request',
      list_available_employees: 'hr/employees/available',
      create_chat_room: 'hr/chat/room/create',
      send_chat_message: 'hr/chat/message/send',
      list_chat_messages: 'hr/chat/messages/list',
    },
  },
};

export function getSurfaceRegistry(service: 'resaurce' | 'saurce', surface: string): SurfaceRegistryEntry | null {
  return REGISTRY[`${service}:${surface}`] || null;
}
