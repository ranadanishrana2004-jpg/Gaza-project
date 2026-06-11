import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import MainLayout from '../../components/ui/MainLayout';
import apiClient from '../../services/apiClient';

const SPONSOR_NAV = [
  { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'SponsorDashboard' },
  { label: 'Messages', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
];

const SponsorDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  const [students, setStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sponsoredRes, availableRes] = await Promise.all([
        apiClient.get('/sponsorships/my-students'),
        apiClient.get('/sponsorships/available-students')
      ]);
      setStudents(Array.isArray(sponsoredRes) ? sponsoredRes : []);
      setAvailableStudents(Array.isArray(availableRes) ? availableRes : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSponsor = async (studentId) => {
    try {
      await apiClient.post(`/sponsorships/sponsor/${studentId}`);
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error sponsoring student:', error);
      alert('Failed to sponsor student');
    }
  };

  return (
    <MainLayout
      showSidebar
      sidebarItems={SPONSOR_NAV}
      activeRoute="SponsorDashboard"
      onNavigate={(r) => navigation.navigate(r)}
      userInfo={user}
      onLogout={logout}
      onSettings={() => navigation.navigate('Settings')}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Sponsor Dashboard</Text>
          <Text style={{ color: theme.colors.textSecondary, fontSize: 15, marginTop: 8 }}>
            Welcome back, {user?.name}. Here is the progress of your sponsored students.
          </Text>
        </View>

        <View style={[styles.statsRow, isMobile && { flexDirection: 'column' }]}>
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{students.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Active Students</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            <Text style={[styles.statNum, { color: '#F68B3C' }]}>{availableStudents.length}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Students Seeking Support</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Your Students</Text>
        
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F68B3C" />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            {students.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 20 }}>You do not have any sponsored students yet.</Text>
            ) : (
              students.map((st, i) => (
                <View key={st.id} style={[styles.studentRow, i !== students.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }, isMobile && { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.avatar, { backgroundColor: '#F68B3C20' }]}>
                      <Icon name="person" size={20} color="#F68B3C" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.studentName, { color: theme.colors.textPrimary }]}>{st.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Icon name="location-outline" size={12} color={theme.colors.textSecondary} />
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginLeft: 4 }}>{st.location || 'Unknown'}</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginHorizontal: 6 }}>•</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>{st.isWarZone ? 'Conflict Zone' : 'Standard'}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[styles.actionRow, isMobile && { marginTop: 16, width: '100%', justifyContent: 'space-between' }]}>
                    <TouchableOpacity 
                      style={[styles.btn, { backgroundColor: 'rgba(99,102,241,0.1)' }]}
                      onPress={() => navigation.navigate('StudentPublicProfile', { studentId: st.id })}
                    >
                      <Icon name="analytics-outline" size={16} color="#6366F1" />
                      <Text style={[styles.btnText, { color: '#6366F1' }]}>View Progress</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.btn, { backgroundColor: 'rgba(246,139,60,0.1)' }]}
                      onPress={() => navigation.navigate('Forum', { directStudentId: st.id })}
                    >
                      <Icon name="chatbubble-ellipses-outline" size={16} color="#F68B3C" />
                      <Text style={[styles.btnText, { color: '#F68B3C' }]}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, marginTop: 40 }]}>Available Students to Sponsor</Text>
        
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
            {availableStudents.length === 0 ? (
              <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 20 }}>There are no students looking for sponsorship right now.</Text>
            ) : (
              availableStudents.map((st, i) => (
                <View key={st.id} style={[styles.studentRow, i !== availableStudents.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }, isMobile && { flexDirection: 'column', alignItems: 'flex-start' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.avatar, { backgroundColor: '#10B98120' }]}>
                      <Icon name="person" size={20} color="#10B981" />
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.studentName, { color: theme.colors.textPrimary }]}>{st.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Icon name="location-outline" size={12} color={theme.colors.textSecondary} />
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginLeft: 4 }}>{st.location || 'Unknown'}</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginHorizontal: 6 }}>•</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 12, color: st.isWarZone ? '#EF4444' : theme.colors.textSecondary }}>
                          {st.isWarZone ? 'Conflict Zone' : 'Standard'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={[styles.actionRow, isMobile && { marginTop: 16, width: '100%', justifyContent: 'space-between' }]}>
                    <TouchableOpacity 
                      style={[styles.btn, { backgroundColor: 'rgba(99,102,241,0.1)' }]}
                      onPress={() => navigation.navigate('StudentPublicProfile', { studentId: st.id })}
                    >
                      <Icon name="person-outline" size={16} color="#6366F1" />
                      <Text style={[styles.btnText, { color: '#6366F1' }]}>View Profile</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.btn, { backgroundColor: '#10B981' }]}
                      onPress={() => handleSponsor(st.id)}
                    >
                      <Icon name="heart-outline" size={16} color="#FFFFFF" />
                      <Text style={[styles.btnText, { color: '#FFFFFF' }]}>Sponsor</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60, maxWidth: 1000, width: '100%', alignSelf: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 24, alignItems: 'center' },
  statNum: { fontSize: 36, fontWeight: '900', marginBottom: 8 },
  statLabel: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 8 },
  studentRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  studentName: { fontSize: 16, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnText: { fontSize: 13, fontWeight: '700' }
});

export default SponsorDashboard;
