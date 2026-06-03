import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageSquare, ArrowLeft, Mic, MicOff, Image as ImageIcon, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  garage_id: string | null;
  spare_part_id: string | null;
  updated_at: string;
  otherName?: string;
  otherAvatar?: string | null;
  otherOnline?: boolean;
  lastMessage?: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  media_url: string | null;
  read: boolean;
  created_at: string;
}

const Chat = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    const convs = (data || []) as Conversation[];
    const otherIds = convs.map((c) =>
      c.participant_one === user.id ? c.participant_two : c.participant_one
    );
    const uniqueIds = [...new Set(otherIds)];
    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url, online_status")
      .in("user_id", uniqueIds);

    const profileMap: Record<string, { name: string; avatar: string | null; online: boolean }> = {};
    (profs || []).forEach((p: any) => {
      profileMap[p.user_id] = { name: p.full_name || "User", avatar: p.avatar_url, online: p.online_status || false };
    });

    const enriched = await Promise.all(
      convs.map(async (c) => {
        const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one;
        const { data: lastMsgData } = await supabase
          .from("messages")
          .select("content, message_type")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const lastMsg = lastMsgData?.[0];
        const lastMsgText = lastMsg
          ? lastMsg.message_type === "image"
            ? "📷 Image"
            : lastMsg.message_type === "voice"
            ? "🎤 Voice message"
            : lastMsg.content
          : "";
        return {
          ...c,
          otherName: profileMap[otherId]?.name || "User",
          otherAvatar: profileMap[otherId]?.avatar || null,
          otherOnline: profileMap[otherId]?.online || false,
          lastMessage: lastMsgText,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);

    const convId = searchParams.get("id");
    if (convId && enriched.find((c) => c.id === convId)) {
      setSelectedId(convId);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user, searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedId)
        .order("created_at", { ascending: true });
      setMessages((data || []) as Message[]);

      if (user) {
        await supabase
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", selectedId)
          .neq("sender_id", user.id)
          .eq("read", false);
      }
    };
    fetchMessages();
  }, [selectedId, user]);

  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`messages-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (
    content: string = newMsg.trim(),
    type: "text" | "image" | "voice" = "text",
    mediaUrl?: string
  ) => {
    if ((!content && type === "text") || !selectedId || !user) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: selectedId,
      sender_id: user.id,
      content: content || "",
      message_type: type,
      media_url: mediaUrl || null,
    } as any);
    if (type === "text") setNewMsg("");
    setSending(false);
    // update conversation updated_at
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", selectedId);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    const path = `chat-images/${selectedId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("images").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
    await sendMessage("", "image", publicUrl);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const path = `voice/${selectedId}/${Date.now()}.webm`;
        const { error } = await supabase.storage.from("images").upload(path, blob);
        if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(path);
        await sendMessage("Voice message", "voice", publicUrl);
      };
      mr.start();
      setRecording(true);
    } catch (err) {
      toast({ title: "Microphone access denied" });
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const deleteConversation = async (convId: string) => {
    if (!confirm("Delete this entire conversation? This cannot be undone.")) return;
    // Delete messages first, then conversation
    await supabase.from("messages").delete().eq("conversation_id", convId);
    await supabase.from("conversations").delete().eq("id", convId);
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (selectedId === convId) setSelectedId(null);
    toast({ title: "Conversation deleted" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const selected = conversations.find((c) => c.id === selectedId);
  const showSidebar = !isMobile || !selectedId;
  const showChat = !isMobile || !!selectedId;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-full md:w-80 lg:w-96 shrink-0 bg-card border-r flex flex-col">
            <div className="p-4 border-b flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 -ml-2"
                onClick={() => navigate(-1)}
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-heading font-semibold text-lg">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">No conversations yet.</p>
              ) : (
                conversations.map((c) => {
                  const initials = (c.otherName || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                  return (
                    <div
                      key={c.id}
                      className={`relative group w-full text-left px-4 py-3 flex items-center gap-3 border-b border-border/50 transition-colors hover:bg-muted/60 ${
                        selectedId === c.id ? "bg-muted" : ""
                      }`}
                    >
                      <button className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setSelectedId(c.id)}>
                        <div className="relative shrink-0">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={c.otherAvatar || undefined} alt={c.otherName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          {/* Online indicator */}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${c.otherOnline ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <p className="font-medium text-sm truncate">{c.otherName}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                              {new Date(c.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {c.lastMessage || "Start a conversation"}
                          </p>
                        </div>
                      </button>
                      {/* Delete button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Chat panel */}
        {showChat && (
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {!selected ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-3" />
                <p>Select a conversation to start chatting</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b bg-card flex items-center gap-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => setSelectedId(null)}
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                  )}
                  <div className="relative shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={selected.otherAvatar || undefined} alt={selected.otherName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                        {(selected.otherName || "U").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${selected.otherOnline ? "bg-green-500" : "bg-muted-foreground/40"}`} />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm">{selected.otherName}</h3>
                    <p className={`text-xs ${selected.otherOnline ? "text-green-500" : "text-muted-foreground"}`}>
                      {selected.otherOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {messages.map((m) => {
                    const isMine = m.sender_id === user?.id;
                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-card border rounded-bl-md"
                          }`}
                        >
                          {m.message_type === "image" && m.media_url ? (
                            <a href={m.media_url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={m.media_url}
                                alt="Shared image"
                                className="max-w-full rounded-lg max-h-64 object-cover"
                                loading="lazy"
                              />
                            </a>
                          ) : m.message_type === "voice" && m.media_url ? (
                            <audio controls src={m.media_url} className="max-w-full h-10" />
                          ) : (
                            <p>{m.content}</p>
                          )}
                          <p className={`text-[10px] mt-1 text-right ${
                            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
                          }`}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-card flex items-center gap-2">
                  {/* Image upload */}
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />

                  <Input
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type Your Message here"
                    className="rounded-full bg-muted border-0 px-4"
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  />

                  {/* Voice button */}
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`p-2 rounded-full transition-colors ${recording ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-primary hover:bg-muted"}`}
                    title="Hold to record voice"
                  >
                    {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  <Button
                    onClick={() => sendMessage()}
                    disabled={sending || !newMsg.trim()}
                    size="icon"
                    className="rounded-full shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
