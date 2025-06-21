import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  banLevel: string;
  wallet: number;
}

interface InventoryItem {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  status: 'available' | 'held' | 'sold';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data
  const mockUser: User = {
    id: '1',
    username: 'demo_user',
    email: 'demo@example.com',
    role: 'COMPANY_EMPLOYEE',
    banLevel: 'none',
    wallet: 1250.50,
  };

  const mockInventory: InventoryItem[] = [
    {
      id: '1',
      title: 'iPhone 15 Pro',
      price: 999.99,
      description: 'Latest iPhone with advanced features',
      image: 'https://via.placeholder.com/150',
      status: 'available',
    },
    {
      id: '2',
      title: 'MacBook Air M2',
      price: 1199.99,
      description: 'Powerful laptop for professionals',
      image: 'https://via.placeholder.com/150',
      status: 'held',
    },
    {
      id: '3',
      title: 'AirPods Pro',
      price: 249.99,
      description: 'Wireless earbuds with noise cancellation',
      image: 'https://via.placeholder.com/150',
      status: 'available',
    },
  ];

  useEffect(() => {
    setInventory(mockInventory);
  }, []);

  const handleLogin = () => {
    setCurrentUser(mockUser);
    setIsLoggedIn(true);
    Alert.alert('Success', 'Welcome to the Distributed Inventory System!');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentTab('dashboard');
  };

