/**
 * Message names (preferred) and legacy route strings.
 * App code should use RobotCopy.sendMessage with message constants; routes are deprecated.
 */

/** resaurce — message names */
export const MSG_REQUEST_HR_HELP = 'request_hr_help';
export const MSG_LIST_AVAILABLE_EMPLOYEES = 'list_available_employees';
export const MSG_CREATE_CHAT_ROOM = 'create_chat_room';
export const MSG_SEND_CHAT_MESSAGE = 'send_chat_message';
export const MSG_LIST_CHAT_MESSAGES = 'list_chat_messages';
export const MSG_TAX_DOCUMENTS_LIST = 'tax_documents_list';
export const MSG_TAX_GENERATE_ENQUEUE = 'tax_generate_enqueue';
export const MSG_TAX_GENERATE_STATUS = 'tax_generate_status';
export const MSG_TAX_GENERATE_RESULT = 'tax_generate_result';
export const MSG_LEGAL_DOCUMENT_REVIEW = 'legal_document_review';
export const MSG_PRESENCE_VERIFY = 'presence_verify';

/** saurce — message names */
export const MSG_COMMERCE_WALLET_BALANCE = 'commerce_wallet_balance';
export const MSG_CRYPTO_PORTFOLIO_SNAPSHOT = 'crypto_portfolio_snapshot';
export const MSG_WALLET_LIST = 'wallet_list';
export const MSG_WALLET_TRANSACTIONS_LIST = 'wallet_transactions_list';
export const MSG_WALLET_HOLD_APPLY = 'wallet_hold_apply';
export const MSG_INVESTMENT_ELIGIBILITY = 'investment_eligibility';
export const MSG_INVESTMENT_MODE_ENABLE = 'investment_mode_enable';
export const MSG_REVIEW_CABIN_SUBMIT = 'review_cabin_submit';
export const MSG_REVIEW_QUEUE_LIST = 'review_queue_list';

/** @deprecated use MSG_* constants — resaurce HR */
export const RESAURCE_HR_HELP_REQUEST = 'resaurce:hr/help/request';
export const RESAURCE_HR_EMPLOYEES_AVAILABLE = 'resaurce:hr/employees/available';
export const RESAURCE_HR_CHAT_ROOM_CREATE = 'resaurce:hr/chat/room/create';
export const RESAURCE_HR_CHAT_MESSAGE_SEND = 'resaurce:hr/chat/message/send';
export const RESAURCE_HR_CHAT_MESSAGES_LIST = 'resaurce:hr/chat/messages/list';

/** resaurce — tax documents (Cave) */
export const RESAURCE_TAX_DOCUMENTS_LIST = 'resaurce:tax/documents/list';
export const RESAURCE_TAX_GENERATE_ENQUEUE = 'resaurce:tax/generate/enqueue';
export const RESAURCE_TAX_GENERATE_STATUS = 'resaurce:tax/generate/status';
export const RESAURCE_TAX_GENERATE_RESULT = 'resaurce:tax/generate/result';

/** resaurce — legal / compliance */
export const RESAURCE_LEGAL_DOCUMENT_REVIEW = 'resaurce:legal/document/review';

/** resaurce — presence */
export const RESAURCE_PRESENCE_VERIFY = 'resaurce:presence/verify';

/** saurce — commerce */
export const SAURCE_COMMERCE_WALLET_BALANCE = 'saurce:commerce/wallet/balance';

/** saurce — crypto / high-yield portfolio */
export const SAURCE_CRYPTO_PORTFOLIO_SNAPSHOT = 'saurce:crypto/portfolio/snapshot';

/** saurce — wallet ledger */
export const SAURCE_WALLET_LIST = 'saurce:wallet/list';
export const SAURCE_WALLET_GET = 'saurce:wallet/get';
export const SAURCE_WALLET_TRANSACTIONS_LIST = 'saurce:wallet/transactions/list';
export const SAURCE_WALLET_HOLD_APPLY = 'saurce:wallet/hold/apply';

/** saurce — investment policy */
export const SAURCE_INVESTMENT_ELIGIBILITY_EVALUATE = 'saurce:investment/eligibility/evaluate';
export const SAURCE_INVESTMENT_MODE_ENABLE = 'saurce:investment/mode/enable';

/** saurce — cabin reviews */
export const SAURCE_REVIEW_CABIN_SUBMIT = 'saurce:review/cabin/submit';
export const SAURCE_REVIEW_QUEUE_LIST = 'saurce:review/queue/list';
export const SAURCE_REVIEW_TICKET_CREATE = 'saurce:review/ticket/create';
