const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');
const { validateObjectId, validateQuizAttempt, handleValidationErrors } = require('../middleware/validation');

// @desc    Mark lesson as completed
// @route   PUT /api/progress/:courseId/lessons/:lessonId/complete
// @access  Private
router.put('/:courseId/lessons/:lessonId/complete', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;
    const { watchTime } = req.body;

    // Find progress record
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Find lesson progress
    const lessonProgress = progress.lessonProgress.find(
      lp => lp.lessonId.toString() === lessonId
    );

    if (!lessonProgress) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found in progress'
      });
    }

    // Mark as completed
    lessonProgress.isCompleted = true;
    lessonProgress.completedAt = new Date();
    if (watchTime) {
      lessonProgress.watchTime = watchTime;
    }

    // Recalculate overall progress
    progress.calculateProgress();
    await progress.save();

    res.json({
      success: true,
      message: 'Lesson marked as completed',
      data: {
        lessonProgress,
        overallProgress: progress.overallProgress,
        isCompleted: progress.isCompleted
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Mark lesson as incomplete
// @route   PUT /api/progress/:courseId/lessons/:lessonId/incomplete
// @access  Private
router.put('/:courseId/lessons/:lessonId/incomplete', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    // Find progress record
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Find lesson progress
    const lessonProgress = progress.lessonProgress.find(
      lp => lp.lessonId.toString() === lessonId
    );

    if (!lessonProgress) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found in progress'
      });
    }

    // Mark as incomplete
    lessonProgress.isCompleted = false;
    lessonProgress.completedAt = null;

    // Recalculate overall progress
    progress.calculateProgress();
    await progress.save();

    res.json({
      success: true,
      message: 'Lesson marked as incomplete',
      data: {
        lessonProgress,
        overallProgress: progress.overallProgress,
        isCompleted: progress.isCompleted
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Update lesson watch time
// @route   PUT /api/progress/:courseId/lessons/:lessonId/watch-time
// @access  Private
router.put('/:courseId/lessons/:lessonId/watch-time', protect, async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;
    const { watchTime } = req.body;

    if (typeof watchTime !== 'number' || watchTime < 0) {
      return res.status(400).json({
        success: false,
        message: 'Watch time must be a positive number'
      });
    }

    // Find progress record
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Find lesson progress
    const lessonProgress = progress.lessonProgress.find(
      lp => lp.lessonId.toString() === lessonId
    );

    if (!lessonProgress) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found in progress'
      });
    }

    // Update watch time
    lessonProgress.watchTime = watchTime;
    progress.lastAccessedAt = new Date();
    await progress.save();

    res.json({
      success: true,
      message: 'Watch time updated',
      data: {
        lessonProgress
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Submit quiz attempt
// @route   POST /api/progress/:courseId/quizzes/:quizId/attempt
// @access  Private
router.post('/:courseId/quizzes/:quizId/attempt', protect, validateQuizAttempt, handleValidationErrors, async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const userId = req.user.id;
    const { answers, timeSpent } = req.body;

    // Find course and quiz
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Find progress record
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Validate answers
    const questionIds = quiz.questions.map(q => q._id.toString());
    const answerQuestionIds = answers.map(a => a.questionId);
    
    // Check if all questions are answered
    const missingQuestions = questionIds.filter(qId => !answerQuestionIds.includes(qId));
    if (missingQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All questions must be answered'
      });
    }

    // Check if any extra questions are answered
    const extraQuestions = answerQuestionIds.filter(qId => !questionIds.includes(qId));
    if (extraQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid question IDs found'
      });
    }

    // Calculate score
    let correctAnswers = 0;
    const processedAnswers = answers.map(answer => {
      const question = quiz.questions.id(answer.questionId);
      const isCorrect = question.options[answer.selectedOption] && 
                       question.options[answer.selectedOption].isCorrect;
      
      if (isCorrect) {
        correctAnswers++;
      }

      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect
      };
    });

    const totalQuestions = quiz.questions.length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const isPassed = score >= quiz.passingScore;

    // Create quiz attempt
    const quizAttempt = {
      quizId,
      answers: processedAnswers,
      score,
      totalQuestions,
      correctAnswers,
      timeSpent: timeSpent || 0,
      isPassed,
      attemptedAt: new Date()
    };

    progress.quizAttempts.push(quizAttempt);
    progress.lastAccessedAt = new Date();
    await progress.save();

    res.status(201).json({
      success: true,
      message: 'Quiz attempt submitted successfully',
      data: {
        attempt: quizAttempt,
        bestScore: progress.getBestQuizScore(quizId),
        totalAttempts: progress.quizAttempts.filter(attempt => 
          attempt.quizId.toString() === quizId
        ).length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get quiz attempts for a specific quiz
// @route   GET /api/progress/:courseId/quizzes/:quizId/attempts
// @access  Private
router.get('/:courseId/quizzes/:quizId/attempts', protect, async (req, res) => {
  try {
    const { courseId, quizId } = req.params;
    const userId = req.user.id;

    // Find progress record
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Filter quiz attempts for the specific quiz
    const attempts = progress.quizAttempts.filter(attempt => 
      attempt.quizId.toString() === quizId
    );

    // Sort by attempt date (latest first)
    attempts.sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt));

    const bestScore = progress.getBestQuizScore(quizId);
    const latestAttempt = progress.getLatestQuizAttempt(quizId);

    res.json({
      success: true,
      data: {
        attempts,
        bestScore,
        latestAttempt,
        totalAttempts: attempts.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get overall progress for a course
// @route   GET /api/progress/:courseId
// @access  Private
router.get('/:courseId', protect, validateObjectId('courseId'), handleValidationErrors, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Find progress record
    const progress = await Progress.findOne({ user: userId, course: courseId })
      .populate('course', 'title description instructor lessons quizzes');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Get quiz statistics
    const quizStats = progress.course.quizzes.map(quiz => {
      const attempts = progress.quizAttempts.filter(attempt => 
        attempt.quizId.toString() === quiz._id.toString()
      );
      
      return {
        quizId: quiz._id,
        title: quiz.title,
        bestScore: progress.getBestQuizScore(quiz._id),
        latestAttempt: progress.getLatestQuizAttempt(quiz._id),
        totalAttempts: attempts.length,
        passed: attempts.some(attempt => attempt.isPassed)
      };
    });

    res.json({
      success: true,
      data: {
        course: {
          id: progress.course._id,
          title: progress.course.title,
          description: progress.course.description,
          instructor: progress.course.instructor
        },
        enrolledAt: progress.enrolledAt,
        lastAccessedAt: progress.lastAccessedAt,
        overallProgress: progress.overallProgress,
        isCompleted: progress.isCompleted,
        completedAt: progress.completedAt,
        lessonProgress: progress.lessonProgress,
        quizStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get detailed quiz attempt
// @route   GET /api/progress/:courseId/quizzes/:quizId/attempts/:attemptId
// @access  Private
router.get('/:courseId/quizzes/:quizId/attempts/:attemptId', protect, async (req, res) => {
  try {
    const { courseId, quizId, attemptId } = req.params;
    const userId = req.user.id;

    // Find progress record
    const progress = await Progress.findOne({ user: userId, course: courseId });
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Find the specific attempt
    const attempt = progress.quizAttempts.id(attemptId);
    if (!attempt || attempt.quizId.toString() !== quizId) {
      return res.status(404).json({
        success: false,
        message: 'Quiz attempt not found'
      });
    }

    // Get quiz details to include questions and explanations
    const course = await Course.findById(courseId);
    const quiz = course.quizzes.id(quizId);

    // Combine attempt answers with question details
    const detailedAnswers = attempt.answers.map(answer => {
      const question = quiz.questions.id(answer.questionId);
      return {
        question: {
          id: question._id,
          questionText: question.questionText,
          explanation: question.explanation,
          options: question.options
        },
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect
      };
    });

    res.json({
      success: true,
      data: {
        attempt: {
          _id: attempt._id,
          score: attempt.score,
          totalQuestions: attempt.totalQuestions,
          correctAnswers: attempt.correctAnswers,
          timeSpent: attempt.timeSpent,
          isPassed: attempt.isPassed,
          attemptedAt: attempt.attemptedAt,
          answers: detailedAnswers
        },
        quiz: {
          title: quiz.title,
          passingScore: quiz.passingScore
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;