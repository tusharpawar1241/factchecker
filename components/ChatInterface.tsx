import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, MessageSender, InputType, MessageContentType, FactCheckResponse, Verdict } from '../types';
import ChatBubble from './ChatBubble';
import MessageInput from './MessageInput';
import { getFactCheckResponse } from '../services/geminiService';

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom of the chat window
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (
    text: string,
    imageFile?: File,
    inputType?: InputType
  ) => {
    setIsSending(true);
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: MessageSender.USER,
      timestamp: new Date(),
      data: { type: MessageContentType.TEXT, content: text },
    };

    const loadingMessage: Message = {
      id: `ai-loading-${Date.now()}`,
      sender: MessageSender.AI,
      timestamp: new Date(),
      data: { type: MessageContentType.LOADING, content: 'Analyzing...' },
    };

    setMessages((prevMessages) => [...prevMessages, userMessage, loadingMessage]);

    try {
      const response = await getFactCheckResponse(
        inputType || (imageFile ? InputType.IMAGE_UPLOAD : InputType.TEXT),
        text,
        imageFile
      );

      const aiResponse: Message = {
        id: `ai-response-${Date.now()}`,
        sender: MessageSender.AI,
        timestamp: new Date(),
        data: { type: MessageContentType.FACT_CHECK_RESULT, content: response },
      };

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === loadingMessage.id ? aiResponse : msg
        )
      );
    } catch (error) {
      console.error('Failed to get fact-check response:', error);
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        sender: MessageSender.AI,
        timestamp: new Date(),
        data: {
          type: MessageContentType.ERROR,
          content: `Failed to process your request. Please try again.`,
        },
      };
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === loadingMessage.id ? errorMessage : msg
        )
      );
    } finally {
      setIsSending(false);
    }
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar flex flex-col items-center">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <p className="text-xl font-semibold mb-2">How can Veritas AI help you today?</p>
            <p className="max-w-md">Enter text, a link, an image description, or upload an image/video to get a fact-check report.</p>
          </div>
        ) : (
          messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)
        )}
        <div ref={chatEndRef} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} isSending={isSending} />
    </div>
  );
};

export default ChatInterface;