  const renderDashboard = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, {currentUser?.username}!</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cube-outline" size={24} color="#667eea" />
          <Text style={styles.statNumber}>{inventory.length}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="wallet-outline" size={24} color="#10b981" />
          <Text style={styles.statNumber}>${currentUser?.wallet.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Wallet</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>12.5%</Text>
          <Text style={styles.statLabel}>ROI</Text>
        </View>
      </View>

      {/* Marketplace Toggles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Marketplace Preferences</Text>
        <View style={styles.toggleContainer}>
          <View style={styles.toggleItem}>
            <Ionicons name="logo-amazon" size={20} color="#ff9900" />
            <Text style={styles.toggleLabel}>Amazon</Text>
            <TouchableOpacity style={[styles.toggle, styles.toggleActive]}>
              <View style={styles.toggleThumb} />
            </TouchableOpacity>
          </View>
          <View style={styles.toggleItem}>
            <Ionicons name="cart-outline" size={20} color="#86bc25" />
            <Text style={styles.toggleLabel}>eBay</Text>
            <TouchableOpacity style={[styles.toggle, styles.toggleActive]}>
              <View style={styles.toggleThumb} />
            </TouchableOpacity>
          </View>
          <View style={styles.toggleItem}>
            <Ionicons name="images-outline" size={20} color="#000000" />
            <Text style={styles.toggleLabel}>Unsplash</Text>
            <TouchableOpacity style={[styles.toggle, styles.toggleActive]}>
              <View style={styles.toggleThumb} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Recent Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Items</Text>
        {inventory.slice(0, 3).map((item) => (
          <TouchableOpacity key={item.id} style={styles.itemCard}>
            <Image source={{ uri: item.image }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemPrice}>${item.price}</Text>
              <View style={[styles.statusBadge, 
                item.status === 'available' ? styles.statusAvailable :
                item.status === 'held' ? styles.statusHeld : styles.statusSold
              ]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderInventory = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {inventory.map((item) => (
        <TouchableOpacity key={item.id} style={styles.itemCard}>
          <Image source={{ uri: item.image }} style={styles.itemImage} />
          <View style={styles.itemInfo}>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemDescription}>{item.description}</Text>
            <Text style={styles.itemPrice}>${item.price}</Text>
            <View style={[styles.statusBadge, 
              item.status === 'available' ? styles.statusAvailable :
              item.status === 'held' ? styles.statusHeld : styles.statusSold
            ]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6b7280" />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderChat = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
        <Text style={styles.headerSubtitle}>Connect with your team</Text>
      </View>

      <View style={styles.chatContainer}>
        <TouchableOpacity style={styles.chatTab}>
          <Ionicons name="people-outline" size={24} color="#667eea" />
          <Text style={styles.chatTabText}>Herd Chat</Text>
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>12</Text>
          </View>
        </TouchableOpacity>

        {currentUser?.role.includes('EMPLOYEE') && (
          <TouchableOpacity style={styles.chatTab}>
            <Ionicons name="business-outline" size={24} color="#764ba2" />
            <Text style={styles.chatTabText}>Corpo Chat</Text>
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>5</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.chatTab}>
          <Ionicons name="person-outline" size={24} color="#10b981" />
          <Text style={styles.chatTabText}>Direct Messages</Text>
          <View style={styles.chatBadge}>
            <Text style={styles.chatBadgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.chatMessages}>
        <Text style={styles.chatPlaceholder}>Select a chat to start messaging</Text>
      </View>
    </View>
  );

  const renderProfile = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={40} color="#667eea" />
        </View>
        <Text style={styles.profileName}>{currentUser?.username}</Text>
        <Text style={styles.profileEmail}>{currentUser?.email}</Text>
        
        <View style={styles.profileInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role:</Text>
            <Text style={styles.infoValue}>{currentUser?.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ban Level:</Text>
            <Text style={styles.infoValue}>{currentUser?.banLevel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Wallet:</Text>
            <Text style={styles.infoValue}>${currentUser?.wallet.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return renderDashboard();
      case 'inventory':
        return renderInventory();
      case 'chat':
        return renderChat();
      case 'profile':
        return renderProfile();
      default:
        return renderDashboard();
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loginContainer}
        >
          <View style={styles.loginContent}>
            <Ionicons name="cube" size={80} color="white" />
            <Text style={styles.loginTitle}>Inventory System</Text>
            <Text style={styles.loginSubtitle}>Distributed P2P Platform</Text>
            
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Demo Login</Text>
            </TouchableOpacity>
            
            <Text style={styles.loginNote}>
              This is a demo app. Click "Demo Login" to explore features.
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {renderContent()}
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'dashboard' && styles.navItemActive]}
          onPress={() => setCurrentTab('dashboard')}
        >
          <Ionicons 
            name="home-outline" 
            size={24} 
            color={currentTab === 'dashboard' ? '#667eea' : '#6b7280'} 
          />
          <Text style={[styles.navText, currentTab === 'dashboard' && styles.navTextActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'inventory' && styles.navItemActive]}
          onPress={() => setCurrentTab('inventory')}
        >
          <Ionicons 
            name="cube-outline" 
            size={24} 
            color={currentTab === 'inventory' ? '#667eea' : '#6b7280'} 
          />
          <Text style={[styles.navText, currentTab === 'inventory' && styles.navTextActive]}>
            Inventory
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'chat' && styles.navItemActive]}
          onPress={() => setCurrentTab('chat')}
        >
          <Ionicons 
            name="chatbubbles-outline" 
            size={24} 
            color={currentTab === 'chat' ? '#667eea' : '#6b7280'} 
          />
          <Text style={[styles.navText, currentTab === 'chat' && styles.navTextActive]}>
            Chat
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navItem, currentTab === 'profile' && styles.navItemActive]}
          onPress={() => setCurrentTab('profile')}
        >
          <Ionicons 
            name="person-outline" 
            size={24} 
            color={currentTab === 'profile' ? '#667eea' : '#6b7280'} 
          />
          <Text style={[styles.navText, currentTab === 'profile' && styles.navTextActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginContent: {
    alignItems: 'center',
    padding: 20,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  loginSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
    marginBottom: 40,
  },
  loginButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 20,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#667eea',
  },
  loginNote: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 14,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 5,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 15,
  },
  toggleContainer: {
    gap: 15,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1f2937',
  },
  toggle: {
    width: 50,
    height: 24,
    backgroundColor: '#d1d5db',
    borderRadius: 12,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#10b981',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginLeft: 0,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  itemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
    marginTop: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  statusAvailable: {
    backgroundColor: '#d1fae5',
  },
  statusHeld: {
    backgroundColor: '#fef3c7',
  },
  statusSold: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  actionButton: {
    padding: 5,
  },
  chatContainer: {
    padding: 20,
  },
  chatTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatTabText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#1f2937',
  },
  chatBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chatBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  chatMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  chatPlaceholder: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  profileEmail: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 5,
  },
  profileInfo: {
    width: '100%',
    marginTop: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingBottom: 20,
    paddingTop: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navItemActive: {
    // Active state styling
  },
  navText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  navTextActive: {
    color: '#667eea',
    fontWeight: '600',
  },
});
