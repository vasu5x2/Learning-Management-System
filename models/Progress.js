const mongoose = require('mongoose');

const lessonProgressSchema = new mongoose.Schema({
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  watchTime: {
    type: Number, // in seconds
    default: 0
  }
});

const quizAttemptSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    selectedOption: {
      type: Number,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  isPassed: {
    type: Boolean,
    default: false
  },
  attemptedAt: {
    type: Date,
    default: Date.now
  }
});

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  lessonProgress: [lessonProgressSchema],
  quizAttempts: [quizAttemptSchema],
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create compound index for user and course
progressSchema.index({ user: 1, course: 1 }, { unique: true });

// Method to calculate overall progress
progressSchema.methods.calculateProgress = function() {
  const totalLessons = this.lessonProgress.length;
  const completedLessons = this.lessonProgress.filter(lesson => lesson.isCompleted).length;
  
  if (totalLessons === 0) {
    this.overallProgress = 0;
  } else {
    this.overallProgress = Math.round((completedLessons / totalLessons) * 100);
  }
  
  // Check if course is completed (all lessons completed)
  if (this.overallProgress === 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
  
  this.lastAccessedAt = new Date();
  return this.overallProgress;
};

// Method to get best quiz score for a specific quiz
progressSchema.methods.getBestQuizScore = function(quizId) {
  const attempts = this.quizAttempts.filter(attempt => 
    attempt.quizId.toString() === quizId.toString()
  );
  
  if (attempts.length === 0) return null;
  
  return Math.max(...attempts.map(attempt => attempt.score));
};

// Method to get latest quiz attempt for a specific quiz
progressSchema.methods.getLatestQuizAttempt = function(quizId) {
  const attempts = this.quizAttempts.filter(attempt => 
    attempt.quizId.toString() === quizId.toString()
  );
  
  if (attempts.length === 0) return null;
  
  return attempts.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))[0];
};

module.exports = mongoose.model('Progress', progressSchema);