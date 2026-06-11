import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, ActivityIndicator, useWindowDimensions, Modal, Platform, TextInput } from 'react-native';
import { useTheme as usePaperTheme, Card, IconButton, Button } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import MainLayout from '../components/ui/MainLayout';

const LibraryScreen = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  
  const { user, logout } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', url: '', type: 'link' });

  const isAdmin = user?.role === 'instructor' || user?.role === 'superadmin';

  const handleCreate = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      Toast.show({ type: 'error', text1: 'Title and URL are required' });
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/library', form);
      Toast.show({
        type: 'success',
        text1: 'Resource submitted',
        text2: isAdmin ? 'Published to the library' : 'Pending instructor approval',
      });
      setForm({ title: '', description: '', url: '', type: 'link' });
      setShowAddModal(false);
      fetchLibraryItems();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed to submit' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (item, status) => {
    try {
      await api.put(`/library/${item.id}/approve`, { status });
      fetchLibraryItems();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed' });
    }
  };

  const handleDelete = async (item) => {
    try {
      await api.del(`/library/${item.id}`);
      setItems(prev => prev.filter(i => i.id !== item.id));
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message || 'Failed' });
    }
  };

  const getSidebarItems = (role) => {
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
    fetchLibraryItems();
  }, []);

  const fetchLibraryItems = async () => {
    try {
      const response = await api.get('/library');
      setItems(response);
    } catch (error) {
      console.error('Failed to fetch library items:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLink = (item) => {
    if (Platform.OS === 'web') {
      setPreviewItem(item);
    } else {
      Linking.openURL(item.url);
    }
  };

  const getEmbedUrl = (item) => {
    if (!item) return '';
    if (item.type === 'video' && item.url.includes('youtube.com/watch?v=')) {
      return item.url.replace('watch?v=', 'embed/');
    }
    return item.url;
  };

  const renderItem = ({ item }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderWidth: 1 }]} elevation={0}>
      <LinearGradient
        colors={[`${theme.colors.primary}15`, theme.colors.card]}
        style={styles.cardGradient}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Icon 
              name={item.type === 'pdf' ? 'file-pdf-box' : item.type === 'video' ? 'play-circle' : 'link'} 
              size={40} 
              color={theme.colors.primary} 
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {item.description}
            </Text>
            {user?.role === 'instructor' || user?.role === 'superadmin' ? (
              <Text style={[styles.status, { color: item.status === 'approved' ? theme.colors.success : theme.colors.warning }]}>
                Status: {item.status.toUpperCase()}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isAdmin && item.status === 'pending' && (
              <IconButton icon="check" size={20} iconColor="#10B981" onPress={() => handleApprove(item, 'approved')} />
            )}
            {isAdmin && (
              <IconButton icon="trash-can-outline" size={20} iconColor="#EF4444" onPress={() => handleDelete(item)} />
            )}
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => openLink(item)}
              activeOpacity={0.8}
            >
              <View style={styles.btnGradient}>
                <Text style={styles.btnText}>OPEN</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </LinearGradient>
    </Card>
  );

  return (
    <MainLayout
      showSidebar={true}
      sidebarItems={getSidebarItems(user?.role)}
      activeRoute="Library"
      onNavigate={(name) => navigation.navigate(name)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
      showBack={true}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      
      <View style={[styles.pageHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.pageTitle, { color: theme.colors.textPrimary }]}>Global Library</Text>
          <Text style={{ color: theme.colors.textSecondary }}>Access learning materials anytime, anywhere.</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => setShowAddModal(true)}
          activeOpacity={0.85}
        >
          <Icon name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Add Resource</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          numColumns={1}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="bookshelf" size={60} color={theme.colors.textMuted} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                The library is currently empty.
              </Text>
            </View>
          }
        />
      )}
      
      {/* Document/Video Preview Modal */}
      <Modal visible={!!previewItem} transparent={true} animationType="fade" onRequestClose={() => setPreviewItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
             <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {previewItem?.title}
                </Text>
                <IconButton icon="close" iconColor={theme.colors.textPrimary} size={24} onPress={() => setPreviewItem(null)} />
             </View>
             <View style={styles.modalBody}>
                {Platform.OS === 'web' && previewItem && (
                   <iframe 
                     src={getEmbedUrl(previewItem)} 
                     style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8 }} 
                     allow="autoplay; encrypted-media" 
                     allowFullScreen 
                     title={previewItem.title}
                   />
                )}
             </View>
          </View>
        </View>
      </Modal>

      {/* Add Resource Modal */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.addModalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>Add a Resource</Text>
              <IconButton icon="close" iconColor={theme.colors.textPrimary} size={24} onPress={() => setShowAddModal(false)} />
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <TextInput
                style={[styles.addInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                placeholder="Title" placeholderTextColor={theme.colors.textSecondary}
                value={form.title} onChangeText={t => setForm({ ...form, title: t })}
              />
              <TextInput
                style={[styles.addInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                placeholder="Description (optional)" placeholderTextColor={theme.colors.textSecondary}
                value={form.description} onChangeText={t => setForm({ ...form, description: t })}
              />
              <TextInput
                style={[styles.addInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
                placeholder="URL (link, PDF or YouTube)" placeholderTextColor={theme.colors.textSecondary}
                value={form.url} onChangeText={t => setForm({ ...form, url: t })} autoCapitalize="none"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['link', 'pdf', 'video'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, { borderColor: form.type === t ? theme.colors.primary : theme.colors.border, backgroundColor: form.type === t ? theme.colors.primary + '15' : 'transparent' }]}
                    onPress={() => setForm({ ...form, type: t })}
                  >
                    <Text style={{ color: form.type === t ? theme.colors.primary : theme.colors.textSecondary, fontWeight: '600', fontSize: 13 }}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {!isAdmin && (
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                  Your submission will be reviewed by an instructor before appearing in the library.
                </Text>
              )}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: theme.colors.primary, opacity: submitting ? 0.7 : 1 }]}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.submitBtnText}>Submit Resource</Text>}
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
  container: {
    flex: 1,
  },
  pageHeader: {
    padding: 24,
    paddingTop: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  iconContainer: {
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 10,
    borderRadius: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 6,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionBtn: {
    marginLeft: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 900,
    height: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  modalBody: {
    flex: 1,
    padding: 10,
  },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addModalContent: { width: '100%', maxWidth: 460, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  addInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  typeChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  submitBtn: { marginTop: 4, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default LibraryScreen;
