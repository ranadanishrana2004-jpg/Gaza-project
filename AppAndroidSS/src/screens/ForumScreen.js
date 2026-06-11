import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Modal } from 'react-native';
import { useTheme, IconButton, Avatar, Appbar } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import io from 'socket.io-client';
import api from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

// IMPORTANT: update this to match your actual backend URL in production
const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme as useAppTheme } from '../context/ThemeContext';
import MainLayout from '../components/ui/MainLayout';
import { useWindowDimensions } from 'react-native';

const ForumScreen = ({ route, navigation }) => {
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  
  const { user, logout } = useAuth();
  
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [channelForm, setChannelForm] = useState({ name: '', description: '', adminOnly: false });

  const isAdmin = user?.role === 'instructor' || user?.role === 'superadmin';

  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  const handleCreateChannel = async () => {
    if (!channelForm.name.trim()) {
      Toast.show({ type: 'error', text1: 'Channel name is required' });
      return;
    }
    try {
      setCreating(true);
      await api.post('/forum/channels', channelForm);
      Toast.show({ type: 'success', text1: 'Channel created' });
      setChannelForm({ name: '', description: '', adminOnly: false });
      setShowCreateModal(false);
      fetchChannels();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to create channel' });
    } finally {
      setCreating(false);
    }
  };

  const getSidebarItems = (role) => {
    if (role === 'sponsor') {
      return [
        { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'SponsorDashboard' },
        { label: 'Messages', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
      ];
    }
    if (role === 'instructor' || role === 'superadmin') {
      return [
        { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
        { label: 'Skill Categories', icon: 'layers-outline', iconActive: 'layers', route: 'CategoryManagement' },
        { label: 'Manage Courses', icon: 'book-outline', iconActive: 'book', route: 'Courses' },
        { label: 'Students', icon: 'people-outline', iconActive: 'people', route: 'Students' },
        { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'CertificateManagement' },
        { label: 'Course Feedback', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Feedback' },
        { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
        { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
      ];
    }
    return [
      { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
      { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
      { label: 'My Learning', icon: 'school-outline', iconActive: 'school', route: 'EnrolledCourses' },
      { label: 'AI Assistant', icon: 'sparkles-outline', iconActive: 'sparkles', route: 'AITutor' },
      { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'Certificates' },
      { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
      { label: 'Library', icon: 'book-outline', iconActive: 'book', route: 'Library' },
      { label: 'Forum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
    ];
  };

  useEffect(() => {
    fetchChannels();
    
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });
    
    socketRef.current.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const fetchedChannels = await api.get('/forum/channels');
      setChannels(fetchedChannels);

      // Auto-join direct message if routed from Sponsor Dashboard
      const directStudentId = route?.params?.directStudentId;
      if (directStudentId) {
        const directChannel = fetchedChannels.find(
          ch => ch.type === 'direct' && 
                (ch.directUserId1 === directStudentId || ch.directUserId2 === directStudentId)
        );
        if (directChannel) {
          handleJoinChannel(directChannel);
        }
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinChannel = async (channel) => {
    if (activeChannel) {
      socketRef.current.emit('leaveChannel', activeChannel.id);
    }
    setActiveChannel(channel);
    socketRef.current.emit('joinChannel', channel.id);
    
    try {
      const res = await api.get(`/forum/channels/${channel.id}/messages`);
      setMessages(res);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeChannel) return;
    
    socketRef.current.emit('sendMessage', {
      channelId: activeChannel.id,
      senderId: user.id,
      content: inputText.trim()
    });
    
    setInputText('');
  };

  const renderChannel = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.channelItem, 
        { backgroundColor: activeChannel?.id === item.id ? theme.colors.primary + '20' : theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }
      ]}
      onPress={() => handleJoinChannel(item)}
    >
      <View style={[styles.hashIcon, { backgroundColor: item.type === 'direct' ? '#10B981' : theme.colors.primary }]}>
        {item.type === 'direct' ? (
           <Icon name="account" size={24} color="#fff" />
        ) : (
           <Text style={styles.hashText}>#</Text>
        )}
      </View>
      <View style={styles.channelTextContainer}>
        <Text style={[styles.channelName, { color: theme.colors.textPrimary }]}>{item.name}</Text>
        {item.description && (
          <Text style={[styles.channelDesc, { color: theme.colors.textSecondary }]} numberOfLines={1}>
            {item.description}
          </Text>
        )}
      </View>
      {item.adminOnly && (
        <IconButton icon="shield" size={16} iconColor={theme.colors.error} />
      )}
      <TouchableOpacity 
        style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]} 
        onPress={() => handleJoinChannel(item)}
        activeOpacity={0.8}
      >
        <View style={styles.btnGradient}>
          <Text style={styles.btnText}>OPEN</Text>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === user.id;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && (
          <Avatar.Text size={36} label={item.sender?.name?.charAt(0) || 'U'} style={styles.avatar} color="#fff" />
        )}
        <View style={[styles.messageBubble, { 
          backgroundColor: isMe ? theme.colors.primary : theme.colors.card,
          borderBottomRightRadius: isMe ? 4 : 16,
          borderBottomLeftRadius: isMe ? 16 : 4,
          borderWidth: isMe ? 0 : 1,
          borderColor: theme.colors.border
        }]}>
          {!isMe && <Text style={[styles.senderName, { color: theme.colors.primary }]}>{item.sender?.name}</Text>}
          <Text style={[styles.messageContent, { color: isMe ? '#fff' : theme.colors.textPrimary }]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  if (loading && channels.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={getSidebarItems(user?.role)}
      activeRoute="Forum"
      onNavigate={(name) => navigation.navigate(name)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
      showBack={true}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      {activeChannel ? (
        // Chat View
        <View style={styles.chatContainer}>
          <View style={[styles.chatHeader, { backgroundColor: theme.colors.surface, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveChannel(null)}>
              <Icon name="arrow-left" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
               <Text style={[styles.chatHeaderTitle, { color: theme.colors.textPrimary }]}>
                 {activeChannel.type === 'direct' ? '' : '# '}
                 {activeChannel.name}
               </Text>
               <Text style={[styles.chatHeaderSub, { color: theme.colors.textSecondary }]}>{activeChannel.description}</Text>
            </View>
          </View>
          
          <LinearGradient
            colors={[theme.colors.background, isDark ? '#0B1F33' : '#EFE8DA']}
            style={styles.messagesContainer}
          >
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesList}
            />
          </LinearGradient>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.inputContainer, { backgroundColor: theme.colors.surface, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.textPrimary }]}
              placeholder="Message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <IconButton 
              icon="send-circle" 
              size={40} 
              iconColor={inputText.trim() ? theme.colors.primary : theme.colors.textMuted} 
              onPress={handleSendMessage} 
              disabled={!inputText.trim()}
            />
          </KeyboardAvoidingView>
        </View>
      ) : (
        // Channels View
        <View style={styles.channelsContainer}>
          <View style={[styles.pageHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Discussion Forum</Text>
              <Text style={{ color: theme.colors.textSecondary }}>Connect with the community</Text>
            </View>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.newChannelBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.85}
              >
                <Icon name="plus" size={18} color="#fff" />
                <Text style={styles.newChannelBtnText}>New Channel</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <FlatList
            data={channels}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderChannel}
            contentContainerStyle={styles.channelList}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.textSecondary }}>
                No channels available.
              </Text>
            }
          />
          </View>
        )}

        {/* Create Channel Modal (admins) */}
        <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.createModal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Text style={[styles.createTitle, { color: theme.colors.textPrimary }]}>Create Channel</Text>
              <TextInput
                style={[styles.createInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                placeholder="Channel name" placeholderTextColor={theme.colors.textSecondary}
                value={channelForm.name} onChangeText={t => setChannelForm({ ...channelForm, name: t })}
              />
              <TextInput
                style={[styles.createInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                placeholder="Description (optional)" placeholderTextColor={theme.colors.textSecondary}
                value={channelForm.description} onChangeText={t => setChannelForm({ ...channelForm, description: t })}
              />
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 }}
                onPress={() => setChannelForm({ ...channelForm, adminOnly: !channelForm.adminOnly })}
              >
                <View style={[styles.checkbox, channelForm.adminOnly && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
                  {channelForm.adminOnly && <Icon name="check" size={12} color="#fff" />}
                </View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Staff-only channel (announcements)</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={[styles.createCancelBtn, { borderColor: theme.colors.border }]} onPress={() => setShowCreateModal(false)}>
                  <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.createSubmitBtn, { backgroundColor: theme.colors.primary, opacity: creating ? 0.7 : 1 }]} onPress={handleCreateChannel} disabled={creating}>
                  {creating ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700' }}>Create</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  channelsContainer: { flex: 1 },
  pageHeader: {
    padding: 24,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  newChannelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  newChannelBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  createModal: { width: '100%', maxWidth: 440, borderRadius: 16, borderWidth: 1, padding: 20, gap: 12 },
  createTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  createInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(150,150,150,0.5)', justifyContent: 'center', alignItems: 'center' },
  createCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  createSubmitBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
  channelList: { padding: 16 },
  channelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  hashIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  hashText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  channelTextContainer: { flex: 1 },
  channelName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  channelDesc: { fontSize: 14 },
  actionBtn: {
    marginLeft: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  
  chatContainer: { flex: 1 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  chatHeaderTitle: { fontSize: 18, fontWeight: 'bold' },
  chatHeaderSub: { fontSize: 13 },
  backButton: { marginRight: 16, padding: 8 },
  messagesContainer: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 20 },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  avatar: { marginRight: 8, marginBottom: 4 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    elevation: 1,
  },
  senderName: { fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  messageContent: { fontSize: 15, lineHeight: 20 },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 16,
  },
});

export default ForumScreen;
