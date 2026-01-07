import React from 'react';
import { Message, MessageSender, MessageContentType } from '../types';
import FactCheckResult from './FactCheckResult';
import LoadingSpinner from './LoadingSpinner';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const bubbleClasses = isUser
    ? 'bg-indigo-500 text-white self-end rounded-br-none'
    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';

  return (
    <div className={`flex flex-col mb-4 max-w-3xl w-full ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`p-3 rounded-lg shadow-md ${bubbleClasses}`}>
        {message.data.type === MessageContentType.TEXT && (
          <p>{(message.data as { type: MessageContentType.TEXT; content: string }).content}</p>
        )}
        {message.data.type === MessageContentType.FACT_CHECK_RESULT && (
          <FactCheckResult result={(message.data as { type: MessageContentType.FACT_CHECK_RESULT; content: any }).content} />
        )}
        {message.data.type === MessageContentType.LOADING && (
          <div className="flex items-center gap-2 text-gray-700">
            <LoadingSpinner />
            <span>{(message.data as { type: MessageContentType.LOADING; content: string }).content}</span>
          </div>
        )}
        {message.data.type === MessageContentType.ERROR && (
          <div className="text-red-600">
            <strong>Error:</strong> {(message.data as { type: MessageContentType.ERROR; content: string }).content}
          </div>
        )}
      </div>
      <span className="text-xs text-gray-500 mt-1 px-1">
        {message.timestamp.toLocaleTimeString()}
      </span>
    </div>
  );
};

export default ChatBubble;