import React, { useState, useRef, useCallback } from 'react';
import Button from './Button';
import Input from './Input';
import { InputType } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string, imageFile?: File, inputType?: InputType) => void;
  isSending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isSending }) => {
  const [inputText, setInputText] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation for image/video types
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setSelectedFile(file);
        setInputText(file.name); // Pre-fill input with filename for context
      } else {
        alert('Please select an image or video file.');
        setSelectedFile(null);
        setInputText('');
      }
    } else {
      setSelectedFile(null);
      setInputText('');
    }
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (isSending) return;

      if (selectedFile) {
        // Determine input type based on file type
        let inputType: InputType;
        if (selectedFile.type.startsWith('image/')) {
          inputType = InputType.IMAGE_UPLOAD;
        } else if (selectedFile.type.startsWith('video/')) {
          inputType = InputType.VIDEO_DESCRIPTION; // For video, we'll send description/metadata
        } else {
          // Should not happen due to handleFileChange validation, but as a fallback
          alert('Unsupported file type.');
          return;
        }
        onSendMessage(inputText, selectedFile, inputType);
        setSelectedFile(null);
      } else if (inputText.trim()) {
        let inputType: InputType;
        if (inputText.startsWith('http://') || inputText.startsWith('https://')) {
          inputType = InputType.LINK;
        } else if (inputText.toLowerCase().includes('image of') || inputText.toLowerCase().includes('screenshot of') || inputText.toLowerCase().includes('video of')) {
          inputType = InputType.IMAGE_DESCRIPTION; // Or video description if explicitly mentioned
        } else {
          inputType = InputType.TEXT;
        }
        onSendMessage(inputText, undefined, inputType);
      } else {
        return; // Do nothing if no input
      }

      setInputText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Clear file input
      }
    },
    [inputText, selectedFile, isSending, onSendMessage],
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-10 flex flex-col sm:flex-row items-end gap-2">
      <div className="flex-1 w-full flex items-center gap-2">
        <label htmlFor="file-upload" className="cursor-pointer p-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors duration-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739c.627-1.213 1.041-2.567 1.159-3.973.121-1.483-.083-2.915-.666-4.108V2.25A2.25 2.25 0 0 0 16.125 0H7.875A2.25 2.25 0 0 0 5.625 2.25v2.458c-.583 1.193-.787 2.625-.666 4.108.118 1.406.532 2.76 1.16 3.973.34.662.66 1.353.945 2.052L7.33 21h9.34l-.048-5.759a4.5 4.5 0 0 0 1.258-2.612Z" />
          </svg>
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          disabled={isSending}
        />
        <Input
          type="text"
          value={inputText}
          onChange={handleTextChange}
          placeholder={selectedFile ? selectedFile.name : "Enter text, link, or describe an image/video..."}
          className="flex-1"
          disabled={isSending}
        />
      </div>
      <Button type="submit" disabled={isSending || (!inputText.trim() && !selectedFile)}>
        {isSending ? 'Sending...' : 'Verify'}
      </Button>
    </form>
  );
};

export default MessageInput;