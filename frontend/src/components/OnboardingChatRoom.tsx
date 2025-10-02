import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Send,
  Person,
  Group,
  Description,
  ExpandMore,
  AttachFile,
  EmojiEmotions,
  VideoCall,
  Phone
} from '@mui/icons-material';
import { OnboardingParticipant, ChatRoom } from '../services/OnboardingService';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'user' | 'system' | 'bot';
}

interface OnboardingChatRoomProps {
  chatRoom: ChatRoom;
  currentUser: OnboardingParticipant;
}

export const OnboardingChatRoom: React.FC<OnboardingChatRoomProps> = ({
  chatRoom,
  currentUser
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'HR Bot',
      content: `Welcome to the onboarding chat room for ${chatRoom.name}! This is where you can ask questions and get support during your onboarding process.`,
      timestamp: new Date().toISOString(),
      type: 'bot'
    },
    {
      id: '2',
      sender: 'HR Bot',
      content: `📋 Onboarding Materials:
• Company Handbook
• IT Setup Guide
• Benefits Overview
• Team Introduction
• First Week Schedule`,
      timestamp: new Date().toISOString(),
      type: 'bot'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [expandedMaterials, setExpandedMaterials] = useState(false);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      sender: currentUser.name,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'user'
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate bot response for certain keywords
    setTimeout(() => {
      const botResponse = generateBotResponse(newMessage);
      if (botResponse) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'HR Bot',
          content: botResponse,
          timestamp: new Date().toISOString(),
          type: 'bot'
        };
        setMessages(prev => [...prev, botMessage]);
      }
    }, 1000);
  };

  const generateBotResponse = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('help')) {
      return `🤖 I\'m here to help you with any questions you have about the onboarding process.
      you can use the following commands:
      - 'help' to get a list of available commands
      - 'handbook' to get the company handbook
      - 'it' to get IT setup instructions
      - 'benefit' to get benefits information
      - 'schedule' to get the first week schedule
      - 'team' to get team introductions`;
    }
    
    if (lowerMessage.includes('handbook') || lowerMessage.includes('policy')) {
      return '📖 You can find the company handbook in the onboarding materials. It covers all our policies, procedures, and company culture guidelines.';
    }
    
    if (lowerMessage.includes('it') || lowerMessage.includes('computer') || lowerMessage.includes('setup')) {
      return '💻 IT setup instructions are available in the onboarding materials. Contact IT support at it@company.com if you need assistance.';
    }
    
    if (lowerMessage.includes('benefit') || lowerMessage.includes('insurance')) {
      return '🏥 Benefits information is available in the onboarding materials. You can also schedule a call with HR to discuss your options.';
    }
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('timeline')) {
      return '📅 Your first week schedule is available in the onboarding materials. We\'ll also send you a detailed timeline before your start date.';
    }
    
    if (lowerMessage.includes('team') || lowerMessage.includes('introduction')) {
      return '👥 Team introductions will happen during your onboarding meeting. You\'ll meet your manager, team members, and key stakeholders.';
    }
    
    return null;
  };

  const onboardingMaterials = [
    {
      title: 'Company Handbook',
      description: 'Complete guide to company policies and procedures',
      icon: '📖',
      url: '#'
    },
    {
      title: 'IT Setup Guide',
      description: 'Step-by-step instructions for computer and software setup',
      icon: '💻',
      url: '#'
    },
    {
      title: 'Benefits Overview',
      description: 'Health insurance, retirement plans, and other benefits',
      icon: '🏥',
      url: '#'
    },
    {
      title: 'Team Introduction',
      description: 'Meet your team members and key stakeholders',
      icon: '👥',
      url: '#'
    },
    {
      title: 'First Week Schedule',
      description: 'Detailed timeline for your first week',
      icon: '📅',
      url: '#'
    }
  ];

  return (
    <Box sx={{ height: '100vh', display: 'flex', bgcolor: '#181818' }}>
      {/* Main Chat Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper sx={{ p: 2, bgcolor: '#23272b', color: '#fff', borderBottom: '1px solid #333' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">{chatRoom.name}</Typography>
              <Typography variant="body2" sx={{ color: '#aaa' }}>
                {chatRoom.participants.length} participants
              </Typography>
            </Box>
            <Box>
              <IconButton sx={{ color: '#4caf50', mr: 1 }}>
                <VideoCall />
              </IconButton>
              <IconButton sx={{ color: '#2196f3', mr: 1 }}>
                <Phone />
              </IconButton>
              <Chip
                label={chatRoom.status}
                color={chatRoom.status === 'active' ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Box>
        </Paper>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#1e1e1e' }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                mb: 2,
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <Paper
                sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.type === 'user' ? '#4caf50' : '#23272b',
                  color: '#fff',
                  borderRadius: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#666' }}>
                    {message.sender.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {message.sender}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#aaa', ml: 1 }}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {message.content}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Message Input */}
        <Paper sx={{ p: 2, bgcolor: '#23272b', borderTop: '1px solid #333' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton sx={{ color: '#666', mr: 1 }}>
              <AttachFile />
            </IconButton>
            <IconButton sx={{ color: '#666', mr: 1 }}>
              <EmojiEmotions />
            </IconButton>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': { borderColor: '#444' },
                  '&:hover fieldset': { borderColor: '#666' },
                  '&.Mui-focused fieldset': { borderColor: '#4caf50' },
                },
              }}
            />
            <IconButton
              onClick={sendMessage}
              sx={{ color: '#4caf50', ml: 1 }}
              disabled={!newMessage.trim()}
            >
              <Send />
            </IconButton>
          </Box>
        </Paper>
      </Box>

      {/* Sidebar */}
      <Box sx={{ width: 300, bgcolor: '#23272b', borderLeft: '1px solid #333' }}>
        {/* Participants */}
        <Box sx={{ p: 2, borderBottom: '1px solid #333' }}>
          <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
            Participants
          </Typography>
          <List sx={{ p: 0 }}>
            {chatRoom.participants.map((participant) => (
              <ListItem key={participant.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#666' }}>
                    {participant.name.charAt(0)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={participant.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" sx={{ color: '#aaa' }}>
                        {participant.role.replace('_', ' ')}
                      </Typography>
                      <Chip
                        label={participant.department}
                        size="small"
                        sx={{ ml: 1, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  sx={{ color: '#fff' }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Onboarding Materials */}
        <Box sx={{ p: 2 }}>
          <Accordion
            expanded={expandedMaterials}
            onChange={() => setExpandedMaterials(!expandedMaterials)}
            sx={{ bgcolor: 'transparent', color: '#fff' }}
          >
            <AccordionSummary expandIcon={<ExpandMore sx={{ color: '#fff' }} />}>
              <Typography variant="h6">Onboarding Materials</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ p: 0 }}>
                {onboardingMaterials.map((material) => (
                  <ListItem key={material.title} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ mr: 1 }}>{material.icon}</Typography>
                          <Typography variant="body2" sx={{ color: '#fff' }}>
                            {material.title}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#aaa' }}>
                          {material.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>
    </Box>
  );
};

export default OnboardingChatRoom;