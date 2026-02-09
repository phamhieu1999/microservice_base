import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
  setCurrentConversationId,
  type Conversation,
} from '../features/chat/chatSlice';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function ChatPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  const { conversations, currentConversationId, messages, convStatus, msgStatus, sendStatus, error } =
    useAppSelector((s) => s.chat);
  const authUser = useAppSelector((s) => s.auth.user);

  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    if (!isAuthed) {
      navigate('/login');
      return;
    }
    dispatch(fetchConversations());
  }, [dispatch, isAuthed, navigate]);

  const handleSelectConversation = (conv: Conversation) => {
    dispatch(setCurrentConversationId(conv.id));
    dispatch(fetchMessages(conv.id));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentConversationId || !messageInput.trim()) return;
    await dispatch(sendMessage({ conversationId: currentConversationId, content: messageInput.trim() }));
    setMessageInput('');
  };

  if (!isAuthed) {
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Conversations list */}
      <Card className="h-[70vh]">
        <CardHeader>
          <div className="text-sm font-semibold">Cuộc hội thoại</div>
        </CardHeader>
        <CardContent className="p-0">
          {convStatus === 'loading' && (
            <div className="p-4 text-sm text-slate-600">Đang tải danh sách hội thoại…</div>
          )}
          {error && (
            <div className="p-4 text-sm text-red-600">{error}</div>
          )}
          {conversations.length === 0 && convStatus === 'idle' ? (
            <div className="p-4 text-sm text-slate-600">Chưa có cuộc hội thoại nào.</div>
          ) : (
            <div className="divide-y">
              {conversations.map((conv) => {
                const isActive = conv.id === currentConversationId;
                const otherPartyId =
                  authUser?.id && conv.buyerId === authUser.id ? conv.sellerId : conv.buyerId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`flex w-full flex-col items-start px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                      isActive ? 'bg-slate-100' : ''
                    }`}
                  >
                    <div className="font-medium">Đối tác: {otherPartyId}</div>
                    {conv.lastMessageAt && (
                      <div className="mt-1 text-xs text-slate-500">
                        Cập nhật: {new Date(conv.lastMessageAt).toLocaleString('vi-VN')}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Messages panel */}
      <Card className="h-[70vh] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Tin nhắn</div>
            {currentConversationId && (
              <div className="text-xs text-slate-500">ID: {currentConversationId}</div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          {!currentConversationId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-600">
              Chọn một cuộc hội thoại ở bên trái để xem tin nhắn.
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto rounded-lg border bg-slate-50 p-3">
                {msgStatus === 'loading' && messages.length === 0 ? (
                  <div className="text-sm text-slate-600">Đang tải tin nhắn…</div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-slate-600">Chưa có tin nhắn nào.</div>
                ) : (
                  messages.map((m) => {
                    const isMine = authUser?.id && m.senderId === authUser.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                            isMine
                              ? 'bg-[#ee4d2d] text-white rounded-br-sm'
                              : 'bg-white text-slate-900 rounded-bl-sm border'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{m.content}</div>
                          {m.createdAt && (
                            <div className="mt-1 text-[10px] opacity-70">
                              {new Date(m.createdAt).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form onSubmit={handleSendMessage} className="mt-2 flex gap-2">
                <Input
                  placeholder="Nhập tin nhắn…"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  disabled={sendStatus === 'loading' || !currentConversationId}
                />
                <Button
                  type="submit"
                  disabled={
                    sendStatus === 'loading' || !currentConversationId || !messageInput.trim()
                  }
                >
                  Gửi
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


