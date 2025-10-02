// Chat Service - Simple chat functionality for cabin rooms
export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'user' | 'system' | 'bot';
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  messages: ChatMessage[];
  createdAt: string;
  isActive: boolean;
}

export class ChatService {
  private static instance: ChatService;
  private chatRooms: Map<string, ChatRoom> = new Map();

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  constructor() {
    console.log('💬 Chat Service initialized');
  }

  // Create a new chat room
  createChatRoom(name: string, participants: string[]): ChatRoom {
    const chatRoom: ChatRoom = {
      id: `chat_${Date.now()}`,
      name,
      participants,
      messages: [],
      createdAt: new Date().toISOString(),
      isActive: true
    };

    this.chatRooms.set(chatRoom.id, chatRoom);
    console.log(`Created chat room: ${chatRoom.id}`);
    return chatRoom;
  }

  // Send a message to a chat room
  async sendMessage(chatRoomId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const chatRoom = this.chatRooms.get(chatRoomId);
    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    const newMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...message
    };

    chatRoom.messages.push(newMessage);
    this.chatRooms.set(chatRoomId, chatRoom);

    console.log(`Message sent to ${chatRoomId}: ${message.content.substring(0, 50)}...`);
    return newMessage;
  }

  // Get chat room messages
  getChatRoomMessages(chatRoomId: string): ChatMessage[] {
    const chatRoom = this.chatRooms.get(chatRoomId);
    return chatRoom ? chatRoom.messages : [];
  }

  // Get chat room details
  getChatRoom(chatRoomId: string): ChatRoom | undefined {
    return this.chatRooms.get(chatRoomId);
  }

  // Get all chat rooms
  getAllChatRooms(): ChatRoom[] {
    return Array.from(this.chatRooms.values());
  }

  // Add participant to chat room
  addParticipant(chatRoomId: string, participantId: string): boolean {
    const chatRoom = this.chatRooms.get(chatRoomId);
    if (!chatRoom) {
      return false;
    }

    if (!chatRoom.participants.includes(participantId)) {
      chatRoom.participants.push(participantId);
      this.chatRooms.set(chatRoomId, chatRoom);
      return true;
    }

    return false;
  }

  // Remove participant from chat room
  removeParticipant(chatRoomId: string, participantId: string): boolean {
    const chatRoom = this.chatRooms.get(chatRoomId);
    if (!chatRoom) {
      return false;
    }

    const index = chatRoom.participants.indexOf(participantId);
    if (index > -1) {
      chatRoom.participants.splice(index, 1);
      this.chatRooms.set(chatRoomId, chatRoom);
      return true;
    }

    return false;
  }

  // Deactivate chat room
  deactivateChatRoom(chatRoomId: string): boolean {
    const chatRoom = this.chatRooms.get(chatRoomId);
    if (!chatRoom) {
      return false;
    }

    chatRoom.isActive = false;
    this.chatRooms.set(chatRoomId, chatRoom);
    return true;
  }

  // Create a channel (alias for createChatRoom for compatibility)
  createChannel(name: string, participants: string[]): ChatRoom {
    return this.createChatRoom(name, participants);
  }

  // Add user to channel (alias for addParticipant for compatibility)
  addUserToChannel(chatRoomId: string, participantId: string): boolean {
    return this.addParticipant(chatRoomId, participantId);
  }
}

export default ChatService;
