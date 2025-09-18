import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Upload, X, Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase, db, uploadFile } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import { VideoPlayer } from './VideoPlayer';
import ProductionProgress from './ProductionProgress';
import { initiateVideoGeneration, cancelVideoGeneration } from '@/lib/videoGeneration';
import { toast } from "sonner";

export function ChatInterface({ chatId, onChatUpdate, onCreditsRefreshed, onNewChat, darkMode = false }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState(null);
    const [videos, setVideos] = useState([]);
    const [productionStatus, setProductionStatus] = useState(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadChatData = useCallback(async () => {
        if (!chatId || !user) {
            setMessages([]);
            setChat(null);
            setVideos([]);
            setProductionStatus(null);
            return;
        }

        try {
            // Get chat data
            const { data: chatData, error: chatError } = await supabase
                .from('chat')
                .select('*')
                .eq('id', chatId)
                .eq('user_id', user.id)
                .single();

            if (chatError) throw chatError;

            // Get messages
            const chatMessages = await db.getMessages(chatId);
            
            // Get videos
            const chatVideos = await db.getVideos(chatId);

            setChat(chatData);
            setMessages(chatMessages || []);
            setVideos(chatVideos || []);

            // Check for active video production
            const activeVideo = chatVideos?.find(v => 
                v.status === 'processing' || v.status === 'queued'
            );

            if (activeVideo) {
                setProductionStatus({
                    videoId: activeVideo.id,
                    startedAt: new Date(activeVideo.processing_started_at || activeVideo.created_at).getTime(),
                    chatId: chatId
                });
            } else {
                setProductionStatus(null);
            }

        } catch (error) {
            console.error('Error loading chat data:', error);
            toast.error('שגיאה בטעינת נתוני הצ\'אט');
        }
    }, [chatId, user]);

    useEffect(() => {
        loadChatData();
    }, [loadChatData]);

    // Real-time subscriptions
    useEffect(() => {
        if (!chatId) return;

        const messageChannel = supabase
            .channel(`chat-${chatId}-messages`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'message',
                filter: `chat_id=eq.${chatId}`
            }, (payload) => {
                setMessages(prev => {
                    if (prev.some(msg => msg.id === payload.new.id)) {
                        return prev;
                    }
                    return [...prev, payload.new];
                });
            })
            .subscribe();

        const videoChannel = supabase
            .channel(`chat-${chatId}-videos`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'video',
                filter: `chat_id=eq.${chatId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setVideos(prev => {
                        if (prev.some(video => video.id === payload.new.id)) {
                            return prev;
                        }
                        return [payload.new, ...prev];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    setVideos(prev => prev.map(video => 
                        video.id === payload.new.id ? payload.new : video
                    ));
                    
                    // Update production status
                    if (payload.new.status === 'completed' || payload.new.status === 'failed' || payload.new.status === 'cancelled') {
                        setProductionStatus(null);
                        if (payload.new.status === 'completed') {
                            toast.success('הסרטון הושלם בהצלחה!');
                        } else if (payload.new.status === 'failed') {
                            toast.error('שגיאה ביצירת הסרטון');
                        }
                    }
                }
            })
            .subscribe();

        return () => {
            messageChannel.unsubscribe();
            videoChannel.unsubscribe();
        };
    }, [chatId]);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast.error('גודל הקובץ חייב להיות פחות מ-10MB');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() && !selectedFile) return;
        if (!user) {
            toast.error('אנא התחבר כדי לשלוח הודעות');
            return;
        }

        setIsLoading(true);
        
        try {
            let currentChat = chat;
            
            // Create new chat if needed
            if (!currentChat) {
                currentChat = await db.createChat({
                    title: newMessage.trim() || 'פרויקט סרטון חדש',
                    user_id: user.id,
                    status: 'active'
                });
                setChat(currentChat);
                onChatUpdate(currentChat.id);
            }

            // Upload file if exists
            let fileUrl = null;
            if (selectedFile) {
                const uploadResult = await uploadFile(selectedFile);
                fileUrl = uploadResult.file_url;
            }

            // Create user message
            const messageData = {
                chat_id: currentChat.id,
                message_type: 'user',
                content: newMessage.trim(),
                metadata: fileUrl ? { image_url: fileUrl } : {}
            };

            const userMessage = await db.createMessage(messageData);
            
            setMessages(prev => [...prev, userMessage]);
            setNewMessage('');
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Start video generation
            try {
                const newVideo = await initiateVideoGeneration(
                    currentChat.id,
                    newMessage.trim(),
                    fileUrl,
                    user.id
                );

                setProductionStatus({
                    videoId: newVideo.id,
                    startedAt: Date.now(),
                    chatId: currentChat.id
                });

                // Refresh credits
                if (onCreditsRefreshed) {
                    onCreditsRefreshed();
                }

            } catch (error) {
                console.error('Error starting video generation:', error);
                toast.error('שגיאה בהתחלת יצירת הסרטון');
            }

        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('שגיאה בשליחת ההודעה. נסה שוב.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelProduction = async () => {
        if (!productionStatus) return;
        
        setIsCancelling(true);
        try {
            await cancelVideoGeneration(productionStatus.videoId, user.id, 'בוטל על ידי המשתמש');
            setProductionStatus(null);
            toast.success('יצירת הסרטון בוטלה');
        } catch (error) {
            console.error('Error cancelling production:', error);
            toast.error('שגיאה בביטול יצירת הסרטון');
        } finally {
            setIsCancelling(false);
        }
    };

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [newMessage]);

    if (!chatId) {
        return (
            <div className={`h-full flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="mb-6">
                        <Play className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-300'}`} />
                    </div>
                    <h2 className={`text-2xl font-light mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        מוכן ליצור את הסרטון הראשון שלך?
                    </h2>
                    <p className={`font-light mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        התחל פרויקט חדש כדי להתחיל ליצור סרטונים מקצועיים עם AI.
                    </p>
                    <Button
                        onClick={onNewChat}
                        className="bg-orange-500 text-white px-6 py-3 rounded-full font-normal hover:bg-orange-500/90 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                        התחל פרויקט חדש
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.message_type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] p-4 rounded-2xl ${
                                message.message_type === 'user'
                                    ? 'bg-orange-500 text-white'
                                    : darkMode
                                    ? 'bg-gray-800 text-gray-100 border border-gray-700'
                                    : 'bg-gray-100 text-gray-900'
                            }`}
                        >
                            <p className="font-light">{message.content}</p>
                            {message.metadata?.image_url && (
                                <img
                                    src={message.metadata.image_url}
                                    alt="תוכן שהועלה"
                                    className="mt-3 max-w-full h-auto rounded-lg"
                                />
                            )}
                        </div>
                    </div>
                ))}

                {/* Production Progress */}
                {productionStatus && (
                    <div className="flex justify-start">
                        <div className="max-w-[80%]">
                            <ProductionProgress
                                videoId={productionStatus.videoId}
                                startedAt={productionStatus.startedAt}
                                chatId={productionStatus.chatId}
                                darkMode={darkMode}
                                onCancel={handleCancelProduction}
                                isCancelling={isCancelling}
                            />
                        </div>
                    </div>
                )}

                {/* Completed Videos */}
                {videos.filter(v => v.status === 'completed').map((video) => (
                    <div key={video.id} className="flex justify-start">
                        <div className="max-w-[80%]">
                            <VideoPlayer
                                videoId={video.id}
                                videoUrl={video.video_url}
                                darkMode={darkMode}
                            />
                        </div>
                    </div>
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`border-t p-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
                    <div className="flex-1">
                        <div className={`border rounded-2xl p-3 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'}`}>
                            <textarea
                                ref={textareaRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onInput={adjustTextareaHeight}
                                placeholder="תאר את הסרטון שלך או בקש שינויים..."
                                className={`w-full resize-none border-none outline-none font-light ${
                                    darkMode ? 'bg-transparent text-white placeholder-gray-400' : 'bg-transparent text-gray-900 placeholder-gray-500'
                                }`}
                                style={{ minHeight: '20px', maxHeight: '120px' }}
                                disabled={isLoading}
                            />
                            
                            {selectedFile && (
                                <div className={`flex items-center gap-2 mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {selectedFile.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        className={`ml-auto transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        
                        <Button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            variant="outline"
                            size="icon"
                            className={`w-12 h-12 rounded-xl ${
                                darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                            }`}
                            disabled={isLoading}
                        >
                            <Upload className="w-5 h-5" />
                        </Button>

                        <Button
                            type="submit"
                            disabled={isLoading || (!newMessage.trim() && !selectedFile)}
                            className="w-12 h-12 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}