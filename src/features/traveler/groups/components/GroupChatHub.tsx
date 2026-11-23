'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useWebSession } from '@/features/auth/session/useWebSession';
import { ROUTES } from '@/lib/routes';
import { chatStorage } from '../services/groupChatStorage';
import {
  Conversation,
  GroupChatMessage,
  SplitBillData,
  PollData,
  BroadcastData,
} from '../types/groupChatTypes';
import { VietQrModal } from './VietQrModal';
import { CreatePollModal } from './CreatePollModal';
import { CreateExpenseModal } from './CreateExpenseModal';
import { BroadcastModal } from './BroadcastModal';
import {
  postGroupMessage,
  acknowledgeBroadcastMessage,
  checkinRollCallMessage,
  toggleExpensePaymentStatus,
  votePollOption,
  TravelGroupHttpError,
} from '../services/travelGroupApi';

export function GroupChatHub() {
  const { status, context } = useWebSession();
  const currentUserId = context?.userId ?? 1;
  const currentUserName = context?.fullName?.trim() || 'Bạn (Traveler)';

  // Error Banner State
  const [apiError, setApiError] = useState<string | null>(null);

  // Navigation & Conversation selection
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('conv-tour-101');
  const [activeTab, setActiveTab] = useState<'all' | 'tour' | 'self_guided' | 'direct'>('all');
  const [convSearchKeyword, setConvSearchKeyword] = useState('');

  // Active Chat State
  const [messages, setMessages] = useState<GroupChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearchKeyword, setInChatSearchKeyword] = useState('');
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  // Modals
  const [qrModalData, setQrModalData] = useState<{
    data: SplitBillData;
    messageId: string;
    isPaid: boolean;
  } | null>(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // Mobile view toggle (conversation list vs chat message pane)
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load conversations
  useEffect(() => {
    const list = chatStorage.getConversations(activeTab, convSearchKeyword);
    setConversations(list);
  }, [activeTab, convSearchKeyword]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvId) return;
    const list = chatStorage.getMessages(selectedConvId, inChatSearchKeyword);
    setMessages(list);
  }, [selectedConvId, inChatSearchKeyword]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (!inChatSearchKeyword && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, inChatSearchKeyword]);

  const activeConversation = chatStorage.getConversation(selectedConvId);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !selectedConvId) return;

    chatStorage.sendMessage(selectedConvId, {
      senderId: currentUserId,
      senderName: currentUserName,
      isSelf: true,
      isHost: false,
      type: 'text',
      content: trimmed,
    });

    setInputText('');
    setMessages(chatStorage.getMessages(selectedConvId));
    setConversations(chatStorage.getConversations(activeTab, convSearchKeyword));

    const numericGroupId = Number(selectedConvId.replace(/\D/g, ''));
    if (numericGroupId > 0) {
      try {
        await postGroupMessage(numericGroupId, { messageType: 'text', content: trimmed });
        setApiError(null);
      } catch (err) {
        if (err instanceof TravelGroupHttpError) {
          setApiError(`Lưu cơ sở dữ liệu thất bại (${err.status}): ${err.message}`);
        }
      }
    }
  };

  const handleAcknowledgeBroadcast = async (messageId: string) => {
    chatStorage.toggleAcknowledgeBroadcast(selectedConvId, messageId, currentUserId);
    setMessages(chatStorage.getMessages(selectedConvId));

    const numericGroupId = Number(selectedConvId.replace(/\D/g, ''));
    const numericMessageId = Number(messageId.replace(/\D/g, ''));
    if (numericGroupId > 0 && numericMessageId > 0) {
      try {
        await acknowledgeBroadcastMessage(numericGroupId, numericMessageId);
        setApiError(null);
      } catch (err) {
        if (err instanceof TravelGroupHttpError) {
          setApiError(`Lưu xác nhận đọc thất bại: ${err.message}`);
        }
      }
    }
  };

  const handleRollCall = async (messageId: string) => {
    chatStorage.toggleRollCall(selectedConvId, messageId, currentUserId);
    setMessages(chatStorage.getMessages(selectedConvId));

    const numericGroupId = Number(selectedConvId.replace(/\D/g, ''));
    const numericMessageId = Number(messageId.replace(/\D/g, ''));
    if (numericGroupId > 0 && numericMessageId > 0) {
      try {
        await checkinRollCallMessage(numericGroupId, numericMessageId);
        setApiError(null);
      } catch (err) {
        if (err instanceof TravelGroupHttpError) {
          setApiError(`Lưu điểm danh thất bại: ${err.message}`);
        }
      }
    }
  };

  const handleVotePoll = async (messageId: string, optionId: string) => {
    chatStorage.toggleVotePoll(selectedConvId, messageId, optionId, currentUserId);
    setMessages(chatStorage.getMessages(selectedConvId));

    const numericGroupId = Number(selectedConvId.replace(/\D/g, ''));
    const numericMessageId = Number(messageId.replace(/\D/g, ''));
    const optionIndex = Number(optionId.replace(/\D/g, '')) || 0;
    if (numericGroupId > 0 && numericMessageId > 0) {
      try {
        await votePollOption(numericGroupId, numericMessageId, optionIndex);
        setApiError(null);
      } catch (err) {
        if (err instanceof TravelGroupHttpError) {
          setApiError(`Lưu bình chọn thất bại: ${err.message}`);
        }
      }
    }
  };

  const handleMarkPaidExpense = async (messageId: string) => {
    chatStorage.markPaidExpense(selectedConvId, messageId, currentUserId);
    setMessages(chatStorage.getMessages(selectedConvId));

    const numericGroupId = Number(selectedConvId.replace(/\D/g, ''));
    const numericMessageId = Number(messageId.replace(/\D/g, ''));
    if (numericGroupId > 0 && numericMessageId > 0) {
      try {
        await toggleExpensePaymentStatus(numericGroupId, numericMessageId, true);
        setApiError(null);
      } catch (err) {
        if (err instanceof TravelGroupHttpError) {
          setApiError(`Cập nhật trạng thái thanh toán thất bại: ${err.message}`);
        }
      }
    }
  };

  const handleCreatePoll = async (pollData: PollData) => {
    chatStorage.sendMessage(selectedConvId, {
      senderId: currentUserId,
      senderName: currentUserName,
      isSelf: true,
      isHost: false,
      type: 'poll',
      content: `Bình chọn: ${pollData.question}`,
      pollData,
    });
    setMessages(chatStorage.getMessages(selectedConvId));
    setConversations(chatStorage.getConversations(activeTab, convSearchKeyword));

    const numericGroupId = Number(selectedConvId.replace(/\D/g, ''));
    if (numericGroupId > 0) {
      try {
        await postGroupMessage(numericGroupId, {
          messageType: 'poll',
          content: pollData.question,
          metadataJson: JSON.stringify(pollData),
        });
        setApiError(null);
      } catch (err) {
        if (err instanceof TravelGroupHttpError) {
          setApiError(`Tạo bình chọn trên DB thất bại: ${err.message}`);
        }
      }
    }
  };

  const handleCreateExpense = async (splitBillData: SplitBillData) => {
    chatStorage.sendMessage(selectedConvId, {
      senderId: currentUserId,
      senderName: currentUserName,
      isSelf: true,
      isHost: false,
      type: 'split_bill',
      content: `Chia tiền: ${splitBillData.title} (${splitBillData.totalAmount.toLocaleString('vi-VN')} đ)`,
      splitBillData,
    });
    setMessages(chatStorage.getMessages(selectedConvId));
    setConversations(chatStorage.getConversations(activeTab, convSearchKeyword));

    const numericGroupId = Number(selectedConvId.replace(/\D/g, ''));
    if (numericGroupId > 0) {
      try {
        await postGroupMessage(numericGroupId, {
          messageType: 'split_bill',
          content: splitBillData.title,
          metadataJson: JSON.stringify(splitBillData),
        });
        setApiError(null);
      } catch (err) {
        if (err instanceof TravelGroupHttpError) {
          setApiError(`Tạo khoản chia tiền trên DB thất bại: ${err.message}`);
        }
      }
    }
  };

  const handleCreateBroadcast = async (broadcastData: BroadcastData) => {
    chatStorage.sendMessage(selectedConvId, {
      senderId: currentUserId,
      senderName: `${currentUserName} (HDV)`,
      isSelf: true,
      isHost: true,
      type: 'broadcast',
      content: `Thông báo: ${broadcastData.title}`,
      broadcastData,
    });
    setMessages(chatStorage.getMessages(selectedConvId));
    setConversations(chatStorage.getConversations(activeTab, convSearchKeyword));

    const numericGroupId = Number(selectedConvId.replace(/\D/g, ''));
    if (numericGroupId > 0) {
      try {
        await postGroupMessage(numericGroupId, {
          messageType: 'broadcast',
          content: broadcastData.title,
          metadataJson: JSON.stringify(broadcastData),
        });
        setApiError(null);
      } catch (err) {
        if (err instanceof TravelGroupHttpError) {
          setApiError(`Phát thông báo lên DB thất bại: ${err.message}`);
        }
      }
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#F8FAFC] overflow-hidden">
      {/* LEFT COLUMN: Conversations List */}
      <aside
        className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-slate-200 bg-white ${
          isMobileDetailOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Top Header & Search */}
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="material-symbols-outlined text-[#103B39] text-2xl">forum</span>
              <span>Trò chuyện nhóm</span>
            </h1>
            <Link
              href={ROUTES.myItineraries}
              className="text-xs font-bold text-[#103B39] hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Lịch trình</span>
            </Link>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={convSearchKeyword}
              onChange={(e) => setConvSearchKeyword(e.target.value)}
              placeholder="Tìm kiếm nhóm, HDV, bạn bè…"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#103B39] focus:outline-none focus:ring-1 focus:ring-[#103B39]"
            />
            {convSearchKeyword && (
              <button
                type="button"
                onClick={() => setConvSearchKeyword('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`rounded-xl px-2.5 py-1 whitespace-nowrap transition ${
                activeTab === 'all'
                  ? 'bg-[#103B39] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tour')}
              className={`rounded-xl px-2.5 py-1 whitespace-nowrap transition flex items-center gap-1 ${
                activeTab === 'tour'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">tour</span>
              Nhóm Tour
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('self_guided')}
              className={`rounded-xl px-2.5 py-1 whitespace-nowrap transition flex items-center gap-1 ${
                activeTab === 'self_guided'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-teal-50 text-[#103B39] hover:bg-teal-100'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">groups</span>
              Tự túc
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`rounded-xl px-2.5 py-1 whitespace-nowrap transition flex items-center gap-1 ${
                activeTab === 'direct'
                  ? 'bg-indigo-700 text-white shadow-2xs'
                  : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">person</span>
              Riêng tư
            </button>
          </div>
        </div>

        {/* Conversations Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <span className="material-symbols-outlined text-3xl text-slate-300 mb-1">
                chat_bubble_outline
              </span>
              <p>Không tìm thấy cuộc trò chuyện nào phù hợp.</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === selectedConvId;
              const isTour = conv.type === 'tour';
              const isDirect = conv.type === 'direct';

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setSelectedConvId(conv.id);
                    setIsMobileDetailOpen(true);
                    setInChatSearchKeyword('');
                    setInChatSearchOpen(false);
                  }}
                  className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                    isSelected ? 'bg-teal-50/70 border-l-4 border-l-[#103B39]' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Avatar Icon */}
                  <div
                    className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      isTour
                        ? 'bg-amber-100 text-amber-800'
                        : isDirect
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-teal-100 text-[#103B39]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {isTour ? 'tour' : isDirect ? 'person' : 'groups'}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected ? 'text-[#103B39]' : 'text-slate-900'
                        }`}
                      >
                        {conv.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">{conv.updatedAt}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mb-1">{conv.subtitle}</p>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                          isTour
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : isDirect
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-teal-50 text-[#103B39] border border-teal-200'
                        }`}
                      >
                        {isTour ? 'Tour HDV' : isDirect ? 'Tin riêng' : 'Nhóm tự túc'}
                      </span>
                      {conv.memberCount > 2 && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {conv.memberCount} thành viên
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT COLUMN: Active Chat Pane */}
      <main
        className={`flex-1 flex flex-col bg-white overflow-hidden ${
          isMobileDetailOpen ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs z-10">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button on mobile */}
                <button
                  type="button"
                  onClick={() => setIsMobileDetailOpen(false)}
                  className="md:hidden rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                  aria-label="Quay lại danh sách"
                >
                  <span className="material-symbols-outlined text-xl">arrow_back</span>
                </button>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    activeConversation.type === 'tour'
                      ? 'bg-amber-100 text-amber-800'
                      : activeConversation.type === 'direct'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-teal-100 text-[#103B39]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {activeConversation.type === 'tour'
                      ? 'tour'
                      : activeConversation.type === 'direct'
                      ? 'person'
                      : 'groups'}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 truncate">
                      {activeConversation.title}
                    </h2>
                    <span
                      className={`hidden sm:inline-block rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                        activeConversation.type === 'tour'
                          ? 'bg-amber-100 text-amber-800'
                          : activeConversation.type === 'direct'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-teal-100 text-[#103B39]'
                      }`}
                    >
                      {activeConversation.type === 'tour'
                        ? 'Tour HDV'
                        : activeConversation.type === 'direct'
                        ? 'Tin riêng'
                        : 'Nhóm tự túc'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {activeConversation.type === 'tour' && activeConversation.hostName
                      ? `HDV: ${activeConversation.hostName} · ${activeConversation.memberCount} thành viên`
                      : activeConversation.type === 'direct'
                      ? 'Đang hoạt động'
                      : `${activeConversation.memberCount} thành viên · Host: ${activeConversation.hostName}`}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setInChatSearchOpen(!inChatSearchOpen)}
                  className={`rounded-xl p-2 text-slate-500 transition ${
                    inChatSearchOpen ? 'bg-teal-50 text-[#103B39]' : 'hover:bg-slate-100'
                  }`}
                  title="Tìm kiếm tin nhắn trong nhóm"
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                </button>

                {activeConversation.itineraryId && (
                  <Link
                    href={ROUTES.itinerary(activeConversation.itineraryId)}
                    className="inline-flex items-center gap-1 rounded-xl bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-[#103B39] hover:bg-teal-100 transition"
                    title="Xem lịch trình liên kết"
                  >
                    <span className="material-symbols-outlined text-sm">map</span>
                    <span className="hidden sm:inline">Lịch trình</span>
                  </Link>
                )}
              </div>
            </div>

            {/* In-Chat Search Bar Banner (when toggled) */}
            {inChatSearchOpen && (
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs animate-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
                <input
                  type="text"
                  value={inChatSearchKeyword}
                  onChange={(e) => setInChatSearchKeyword(e.target.value)}
                  placeholder="Nhập từ khóa cần tìm trong tin nhắn nhóm…"
                  className="flex-1 bg-transparent border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  autoFocus
                />
                {inChatSearchKeyword && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    {messages.length} kết quả
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setInChatSearchKeyword('');
                    setInChatSearchOpen(false);
                  }}
                  className="rounded p-1 text-slate-400 hover:text-slate-600"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {/* DB / API Error Alert Banner */}
            {apiError && (
              <div className="px-4 py-2 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs text-rose-800 shadow-2xs animate-fadeIn">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-rose-600 text-sm">warning</span>
                  <span className="font-medium truncate">{apiError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApiError(null)}
                  className="rounded p-1 text-rose-500 hover:text-rose-700 font-bold ml-2 underline text-[11px] cursor-pointer"
                >
                  Đã hiểu
                </button>
              </div>
            )}

            {/* Sticky Pinned Announcement */}
            {activeConversation.pinnedAnnouncement && !inChatSearchOpen && (
              <div className="px-4 py-2 bg-amber-50/90 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-amber-700 text-base shrink-0">
                    campaign
                  </span>
                  <span className="font-semibold truncate">
                    {activeConversation.pinnedAnnouncement}
                  </span>
                </div>
              </div>
            )}

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2 text-slate-300">
                    chat
                  </span>
                  <p>Chưa có tin nhắn nào trong cuộc trò chuyện này.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.isSelf;

                  // Render Interactive Cards
                  if (msg.type === 'broadcast' && msg.broadcastData) {
                    const b = msg.broadcastData;
                    const hasAcknowledged = b.acknowledgedUserIds.includes(currentUserId);

                    return (
                      <div key={msg.id} className="mx-auto max-w-lg w-full">
                        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/95 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase text-amber-900">
                              <span className="material-symbols-outlined text-xs">campaign</span>
                              THÔNG BÁO TỪ HƯỚNG DẪN VIÊN
                            </span>
                            <span className="text-[10px] text-amber-700 font-semibold">
                              {msg.timestamp}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-amber-950 mb-1">{b.title}</h4>
                          <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-line mb-3">
                            {b.content}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeBroadcast(msg.id)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                                hasAcknowledged
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-amber-600 text-white hover:bg-amber-700'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {hasAcknowledged ? 'check_circle' : 'check'}
                              </span>
                              <span>{hasAcknowledged ? 'Đã xác nhận đã đọc' : 'Tôi đã đọc và hiểu'}</span>
                            </button>

                            <span className="text-[11px] font-bold text-amber-800">
                              {b.acknowledgedUserIds.length} người đã xác nhận
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'roll_call' && msg.rollCallData) {
                    const r = msg.rollCallData;
                    const hasCheckedIn = r.checkedInUserIds.includes(currentUserId);

                    return (
                      <div key={msg.id} className="mx-auto max-w-lg w-full">
                        <div className="rounded-2xl border-2 border-teal-300 bg-teal-50/95 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-teal-200 px-2.5 py-0.5 text-[10px] font-black uppercase text-teal-900">
                              <span className="material-symbols-outlined text-xs">checklist</span>
                              ĐIỂM DANH ĐOÀN
                            </span>
                            <span className="text-[10px] text-teal-700 font-semibold">
                              {msg.timestamp}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-teal-950 mb-1">{r.title}</h4>
                          <p className="text-xs text-teal-800 mb-3">
                            Vui lòng bấm xác nhận bạn đã có mặt trên xe / tại điểm hẹn đúng giờ (Hạn:{' '}
                            {r.deadlineTime || 'Ngay bây giờ'}).
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-teal-200">
                            <button
                              type="button"
                              onClick={() => handleRollCall(msg.id)}
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-xs ${
                                hasCheckedIn
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : 'bg-[#103B39] text-white hover:bg-[#174B4A]'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {hasCheckedIn ? 'done_all' : 'check'}
                              </span>
                              <span>{hasCheckedIn ? 'Đã có mặt' : 'Xác nhận có mặt'}</span>
                            </button>

                            <div className="text-right">
                              <span className="text-xs font-black text-teal-950">
                                {r.checkedInUserIds.length}/{r.totalMembers}
                              </span>
                              <span className="text-[10px] text-teal-700 block">thành viên có mặt</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'split_bill' && msg.splitBillData) {
                    const s = msg.splitBillData;
                    const isPaid = s.paidUserIds.includes(currentUserId);

                    return (
                      <div key={msg.id} className="mx-auto max-w-lg w-full">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-teal-300 transition">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-800 border border-emerald-200">
                              <span className="material-symbols-outlined text-xs">receipt_long</span>
                              CHIA TIỀN CHUYẾN ĐI
                            </span>
                            <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mb-1">{s.title}</h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Người trả: <b>{s.payerName}</b> · Tổng hóa đơn:{' '}
                            <b>{s.totalAmount.toLocaleString('vi-VN')} đ</b>
                          </p>

                          <div className="rounded-xl bg-teal-50/70 p-3 mb-3 border border-teal-100 flex items-center justify-between">
                            <span className="text-xs text-slate-700 font-medium">
                              Số tiền bạn cần chuyển:
                            </span>
                            <span className="text-base font-extrabold text-[#103B39]">
                              {s.perPersonAmount.toLocaleString('vi-VN')} đ
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setQrModalData({
                                  data: s,
                                  messageId: msg.id,
                                  isPaid,
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#103B39] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#174B4A] transition"
                            >
                              <span className="material-symbols-outlined text-sm">qr_code_2</span>
                              <span>Quét VietQR chuyển tiền</span>
                            </button>

                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Đã thanh toán
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleMarkPaidExpense(msg.id)}
                                className="text-xs text-slate-500 hover:text-slate-800 underline"
                              >
                                Đã chuyển ngoài app?
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'poll' && msg.pollData) {
                    const p = msg.pollData;

                    return (
                      <div key={msg.id} className="mx-auto max-w-lg w-full">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-black uppercase text-indigo-800 border border-indigo-200">
                              <span className="material-symbols-outlined text-xs">poll</span>
                              BÌNH CHỌN Ý KIẾN
                            </span>
                            <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 mb-3">{p.question}</h4>

                          <div className="space-y-2 mb-3">
                            {p.options.map((opt) => {
                              const voteCount = opt.voterUserIds.length;
                              const percent =
                                p.totalVotes > 0 ? Math.round((voteCount / p.totalVotes) * 100) : 0;
                              const hasVoted = opt.voterUserIds.includes(currentUserId);

                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleVotePoll(msg.id, opt.id)}
                                  className={`w-full relative overflow-hidden rounded-xl border p-2.5 text-left text-xs transition ${
                                    hasVoted
                                      ? 'border-[#103B39] bg-teal-50/50'
                                      : 'border-slate-200 hover:bg-slate-50'
                                  }`}
                                >
                                  {/* Progress bar background */}
                                  <div
                                    className="absolute inset-y-0 left-0 bg-teal-100/60 transition-all duration-300"
                                    style={{ width: `${percent}%` }}
                                  />
                                  <div className="relative z-1 flex items-center justify-between">
                                    <span
                                      className={`font-semibold ${
                                        hasVoted ? 'text-[#103B39]' : 'text-slate-800'
                                      }`}
                                    >
                                      {hasVoted && '✓ '}
                                      {opt.text}
                                    </span>
                                    <span className="text-[11px] font-bold text-slate-500">
                                      {voteCount} vote ({percent}%)
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-2">
                            <span>Tổng số phiếu: {p.totalVotes}</span>
                            <span>Bấm vào lựa chọn để biểu quyết</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'meeting_point' && msg.meetingPointData) {
                    const m = msg.meetingPointData;

                    return (
                      <div key={msg.id} className="mx-auto max-w-lg w-full">
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-200 px-2.5 py-0.5 text-[10px] font-black uppercase text-rose-900">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              ĐIỂM HẸN TẬP KẾT
                            </span>
                            <span className="text-[10px] text-rose-700 font-semibold">
                              {msg.timestamp}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-rose-950 mb-1">{m.title}</h4>
                          <p className="text-xs text-rose-900 mb-1">
                            📍 <b>Địa chỉ:</b> {m.address}
                          </p>
                          <p className="text-xs text-rose-900 mb-3">
                            ⏰ <b>Thời gian hẹn:</b> {m.time}
                          </p>

                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              m.address,
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
                          >
                            <span className="material-symbols-outlined text-sm">directions</span>
                            <span>Chỉ đường tới điểm hẹn</span>
                          </a>
                        </div>
                      </div>
                    );
                  }

                  // Normal Text Message
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      {!isSelf && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          <span className="text-[11px] font-bold text-slate-700">
                            {msg.senderName}
                          </span>
                          {msg.isHost && (
                            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">
                              HOST
                            </span>
                          )}
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                          isSelf
                            ? 'bg-[#103B39] text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input & Action Bar */}
            <div className="p-3 border-t border-slate-200 bg-white relative">
              {/* Action Drawer Popover */}
              {isActionMenuOpen && (
                <div className="absolute bottom-16 left-4 z-30 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in slide-in-from-bottom-2">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase">
                    Tiện ích tương tác nhóm
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPollModalOpen(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="material-symbols-outlined text-indigo-600 text-lg">poll</span>
                    <span>Tạo bình chọn</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpenseModalOpen(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="material-symbols-outlined text-emerald-600 text-lg">
                      receipt_long
                    </span>
                    <span>Chia tiền (VietQR)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBroadcastModalOpen(true);
                      setIsActionMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span className="material-symbols-outlined text-amber-600 text-lg">
                      campaign
                    </span>
                    <span>Phát thông báo đoàn (HDV)</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Plus (+) Action Button */}
                <button
                  type="button"
                  onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
                    isActionMenuOpen
                      ? 'bg-[#103B39] text-white rotate-45'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Thêm tiện ích (Bình chọn, Chia tiền, Thông báo...)"
                >
                  <span className="material-symbols-outlined text-xl">add</span>
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#103B39] focus:outline-none focus:ring-1 focus:ring-[#103B39]"
                />

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#103B39] text-white shadow-xs transition hover:bg-[#174B4A] disabled:opacity-40"
                  aria-label="Gửi tin nhắn"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-2 text-slate-300">forum</span>
            <p className="text-sm font-semibold">Chọn một cuộc trò chuyện để bắt đầu.</p>
          </div>
        )}
      </main>

      {/* MODALS */}
      {qrModalData && (
        <VietQrModal
          data={qrModalData.data}
          isPaid={qrModalData.isPaid}
          onMarkPaid={() => handleMarkPaidExpense(qrModalData.messageId)}
          onClose={() => setQrModalData(null)}
        />
      )}

      {isPollModalOpen && (
        <CreatePollModal
          onClose={() => setIsPollModalOpen(false)}
          onSubmit={handleCreatePoll}
        />
      )}

      {isExpenseModalOpen && (
        <CreateExpenseModal
          onClose={() => setIsExpenseModalOpen(false)}
          onSubmit={handleCreateExpense}
          currentUserName={currentUserName}
          memberCount={activeConversation?.memberCount ?? 4}
        />
      )}

      {isBroadcastModalOpen && (
        <BroadcastModal
          onClose={() => setIsBroadcastModalOpen(false)}
          onSubmit={handleCreateBroadcast}
        />
      )}
    </div>
  );
}
