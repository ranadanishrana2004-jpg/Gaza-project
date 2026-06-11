import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, useWindowDimensions, ActivityIndicator, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../components/ui/MainLayout';
import { resolveFileUrl } from '../../utils/urlHelpers';
import apiClient from '../../services/apiClient';

const SPONSOR_NAV = [
  { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'SponsorDashboard' },
  { label: 'Messages', icon: 'chatbubbles-outline', iconActive: 'chatbubbles', route: 'Forum' },
];

const StudentPublicProfileScreen = ({ route, navigation }) => {
  const { theme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;
  const studentId = route.params?.studentId;

  const layoutProps = {
    showSidebar: true,
    sidebarItems: SPONSOR_NAV,
    activeRoute: 'SponsorDashboard',
    onNavigate: (r) => navigation.navigate(r),
    userInfo: user,
    onLogout: logout,
    onSettings: () => navigation.navigate('Settings'),
    showBack: true,
  };

  const [student, setStudent] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/sponsorships/student-profile/${studentId}`);
        const { student: apiStudent, enrollments = [], quizResults = [], stats = {}, uploads: apiUploads = [] } = res || {};

        setUploads(apiUploads);

        // Map API data to UI structure
        setStudent({
          id: apiStudent.id,
          name: apiStudent.name,
          location: apiStudent.location,
          isWarZone: apiStudent.isWarZone,
          profilePicture: apiStudent.profilePicture,
          joinedDate: new Date(apiStudent.createdAt).toLocaleDateString(),
          stats: {
            attendanceDays: stats.attendanceDays || 0,
            coursesCompleted: stats.coursesCompleted || 0,
            averageScore: stats.averageScore || 0,
            uploads: stats.uploadsCount || 0,
          },
          recentActivity: [
            ...enrollments.map(e => ({
              type: 'course',
              title: e.course?.name || 'Course',
              date: e.status,
            })),
            ...quizResults.slice(0, 5).map(q => ({
              type: 'quiz',
              title: q.course?.name ? `Quiz · ${q.course.name}` : 'Quiz',
              date: new Date(q.submittedAt).toLocaleDateString(),
              score: `${q.score}%`,
            })),
          ],
        });
      } catch (error) {
        console.error('Error fetching student profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchProfile();
    }
  }, [studentId]);

  if (loading) {
    return (
      <MainLayout {...layoutProps}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <ActivityIndicator size="large" color="#F68B3C" />
        </View>
      </MainLayout>
    );
  }

  if (!student) {
    return (
      <MainLayout {...layoutProps}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <Text style={{ color: theme.colors.textPrimary, fontSize: 18 }}>Student not found</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout {...layoutProps}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Student Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <View style={[styles.profileHeader, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
            <View style={styles.avatarWrap}>
              {student.profilePicture ? (
                <Image source={{ uri: resolveFileUrl(student.profilePicture) }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: '#F68B3C' }]}>
                  <Text style={styles.avatarInitial}>{student.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <View style={[styles.profileInfo, isMobile && { alignItems: 'center', marginTop: 16 }]}>
              <Text style={[styles.studentName, { color: theme.colors.textPrimary }]}>{student.name}</Text>
              
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                  <Icon name="school-outline" size={14} color="#6366F1" />
                  <Text style={[styles.badgeText, { color: '#6366F1' }]}>Student</Text>
                </View>
                {student.isWarZone && (
                  <View style={[styles.badge, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
                    <Icon name="shield-checkmark-outline" size={14} color="#EF4444" />
                    <Text style={[styles.badgeText, { color: '#EF4444' }]}>War Zone Student</Text>
                  </View>
                )}
              </View>

              <View style={styles.detailRow}>
                <Icon name="location-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary, marginLeft: 6 }}>{student.location || 'Location Not Specified'}</Text>
              </View>
              <View style={[styles.detailRow, { marginTop: 4 }]}>
                <Icon name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={{ color: theme.colors.textSecondary, marginLeft: 6 }}>Joined {student.joinedDate}</Text>
              </View>
            </View>
            
            {/* Direct Message Button (Visible to Sponsor) */}
            <TouchableOpacity 
              style={[styles.messageBtn, isMobile && { width: '100%', marginTop: 20 }]}
              onPress={() => navigation.navigate('Forum', { directStudentId: student.id })}
            >
              <Icon name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
              <Text style={styles.messageBtnText}>Message Student</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, isMobile && { flexDirection: 'column' }]}>
          {[
            { icon: 'calendar-clear', label: 'Attendance', value: `${student.stats.attendanceDays} Days`, color: '#10B981' },
            { icon: 'ribbon', label: 'Courses', value: student.stats.coursesCompleted, color: '#6366F1' },
            { icon: 'analytics', label: 'Avg Score', value: `${student.stats.averageScore}%`, color: '#F59E0B' },
            { icon: 'cloud-upload', label: 'Uploads', value: student.stats.uploads, color: '#EC4899' }
          ].map((stat, i) => (
            <View key={i} style={[styles.statBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={[styles.statIconCircle, { backgroundColor: stat.color + '15' }]}>
                <Icon name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Recent Activity</Text>
        <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          {student.recentActivity.map((act, i) => (
            <View key={i} style={[styles.activityRow, i !== student.recentActivity.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
              <View style={[styles.actIcon, { backgroundColor: act.type === 'course' ? 'rgba(99,102,241,0.1)' : act.type === 'quiz' ? 'rgba(16,185,129,0.1)' : 'rgba(236,72,153,0.1)' }]}>
                <Icon name={act.type === 'course' ? 'play-circle' : act.type === 'quiz' ? 'checkmark-circle' : 'document-text'} size={20} color={act.type === 'course' ? '#6366F1' : act.type === 'quiz' ? '#10B981' : '#EC4899'} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.actTitle, { color: theme.colors.textPrimary }]}>{act.title}</Text>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>{act.date}</Text>
              </View>
              {act.score && (
                <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 14 }}>{act.score}</Text>
              )}
            </View>
          ))}
          {student.recentActivity.length === 0 && (
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 16 }}>No activity yet.</Text>
          )}
        </View>

        {/* Uploaded Documents */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Uploaded Documents</Text>
        <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          {uploads.length === 0 ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', padding: 16 }}>This student has not uploaded any documents yet.</Text>
          ) : (
            uploads.map((up, i) => (
              <TouchableOpacity
                key={up.id}
                style={[styles.activityRow, i !== uploads.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                onPress={() => Linking.openURL(resolveFileUrl(up.fileUrl))}
              >
                <View style={[styles.actIcon, { backgroundColor: 'rgba(236,72,153,0.1)' }]}>
                  <Icon name={up.type === 'image' ? 'image' : up.type === 'certificate' ? 'ribbon' : 'document-text'} size={20} color="#EC4899" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.actTitle, { color: theme.colors.textPrimary }]}>{up.title}</Text>
                  {up.description ? (
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{up.description}</Text>
                  ) : null}
                </View>
                <Icon name="open-outline" size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ))
          )}
        </View>

      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60, maxWidth: 1000, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(150,150,150,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  card: { borderRadius: 16, borderWidth: 1, padding: 24, marginBottom: 24 },
  profileHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarWrap: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#FFFFFF', fontSize: 36, fontWeight: '700' },
  profileInfo: { flex: 1, marginLeft: 20 },
  studentName: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  messageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F68B3C', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, shadowColor: '#F68B3C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  messageBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  statBox: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center' },
  statIconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  actIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actTitle: { fontSize: 15, fontWeight: '600' }
});

export default StudentPublicProfileScreen;
