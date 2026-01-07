export enum InputType {
  TEXT = 'TEXT',
  LINK = 'LINK',
  IMAGE_DESCRIPTION = 'IMAGE_DESCRIPTION',
  IMAGE_UPLOAD = 'IMAGE_UPLOAD',
  VIDEO_DESCRIPTION = 'VIDEO_DESCRIPTION',
}

export enum Verdict {
  TRUE = 'TRUE',
  FALSE = 'FALSE',
  MISLEADING = 'MISLEADING',
  UNVERIFIED = 'UNVERIFIED',
}

export interface FactCheckResponse {
  verdict: Verdict;
  confidenceScore: number;
  coreFinding: string;
  evidence: string[];
  sources: string[];
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
}

export enum MessageContentType {
  TEXT = 'text',
  FACT_CHECK_RESULT = 'fact_check_result',
  ERROR = 'error',
  LOADING = 'loading',
}

export interface TextMessage {
  type: MessageContentType.TEXT;
  content: string;
}

export interface FactCheckResultMessage {
  type: MessageContentType.FACT_CHECK_RESULT;
  content: FactCheckResponse;
}

export interface ErrorMessage {
  type: MessageContentType.ERROR;
  content: string; // The error message
}

export interface LoadingMessage {
  type: MessageContentType.LOADING;
  content: string; // Loading message like "Analyzing..."
}

export interface Message {
  id: string;
  sender: MessageSender;
  timestamp: Date;
  data: TextMessage | FactCheckResultMessage | ErrorMessage | LoadingMessage;
}
