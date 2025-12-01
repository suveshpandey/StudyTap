// -----------------------------------------------------------------------------
// File: ChatMessageBubble.tsx
// Company: Euron (A Subsidiary of EngageSphere Technology Private Limited)
// Created On: 01-12-2025
// Description: Chat message bubble component for displaying user and bot messages with markdown support
// -----------------------------------------------------------------------------

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Bot, User as UserIcon, BookOpenCheck, Sparkles } from 'lucide-react';

interface ChatMessageBubbleProps {
  message: string;
  sender: 'USER' | 'BOT';
  timestamp?: string;
  sources?: { title: string; page: number }[];
}

const ChatMessageBubble = ({
  message,
  sender,
  timestamp,
  sources,
}: ChatMessageBubbleProps) => {
  const isUser = sender === 'USER';

  const formattedTime =
    timestamp &&
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`flex items-start space-x-2 ${
          isUser ? 'flex-row-reverse space-x-reverse max-w-[80%]' : 'w-full'
        }`}
      >
        {/* Avatar */}
        <div
          className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white'
              : 'bg-slate-100 text-blue-600'
          }`}
        >
          {isUser ? (
            <UserIcon className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-br-md max-w-[80%]'
              : 'bg-slate-50 text-slate-900 rounded-bl-md border border-slate-200 w-full'
          }`}
        >
          {/* Content */}
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message}
            </p>
          ) : (
            <div
              className={`reset-tw w-full overflow-x-auto px-0 text-sm leading-relaxed ${
                isUser ? 'text-white' : 'text-slate-900'
              }`}
            >
              <ReactMarkdown
                // casting plugins as any to keep TS happy with the plugin signature
                {...({
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeHighlight],
                } as any)}
              >
                {message}
              </ReactMarkdown>
            </div>
          )}

          {/* Timestamp */}
          {formattedTime && (
            <p
              className={`mt-2 text-xs ${
                isUser ? 'text-blue-100' : 'text-slate-500'
              }`}
            >
              {formattedTime}
            </p>
          )}

          {/* Sources (BOT only) */}
          {!isUser && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              {sources && sources.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    <span>Sources used</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {sources.map((src, i) => (
                      <span
                        key={`${src.title}-${src.page}-${i}`}
                        className="inline-flex items-center rounded-full bg-slate-100 text-[11px] text-slate-600 px-2 py-0.5"
                      >
                        <Sparkles className="mr-1 h-3 w-3 text-blue-500" />
                        {src.title} · p.{src.page}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Generated from general knowledge
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessageBubble;