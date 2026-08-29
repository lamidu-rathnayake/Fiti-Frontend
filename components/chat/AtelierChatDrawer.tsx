"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/firebase/AuthContext";
import { listShops } from "@/lib/api/endpoints/shops";
import { listClientOrders, listOpenRequests } from "@/lib/api/endpoints/orders";

export interface Message {
    id: string;
    sender: "me" | "them";
    text: string;
    timestamp: string;
}

export interface Conversation {
    id: string;
    name: string;
    role: "tailor" | "client";
    avatar: string;
    status: "online" | "offline";
    lastMessage: string;
    messages: Message[];
}

interface AtelierChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    initialContactName?: string;
    userRole?: "tailor" | "client";
}

export default function AtelierChatDrawer({
    isOpen,
    onClose,
    initialContactName,
    userRole = "client",
}: AtelierChatDrawerProps) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string>("");
    const [inputText, setInputText] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load active real conversations from backend/localStorage
    useEffect(() => {
        if (!isOpen) return;

        const loadConversations = async () => {
            setLoading(true);

            // 1. Check local storage for persistent user chats
            const storedChatsStr = typeof window !== "undefined" ? localStorage.getItem(`fiti_chats_${user?.uid || "guest"}`) : null;
            let localChats: Conversation[] = storedChatsStr ? JSON.parse(storedChatsStr) : [];

            try {
                // 2. Fetch real ateliers and active commissions from API
                const realShops = await listShops();
                let realChannels: Conversation[] = [];

                if (realShops && realShops.length > 0) {
                    realChannels = realShops.map((shop, idx) => ({
                        id: `shop_${shop.shop_id}`,
                        name: shop.shop_name,
                        role: "tailor" as const,
                        avatar: shop.images && shop.images.length > 0
                            ? shop.images[0].image_url
                            : "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=200&q=80",
                        status: "online" as const,
                        lastMessage: "Direct line open. Send a message to discuss your garment specifications.",
                        messages: [
                            {
                                id: `init_${shop.shop_id}`,
                                sender: "them" as const,
                                text: `Welcome to ${shop.shop_name}. How can we assist with your bespoke order today?`,
                                timestamp: "Just now",
                            },
                        ],
                    }));
                }

                // Combine local saved chats with real channels
                const mergedMap = new Map<string, Conversation>();
                realChannels.forEach((c) => mergedMap.set(c.id, c));
                localChats.forEach((c) => mergedMap.set(c.id, c));

                const merged = Array.from(mergedMap.values());

                if (merged.length > 0) {
                    setConversations(merged);
                    if (!activeConvId || !merged.some((c) => c.id === activeConvId)) {
                        setActiveConvId(merged[0].id);
                    }
                } else {
                    setConversations([]);
                }
            } catch {
                if (localChats.length > 0) {
                    setConversations(localChats);
                    setActiveConvId(localChats[0].id);
                }
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, [isOpen, user]);

    // Handle initialContactName switch
    useEffect(() => {
        if (initialContactName && conversations.length > 0) {
            const found = conversations.find((c) => c.name.toLowerCase().includes(initialContactName.toLowerCase()));
            if (found) {
                setActiveConvId(found.id);
            }
        }
    }, [initialContactName, conversations]);

    const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [isOpen, activeConv?.messages]);

    if (!isOpen) return null;

    const handleSendMessage = (textToSend?: string) => {
        const text = textToSend || inputText;
        if (!text.trim() || !activeConvId) return;

        const newMsg: Message = {
            id: `msg-${Date.now()}`,
            sender: "me",
            text: text.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        const updated = conversations.map((c) => {
            if (c.id === activeConvId) {
                return {
                    ...c,
                    lastMessage: text.trim(),
                    messages: [...c.messages, newMsg],
                };
            }
            return c;
        });

        setConversations(updated);
        if (typeof window !== "undefined") {
            localStorage.setItem(`fiti_chats_${user?.uid || "guest"}`, JSON.stringify(updated));
        }

        setInputText("");
    };

    return (
        <div className="fixed bottom-4 right-4 z-[9999] max-w-2xl w-full sm:w-[650px] h-[520px] bg-[#101116]/95 border border-zinc-800 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden animate-fade-in font-sans">
            {/* CHAT HEADER */}
            <div className="bg-[#15161C] border-b border-zinc-800 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F5CA53] shadow-[0_0_8px_rgba(245,202,83,0.6)] animate-pulse" />
                    <div>
                        <h3 className="text-xs font-extrabold text-white uppercase tracking-widest font-heading">
                            Atelier Direct Messaging
                        </h3>
                        <span className="text-[10px] font-mono text-zinc-400">
                            {userRole === "tailor" ? "Seller Direct Line with Client" : "Client Direct Line with Master Tailor"}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center text-sm transition-all"
                    title="Close Chat"
                >
                    &times;
                </button>
            </div>

            {/* MAIN CHAT BODY */}
            <div className="flex-1 flex overflow-hidden">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center font-mono text-xs text-zinc-500 animate-pulse">
                        Connecting to secure atelier channel...
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-zinc-500">
                        <span className="text-3xl">💬</span>
                        <h4 className="text-sm font-bold text-white font-heading">No Active Conversations</h4>
                        <p className="text-xs max-w-sm text-zinc-400">
                            Start a new order or browse the tailor directory to message verified artisans directly.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* LEFT CONVERSATIONS LIST */}
                        <div className="w-48 sm:w-56 bg-[#0D0E12] border-r border-zinc-800/80 flex flex-col overflow-y-auto">
                            <div className="p-3 border-b border-zinc-800/60">
                                <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase block">
                                    Active Channels ({conversations.length})
                                </span>
                            </div>

                            <div className="divide-y divide-zinc-900">
                                {conversations.map((conv) => {
                                    const isActive = conv.id === activeConvId;
                                    return (
                                        <button
                                            key={conv.id}
                                            onClick={() => setActiveConvId(conv.id)}
                                            className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${
                                                isActive
                                                    ? "bg-[#181920] border-l-2 border-[#F5CA53]"
                                                    : "hover:bg-[#13141A]"
                                            }`}
                                        >
                                            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-zinc-700 bg-zinc-900">
                                                <img src={conv.avatar} alt={conv.name} className="w-full h-full object-cover" />
                                                {conv.status === "online" && (
                                                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-black" />
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className={`text-xs font-bold truncate ${isActive ? "text-[#F5CA53]" : "text-white"}`}>
                                                    {conv.name}
                                                </h4>
                                                <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                                    {conv.lastMessage}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* RIGHT MESSAGES PANEL */}
                        {activeConv && (
                            <div className="flex-1 flex flex-col bg-[#101116]">
                                {/* Active Contact Bar */}
                                <div className="px-4 py-2.5 bg-[#14151B] border-b border-zinc-800/80 flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-zinc-700 bg-zinc-900">
                                        <img src={activeConv.avatar} alt={activeConv.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-extrabold text-white font-heading">
                                            {activeConv.name}
                                        </h4>
                                        <span className="text-[9px] font-mono text-emerald-400">
                                            Active Now &bull; Verified Atelier Line
                                        </span>
                                    </div>
                                </div>

                                {/* Messages Thread */}
                                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                    {activeConv.messages.map((msg) => {
                                        const isMe = msg.sender === "me";
                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                                        isMe
                                                            ? "bg-[#F5CA53] text-black font-medium shadow-[0_0_12px_rgba(245,202,83,0.2)]"
                                                            : "bg-[#1C1D24] text-zinc-200 border border-zinc-800"
                                                    }`}
                                                >
                                                    {msg.text}
                                                </div>
                                                <span className="text-[9px] font-mono text-zinc-500 mt-1 px-1">
                                                    {msg.timestamp}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Response Suggestion Chips */}
                                <div className="px-3 py-1.5 bg-[#14151B] border-t border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                                    <span className="text-[9px] font-mono text-zinc-500 uppercase shrink-0">Quick:</span>
                                    <button
                                        onClick={() => handleSendMessage("Can we confirm my fitting time?")}
                                        className="px-2.5 py-1 bg-[#1F2029] hover:bg-[#282935] text-[10px] text-zinc-300 rounded-lg whitespace-nowrap transition-all border border-zinc-800 hover:border-[#F5CA53]/50"
                                    >
                                        Confirm fitting time?
                                    </button>
                                    <button
                                        onClick={() => handleSendMessage("What fabric options do you recommend?")}
                                        className="px-2.5 py-1 bg-[#1F2029] hover:bg-[#282935] text-[10px] text-zinc-300 rounded-lg whitespace-nowrap transition-all border border-zinc-800 hover:border-[#F5CA53]/50"
                                    >
                                        Fabric recommendations?
                                    </button>
                                </div>

                                {/* Input Field Bar */}
                                <div className="p-3 bg-[#14151B] border-t border-zinc-800 flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSendMessage();
                                        }}
                                        placeholder={`Text ${activeConv.name.split(" ")[0]}...`}
                                        className="flex-1 bg-[#1C1D24] border border-zinc-800 focus:border-[#F5CA53] rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all"
                                    />
                                    <button
                                        onClick={() => handleSendMessage()}
                                        className="px-4 py-2 bg-[#F5CA53] hover:bg-[#f7d369] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1"
                                    >
                                        <span>Send</span>
                                        <span>&rarr;</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
