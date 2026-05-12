import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MainLayout from '../../components/ui/MainLayout';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { resolveFileUrl } from '../../utils/urlHelpers';

const LearningScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const { courseId, topicId } = route.params;
  const { courses, checkEnrollment, fetchCourses, enrollments, fetchMyEnrollments, updateTopicProgress } = useData();

  const course = courses.find((item) => item.id === courseId);
  const topic = course?.topics?.find((item) => item.id === topicId);
  const topicMaterials = topic?.materials || [];
  const isTablet = width >= 900;

  const sidebarItems = [
    { label: 'Dashboard', icon: 'grid-outline', iconActive: 'grid', route: 'Dashboard' },
    { label: 'Browse Courses', icon: 'library-outline', iconActive: 'library', route: 'Courses' },
    { label: 'My Learning', icon: 'school-outline', iconActive: 'school', route: 'EnrolledCourses' },
    { label: 'AI Assistant', icon: 'sparkles-outline', iconActive: 'sparkles', route: 'AITutor' },
    { label: 'Certificates', icon: 'ribbon-outline', iconActive: 'ribbon', route: 'Certificates' },
    { label: 'Reminders', icon: 'checkmark-circle-outline', iconActive: 'checkmark-circle', route: 'Todo' },
  ];

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(true);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const enrollmentProgress = useMemo(() => {
    const enrollment = enrollments.find((item) => (
      String(item.courseId) === String(courseId) || String(item.course?.id) === String(courseId)
    ));
    return Math.round(enrollment?.progress ?? 0);
  }, [courseId, enrollments]);

  useEffect(() => {
    const verifyEnrollment = async () => {
      setEnrollmentLoading(true);
      const result = await checkEnrollment(courseId);
      if (result.success) {
        setIsEnrolled(result.enrolled);
        if (!result.enrolled) {
          Toast.show({ type: 'error', text1: 'Not Enrolled', text2: 'You need to enroll in this course first.' });
          navigation.navigate('CourseDetail', { courseId });
        }
      }
      setEnrollmentLoading(false);
    };

    verifyEnrollment();
    fetchCourses();
  }, [checkEnrollment, courseId, fetchCourses, navigation]);

  useEffect(() => {
    setSelectedMaterial(topicMaterials[0] || null);
  }, [topicId, topicMaterials]);

  const openMaterial = (material) => {
    const url = resolveFileUrl(material.uri);
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
      return;
    }
    Linking.openURL(url).catch(() => {});
  };

  const getYouTubeEmbedUrl = (url) => {
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=0&rel=0`;
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=0&rel=0`;
    return url;
  };

  const getGoogleEmbedUrl = (url) => {
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
    if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
    if (url.includes('docs.google.com')) {
      return url.replace(/\/(edit|view|pub)(\?.*)?$/, '/preview');
    }
    return url;
  };

  const getEmbedUrl = (url) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return getYouTubeEmbedUrl(url);
    }
    if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
      return getGoogleEmbedUrl(url);
    }
    return url;
  };

  const handleCompleteTopic = async () => {
    setShowCompleteDialog(false);
    const result = await updateTopicProgress({ courseId, topicId, completed: true });
    if (!result.success) {
      Toast.show({ type: 'error', text1: 'Error', text2: result.error || 'Failed to update topic progress' });
      return;
    }

    await Promise.all([fetchCourses(), fetchMyEnrollments()]);
    Toast.show({ type: 'success', text1: 'Success', text2: 'Topic completed' });
    setTimeout(() => navigation.goBack(), 1000);
  };

  const renderMaterialViewer = (material) => {
    if (!material) {
      return (
        <View style={styles.viewerEmpty}>
          <Icon name="folder-open-outline" size={46} color="rgba(255,255,255,0.35)" />
          <Text style={styles.viewerEmptyText}>No materials added to this topic yet.</Text>
        </View>
      );
    }

    const resolvedUri = resolveFileUrl(material.uri);
    if (material.type === 'image') {
      return <Image source={{ uri: resolvedUri }} resizeMode="contain" style={styles.viewerImage} />;
    }

    if (material.type === 'link' && Platform.OS === 'web') {
      return (
        <View style={styles.embedWrap}>
          <iframe src={getEmbedUrl(material.uri)} title={material.title || 'Material'} style={{ width: '100%', height: '100%', border: 'none' }} allowFullScreen />
        </View>
      );
    }

    return (
      <View style={styles.linkFallback}>
        <Icon name="document-text-outline" size={42} color="#fff" />
        <Text style={styles.linkFallbackTitle}>{material.title || 'Open Material'}</Text>
        <Text style={styles.linkFallbackSubtitle}>Open this resource in a new tab to continue learning.</Text>
        <TouchableOpacity style={styles.openButton} onPress={() => openMaterial(material)}>
          <Icon name="open-outline" size={18} color="#fff" />
          <Text style={styles.openButtonText}>Open Resource</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (!course || !topic) {
    return (
      <MainLayout showSidebar={false} showHeader={true} showBack={true}>
        <View style={styles.centered}>
          <EmptyState icon="alert-circle-outline" title="Topic not found" subtitle="The requested topic does not exist." />
        </View>
      </MainLayout>
    );
  }

  if (enrollmentLoading) {
    return (
      <MainLayout showSidebar={false} showHeader={true} showBack={true}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Checking enrollment...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!isEnrolled) {
    return (
      <MainLayout showSidebar={false} showHeader={true} showBack={true}>
        <View style={styles.centered}>
          <EmptyState icon="lock-closed-outline" title="Not Enrolled" subtitle="Enroll in this course to access the lecture materials." />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout showSidebar={true} sidebarItems={sidebarItems} activeRoute="EnrolledCourses" onNavigate={(name) => navigation.navigate(name)}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.courseName, { color: theme.colors.textPrimary }]}>{course.name}</Text>
              <Text style={[styles.topicName, { color: theme.colors.textSecondary }]}>{topic.title}</Text>
            </View>
            <TouchableOpacity style={[styles.completeButton, { backgroundColor: theme.colors.primary }]} onPress={() => setShowCompleteDialog(true)}>
              <Icon name="checkmark-done" size={16} color="#fff" />
              <Text style={styles.completeButtonText}>Mark Complete</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>Course progress</Text>
            <Text style={[styles.progressValue, { color: theme.colors.primary }]}>{enrollmentProgress}%</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View style={[styles.progressFill, { width: `${enrollmentProgress}%`, backgroundColor: theme.colors.primary }]} />
          </View>
        </View>

        <View style={[styles.infoPanel, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '25' }]}>
          <MaterialIcon name="book-open-page-variant-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.infoPanelText, { color: theme.colors.primary }]}>
            This course uses manually uploaded lecture materials only. Review the resources below, then complete the topic and take its quiz.
          </Text>
        </View>

        <View style={[styles.layoutRow, !isTablet && styles.layoutColumn]}>
          <View style={[styles.sidebarCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.sidebarTitle, { color: theme.colors.textPrimary }]}>Course Topics</Text>
            <View style={styles.topicList}>
              {course.topics?.map((item) => {
                const isCurrent = String(item.id) === String(topicId);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.topicRow,
                      {
                        backgroundColor: isCurrent ? theme.colors.primary + '10' : 'transparent',
                        borderColor: isCurrent ? theme.colors.primary + '30' : 'transparent',
                      },
                    ]}
                    onPress={() => navigation.replace('Learning', { courseId, topicId: item.id })}
                  >
                    <View style={[styles.topicDot, { backgroundColor: item.completed ? '#10B981' : theme.colors.primary }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.topicRowTitle, { color: theme.colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.topicRowMeta, { color: theme.colors.textTertiary }]}>{item.materials?.length || 0} materials</Text>
                    </View>
                    {item.completed ? <Icon name="checkmark-circle" size={18} color="#10B981" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.viewerCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.viewerHeader}>
              <Text style={[styles.viewerTitle, { color: theme.colors.textPrimary }]}>Lecture Materials</Text>
              {selectedMaterial ? (
                <TouchableOpacity style={styles.externalLink} onPress={() => openMaterial(selectedMaterial)}>
                  <Icon name="open-outline" size={16} color="#fff" />
                  <Text style={styles.externalLinkText}>Open</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {topicMaterials.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.materialTabs}>
                {topicMaterials.map((material, index) => {
                  const isSelected = selectedMaterial?.uri === material.uri;
                  return (
                    <TouchableOpacity
                      key={`${material.uri}-${index}`}
                      style={[
                        styles.materialTab,
                        {
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedMaterial(material)}
                    >
                      <Icon name="document-outline" size={14} color={isSelected ? '#fff' : theme.colors.textSecondary} />
                      <Text style={{ color: isSelected ? '#fff' : theme.colors.textSecondary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}>
                        {material.title || material.fileName || `Material ${index + 1}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : null}

            <View style={styles.viewerBody}>
              {renderMaterialViewer(selectedMaterial)}
            </View>
          </View>
        </View>

        <View style={styles.bottomActions}>
          <TouchableOpacity style={[styles.secondaryAction, { borderColor: theme.colors.border }]} onPress={() => navigation.navigate('Quiz', { courseId, topicId })}>
            <Icon name="help-circle-outline" size={18} color={theme.colors.textPrimary} />
            <Text style={[styles.secondaryActionText, { color: theme.colors.textPrimary }]}>Take Topic Quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.primaryAction, { backgroundColor: theme.colors.primary }]} onPress={() => setShowCompleteDialog(true)}>
            <Icon name="checkmark-done" size={18} color="#fff" />
            <Text style={styles.primaryActionText}>Complete Topic</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showCompleteDialog}
        title="Complete Topic"
        message="Mark this topic as completed and update your course progress?"
        confirmText="Complete"
        onConfirm={handleCompleteTopic}
        onCancel={() => setShowCompleteDialog(false)}
      />
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { padding: 20, paddingBottom: 40, gap: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 10, fontSize: 15 },
  headerCard: { borderWidth: 1, borderRadius: 18, padding: 18 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconButton: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  courseName: { fontSize: 22, fontWeight: '800' },
  topicName: { fontSize: 14, marginTop: 2 },
  completeButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  completeButtonText: { color: '#fff', fontWeight: '700' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13 },
  progressValue: { fontSize: 13, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  infoPanel: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 14, borderWidth: 1 },
  infoPanelText: { flex: 1, fontSize: 13, lineHeight: 20 },
  layoutRow: { flexDirection: 'row', gap: 16 },
  layoutColumn: { flexDirection: 'column' },
  sidebarCard: { width: Platform.OS === 'web' ? 320 : '100%', borderWidth: 1, borderRadius: 18, padding: 16 },
  viewerCard: { flex: 1, minHeight: 520, borderWidth: 1, borderRadius: 18, padding: 16 },
  sidebarTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  topicList: { gap: 10 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  topicDot: { width: 10, height: 10, borderRadius: 5 },
  topicRowTitle: { fontSize: 14, fontWeight: '700' },
  topicRowMeta: { fontSize: 12, marginTop: 2 },
  viewerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  viewerTitle: { fontSize: 16, fontWeight: '700' },
  externalLink: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0F766E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  externalLinkText: { color: '#fff', fontWeight: '700' },
  materialTabs: { gap: 8, paddingBottom: 12 },
  materialTab: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, maxWidth: 220 },
  viewerBody: { flex: 1, minHeight: 420, borderRadius: 16, overflow: 'hidden', backgroundColor: '#0E1726' },
  viewerEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 40 },
  viewerEmptyText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center' },
  viewerImage: { width: '100%', height: '100%' },
  embedWrap: { flex: 1 },
  linkFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 36 },
  linkFallbackTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  linkFallbackSubtitle: { color: 'rgba(255,255,255,0.65)', fontSize: 14, textAlign: 'center', lineHeight: 21 },
  openButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0F766E', paddingHorizontal: 22, paddingVertical: 14, borderRadius: 999 },
  openButtonText: { color: '#fff', fontWeight: '800' },
  bottomActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  secondaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingVertical: 14, backgroundColor: '#fff' },
  secondaryActionText: { fontWeight: '700' },
  primaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14 },
  primaryActionText: { color: '#fff', fontWeight: '800' },
});

export default LearningScreen;
