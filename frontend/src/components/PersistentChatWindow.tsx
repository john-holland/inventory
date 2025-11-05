/**
 * Persistent Chat Window
 * 
 * Always-visible chat interface in lower left corner
 * - Transparent black background with dark green border
 * - Tab-based interface for multiple chats
 * - Mandatory chats always open
 * - Other chats closeable to sidebar list
 * - Expand/collapse functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Collapse,
  Badge,
  Divider
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Minimize as MinimizeIcon
} from '@mui/icons-material';
import { ChatService, type ChatRoom, type ChatMessage } from '../services/ChatService';

interface PersistentChatWindowProps {
  userId?: string;
}

export const PersistentChatWindow: React.FC<PersistentChatWindowProps> = ({
  userId = '0xCurrentUser...1234'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeRooms, setActiveRooms] = useState<ChatRoom[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [showJoinedChats, setShowJoinedChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatService = ChatService.getInstance();

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeRooms, currentChatId]);

  // Load initial chats
  useEffect(() => {
    const allChats = chatService.getAllChatRooms();
    setActiveRooms(allChats);
    if (allChats.length > 0 && !currentChatId) {
      setCurrentChatId(allChats[0].id);
    }
  }, []);

  const getCurrentChat = (): ChatRoom | undefined => {
    return activeRooms.find(room => room.id === currentChatId);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentChatId) return;

    try {
      await chatService.sendMessage(currentChatId, {
        sender: userId,
        content: messageInput,
        type: 'user'
      });

      // Refresh active rooms
      const updatedRooms = chatService.getAllChatRooms();
      setActiveRooms(updatedRooms);
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleCloseChat = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    // For now, just switch to another chat
    const remainingChats = activeRooms.filter(room => room.id !== chatId);
    setActiveRooms(remainingChats);
    if (currentChatId === chatId && remainingChats.length > 0) {
      setCurrentChatId(remainingChats[0].id);
    }
  };

  const openChatRoom = (room: ChatRoom) => {
    if (!activeRooms.find(r => r.id === room.id)) {
      setActiveRooms([...activeRooms, room]);
    }
    setCurrentChatId(room.id);
    setShowJoinedChats(false);
  };

  // Minimized view
  if (!isExpanded) {
    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          width: 60,
          height: 60,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #2e7d32',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 1400,
          transition: 'all 0.3s',
          '&:hover': {
            backgroundColor: 'rgba(46, 125, 50, 0.2)',
            transform: 'scale(1.1)'
          }
        }}
        onClick={() => setIsExpanded(true)}
      >
        <Badge badgeContent={activeRooms.length} color="success">
          <ChatIcon sx={{ color: '#4caf50', fontSize: 30 }} />
        </Badge>
      </Box>
    );
  }

  const currentChat = getCurrentChat();
  const messages = currentChat ? currentChat.messages : [];

  // Expanded view
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        width: 400,
        height: 600,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid #2e7d32',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1400,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header with Tabs */}
      <Box
        sx={{
          borderBottom: '1px solid #2e7d32',
          backgroundColor: 'rgba(46, 125, 50, 0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
          <Typography variant="subtitle2" sx={{ color: '#4caf50', fontWeight: 'bold', p: 1 }}>
            Chats
          </Typography>
          <IconButton size="small" onClick={() => setIsExpanded(false)}>
            <MinimizeIcon sx={{ color: '#4caf50', fontSize: 20 }} />
          </IconButton>
        </Box>
        
        <Tabs
          value={currentChatId}
          onChange={(e, newValue) => setCurrentChatId(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            '& .MuiTab-root': {
              minHeight: 40,
              color: '#ccc',
              fontSize: '0.75rem',
              minWidth: 'auto',
              px: 2,
              '&.Mui-selected': {
                color: '#4caf50'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#4caf50'
            }
          }}
        >
          {activeRooms.map((room) => (
            <Tab
              key={room.id}
              value={room.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {room.name}
                  {room.id !== 'mandatory' && (
                    <CloseIcon
                      sx={{ fontSize: 14, ml: 0.5 }}
                      onClick={(e) => handleCloseChat(room.id, e)}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 2,
          '&::-webkit-scrollbar': {
            width: '6px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#2e7d32',
            borderRadius: '3px'
          }
        }}
      >
        {messages.length === 0 ? (
          <Typography sx={{ color: '#666', textAlign: 'center', mt: 4 }}>
            No messages yet. Start the conversation!
          </Typography>
        ) : (
          messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: message.sender === userId ? 'flex-end' : 'flex-start'
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  p: 1.5,
                  borderRadius: 2,
                  backgroundColor: message.sender === userId ? '#2e7d32' : '#333',
                  color: '#fff'
                }}
              >
                <Typography variant="caption" sx={{ color: '#ccc', display: 'block', mb: 0.5 }}>
                  {message.sender === userId ? 'You' : message.sender}
                </Typography>
                <Typography variant="body2">{message.content}</Typography>
                <Typography variant="caption" sx={{ color: '#999', display: 'block', mt: 0.5 }}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Joined Chats Sidebar */}
      <Box sx={{ borderTop: '1px solid #2e7d32' }}>
        <ListItemButton onClick={() => setShowJoinedChats(!showJoinedChats)}>
          <ListItemText
            primary={
              <Typography variant="caption" sx={{ color: '#4caf50' }}>
                Joined Chats ({chatService.getAllChatRooms().length})
              </Typography>
            }
          />
          {showJoinedChats ? <ExpandLessIcon sx={{ color: '#4caf50' }} /> : <ExpandMoreIcon sx={{ color: '#4caf50' }} />}
        </ListItemButton>
        
        <Collapse in={showJoinedChats}>
          <List
            sx={{
              maxHeight: 120,
              overflowY: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              '&::-webkit-scrollbar': {
                width: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#2e7d32'
              }
            }}
          >
            {chatService.getAllChatRooms().map((room) => (
              <ListItem
                key={room.id}
                button
                onClick={() => openChatRoom(room)}
                sx={{
                  py: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.1)'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="caption" sx={{ color: '#ccc' }}>
                      {room.name}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Box>

      {/* Input Area */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid #2e7d32',
          backgroundColor: 'rgba(46, 125, 50, 0.05)'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#fff',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                '& fieldset': {
                  borderColor: '#2e7d32'
                },
                '&:hover fieldset': {
                  borderColor: '#4caf50'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4caf50'
                }
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            sx={{
              minWidth: 'auto',
              px: 2,
              backgroundColor: '#2e7d32',
              '&:hover': {
                backgroundColor: '#4caf50'
              }
            }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

