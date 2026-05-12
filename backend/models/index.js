const User = require('./User');
const Category = require('./Category');
const Course = require('./Course');
const Topic = require('./Topic');
const Material = require('./Material');
const Feedback = require('./Feedback');
const Enrollment = require('./Enrollment');
const Progress = require('./Progress');
const Quiz = require('./Quiz');
const QuizResult = require('./QuizResult');
const Certificate = require('./Certificate');
const CertificateTemplate = require('./CertificateTemplate');
const TemplateCourse = require('./TemplateCourse');
const Notification = require('./Notification');
const AIChatSession = require('./AIChatSession');
const AIChatMessage = require('./AIChatMessage');
const DailyActivity = require('./DailyActivity');
const Todo = require('./Todo');
const { sequelize } = require('../config/database');

User.hasMany(Course, { foreignKey: 'userId', as: 'courses', onDelete: 'CASCADE' });
Course.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });

Topic.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Course.hasMany(Topic, { foreignKey: 'courseId', as: 'topics', onDelete: 'CASCADE' });

Material.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Course.hasMany(Material, { foreignKey: 'courseId', as: 'materials', onDelete: 'CASCADE' });
Material.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic', onDelete: 'CASCADE' });
Topic.hasMany(Material, { foreignKey: 'topicId', as: 'materials', onDelete: 'CASCADE' });

Feedback.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Course.hasMany(Feedback, { foreignKey: 'courseId', as: 'feedbacks', onDelete: 'CASCADE' });
Feedback.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic', onDelete: 'CASCADE' });
Topic.hasMany(Feedback, { foreignKey: 'topicId', as: 'feedbacks', onDelete: 'CASCADE' });
Feedback.belongsTo(User, { foreignKey: 'expertId', as: 'expert', onDelete: 'SET NULL' });
User.hasMany(Feedback, { foreignKey: 'expertId', as: 'submittedFeedbacks', onDelete: 'SET NULL' });

User.hasMany(Enrollment, { foreignKey: 'userId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });

User.hasMany(Progress, { foreignKey: 'userId', as: 'progress', onDelete: 'CASCADE' });
Progress.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Course.hasMany(Progress, { foreignKey: 'courseId', as: 'progress', onDelete: 'CASCADE' });
Progress.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Topic.hasMany(Progress, { foreignKey: 'topicId', as: 'progress', onDelete: 'CASCADE' });
Progress.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic', onDelete: 'CASCADE' });

Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });
Topic.hasMany(Quiz, { foreignKey: 'topicId', as: 'quizzes', onDelete: 'CASCADE' });
Quiz.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic', onDelete: 'SET NULL' });

User.hasMany(QuizResult, { foreignKey: 'userId', as: 'quizResults', onDelete: 'CASCADE' });
QuizResult.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Quiz.hasMany(QuizResult, { foreignKey: 'quizId', as: 'results', onDelete: 'CASCADE' });
QuizResult.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz', onDelete: 'CASCADE' });
Course.hasMany(QuizResult, { foreignKey: 'courseId', as: 'quizResults', onDelete: 'CASCADE' });
QuizResult.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });

User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
Course.hasMany(Certificate, { foreignKey: 'courseId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course', onDelete: 'CASCADE' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

User.hasMany(CertificateTemplate, { foreignKey: 'createdBy', as: 'certificateTemplates', onDelete: 'SET NULL' });
CertificateTemplate.belongsTo(User, { foreignKey: 'createdBy', as: 'creator', onDelete: 'SET NULL' });
CertificateTemplate.belongsToMany(Course, {
  through: TemplateCourse,
  foreignKey: 'templateId',
  otherKey: 'courseId',
  as: 'courses',
});
Course.belongsToMany(CertificateTemplate, {
  through: TemplateCourse,
  foreignKey: 'courseId',
  otherKey: 'templateId',
  as: 'certificateTemplates',
});
TemplateCourse.belongsTo(CertificateTemplate, { foreignKey: 'templateId', as: 'template' });
TemplateCourse.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
CertificateTemplate.hasMany(TemplateCourse, { foreignKey: 'templateId', as: 'templateCourses' });
Course.hasMany(TemplateCourse, { foreignKey: 'courseId', as: 'templateCourses' });

User.hasMany(AIChatSession, { foreignKey: 'userId', as: 'chatSessions', onDelete: 'CASCADE' });
AIChatSession.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
AIChatSession.hasMany(AIChatMessage, { foreignKey: 'sessionId', as: 'messages', onDelete: 'CASCADE' });
AIChatMessage.belongsTo(AIChatSession, { foreignKey: 'sessionId', as: 'session', onDelete: 'CASCADE' });

User.hasMany(Todo, { foreignKey: 'userId', as: 'todos', onDelete: 'CASCADE' });
Todo.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasMany(DailyActivity, { foreignKey: 'userId', as: 'dailyActivities', onDelete: 'CASCADE' });
DailyActivity.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });

module.exports = {
  sequelize,
  User,
  Category,
  Course,
  Topic,
  Material,
  Feedback,
  Enrollment,
  Progress,
  Quiz,
  QuizResult,
  Certificate,
  CertificateTemplate,
  TemplateCourse,
  Notification,
  AIChatSession,
  AIChatMessage,
  DailyActivity,
  Todo,
};
