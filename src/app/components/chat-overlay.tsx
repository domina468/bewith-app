import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X, Send, Smile, MessageCircleOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { chatAPI } from '/src/utils/api';
import { supabase } from '/src/utils/supabase/client';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  emoji?: string;
}

interface ChatOverlayProps {
  roomId: string;
  user: { id?: string; username: string };
  onClose: () => void;
}

const quickEmojis = ['👍', '❤️', '😊', '🔥', '✨', '💪', '☕', '🎵'];

export function ChatOverlay({ roomId, user, onClose }: ChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Načítaj históriu správ
  useEffect(() => {
    chatAPI.getMessages(roomId)
      .then(res => {
        if (res.messages) {
          setMessages(res.messages.map((m: any) => ({
            id: m.id,
            userId: m.userId || m.user_id,
            userName: m.userName || m.user_name,
            text: m.text,
            timestamp: new Date(m.createdAt || m.created_at),
            emoji: m.emoji,
          })));
        }
      })
      .catch(() => {});
  }, [roomId]);

  // Supabase Realtime Broadcast — live správy
  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`);

    channel
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        setMessages(prev => {
          if (prev.find(m => m.id === payload.id)) return prev;
          return [...prev, {
            id: payload.id,
            userId: payload.userId,
            userName: payload.userName,
            text: payload.text,
            timestamp: new Date(payload.timestamp),
            emoji: payload.emoji,
          }];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // Auto-scroll na najnovšiu správu
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string, emoji?: string) => {
    if (!text.trim() || sending) return;
    setSending(true);

    const tempId = Date.now().toString();
    const newMsg: Message = {
      id: tempId,
      userId: user.id || user.username,
      userName: user.username,
      text,
      timestamp: new Date(),
      emoji,
    };

    // Optimistic update
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setShowEmojiPicker(false);

    try {
      const res = await chatAPI.sendMessage(roomId, text, emoji);

      // Broadcast ostatným
      const channel = supabase.channel(`room:${roomId}`);
      await channel.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: {
          id: res.message?.id || tempId,
          userId: user.id || user.username,
          userName: user.username,
          text,
          timestamp: newMsg.timestamp.toISOString(),
          emoji,
        },
      });
    } catch {
      // Správa ostane lokálne aj pri chybe
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => sendMessage(inputText);
  const handleEmojiSend = (emoji: string) => sendMessage(emoji, emoji);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const isMe = (userId: string) => userId === (user.id || user.username);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25 }}
      className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-[#81C784] to-[#66BB6A] px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white text-lg">Optional Chat</h3>
          <p className="text-white/80 text-xs">For those who want to connect with words</p>
        </div>
        <Button onClick={onClose} variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-[#E8F5E9] px-6 py-3 border-b border-gray-200">
        <div className="flex items-start gap-2">
          <MessageCircleOff className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-gray-700">
            Chat is optional. Feel free to stay silent and just be present. Your presence alone is meaningful. 💚
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe(message.userId) ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] ${isMe(message.userId) ? 'order-2' : 'order-1'}`}>
                {!isMe(message.userId) && (
                  <p className="text-xs text-gray-600 mb-1 px-1">{message.userName}</p>
                )}

                {message.emoji ? (
                  <div className={`inline-block text-4xl p-2 rounded-2xl ${
                    isMe(message.userId) ? 'bg-gradient-to-r from-[#81C784] to-[#66BB6A]' : 'bg-white'
                  }`}>
                    {message.emoji}
                  </div>
                ) : (
                  <div className={`inline-block px-4 py-2 rounded-2xl shadow-sm ${
                    isMe(message.userId)
                      ? 'bg-gradient-to-r from-[#81C784] to-[#66BB6A] text-white'
                      : 'bg-white text-gray-800'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-1 px-1">{formatTime(message.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤫</div>
            <p className="text-gray-600 text-sm mb-2">Chat is quiet right now</p>
            <p className="text-gray-500 text-xs">Everyone's enjoying the shared presence in their own way</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white border-t border-gray-200 p-4"
          >
            <p className="text-xs text-gray-600 mb-3">Quick reactions</p>
            <div className="flex flex-wrap gap-2">
              {quickEmojis.map((emoji) => (
                <button key={emoji} onClick={() => handleEmojiSend(emoji)}
                  className="text-3xl hover:scale-110 transition-transform">
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Smile className="w-5 h-5" />
          </Button>

          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type if you feel like it..."
            className="flex-1"
          />

          <Button onClick={handleSend} disabled={!inputText.trim() || sending}
            className="bg-[#81C784] hover:bg-[#66BB6A] text-white" size="icon">
            <Send className="w-5 h-5" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">Or just listen. Both are perfectly fine. 💚</p>
      </div>
    </motion.div>
  );
}
