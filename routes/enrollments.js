const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');
const { validateObjectId, handleValidationErrors } = require('../middleware/validation');

// @desc    Enroll in a course
// @route   POST /api/enrollments/:courseId
// @access  Private
router.post('/:courseId', protect, validateObjectId('courseId'), handleValidationErrors, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;

    // Check if course exists and is published
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    // Check if user is already enrolled
    const user = await User.findById(userId);
    const isAlreadyEnrolled = user.enrolledCourses.some(
      enrollment => enrollment.course.toString() === courseId
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Check if progress record already exists
    let progress = await Progress.findOne({ user: userId, course: courseId });
    if (progress) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    // Enroll user
    user.enrolledCourses.push({ course: courseId });
    await user.save();

    // Add user to course's enrolled students
    course.enrolledStudents.push(userId);
    await course.save();

    // Create progress record with lesson progress initialized
    const lessonProgress = course.lessons.map(lesson => ({
      lessonId: lesson._id,
      isCompleted: false,
      watchTime: 0
    }));

    progress = await Progress.create({
      user: userId,
      course: courseId,
      lessonProgress,
      quizAttempts: [],
      overallProgress: 0
    });

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        enrollment: {
          course: {
            id: course._id,
            title: course.title,
            instructor: course.instructor,
            price: course.price
          },
          enrolledAt: user.enrolledCourses[user.enrolledCourses.length - 1].enrolledAt,
          progress: progress.overallProgress
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

// @desc    Get user's enrollments
// @route   GET /api/enrollments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with populated enrolled courses
    const user = await User.findById(userId).populate({
      path: 'enrolledCourses.course',
      select: 'title description instructor price thumbnail level category'
    });

    // Get progress for each enrolled course
    const enrollments = await Promise.all(
      user.enrolledCourses.map(async (enrollment) => {
        const progress = await Progress.findOne({
          user: userId,
          course: enrollment.course._id
        });

        return {
          course: enrollment.course,
          enrolledAt: enrollment.enrolledAt,
          progress: progress ? progress.overallProgress : 0,
          isCompleted: progress ? progress.isCompleted : false,
          lastAccessedAt: progress ? progress.lastAccessedAt : null
        };
      })
    );

    res.json({
      success: true,
      data: {
        enrollments
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

// @desc    Get enrollment details for a specific course
// @route   GET /api/enrollments/:courseId
// @access  Private
router.get('/:courseId', protect, validateObjectId('courseId'), handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;

    // Check if user is enrolled in the course
    const user = await User.findById(userId);
    const enrollment = user.enrolledCourses.find(
      enrollment => enrollment.course.toString() === courseId
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get progress details
    const progress = await Progress.findOne({ user: userId, course: courseId });

    const enrollmentDetails = {
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        instructor: course.instructor,
        price: course.price,
        thumbnail: course.thumbnail,
        level: course.level,
        category: course.category,
        totalLessons: course.lessons.length,
        totalQuizzes: course.quizzes.length,
        lessons: course.lessons,
        quizzes: course.quizzes.map(quiz => ({
          _id: quiz._id,
          title: quiz.title,
          description: quiz.description,
          passingScore: quiz.passingScore,
          timeLimit: quiz.timeLimit,
          order: quiz.order,
          totalQuestions: quiz.questions.length
        }))
      },
      enrolledAt: enrollment.enrolledAt,
      progress: {
        overallProgress: progress ? progress.overallProgress : 0,
        isCompleted: progress ? progress.isCompleted : false,
        lastAccessedAt: progress ? progress.lastAccessedAt : null,
        lessonProgress: progress ? progress.lessonProgress : [],
        quizAttempts: progress ? progress.quizAttempts : []
      }
    };

    res.json({
      success: true,
      data: {
        enrollment: enrollmentDetails
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

// @desc    Unenroll from a course
// @route   DELETE /api/enrollments/:courseId
// @access  Private
router.delete('/:courseId', protect, validateObjectId('courseId'), handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id;
    const courseId = req.params.courseId;

    // Check if user is enrolled in the course
    const user = await User.findById(userId);
    const enrollmentIndex = user.enrolledCourses.findIndex(
      enrollment => enrollment.course.toString() === courseId
    );

    if (enrollmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    // Remove from user's enrolled courses
    user.enrolledCourses.splice(enrollmentIndex, 1);
    await user.save();

    // Remove user from course's enrolled students
    const course = await Course.findById(courseId);
    if (course) {
      course.enrolledStudents.pull(userId);
      await course.save();
    }

    // Delete progress record
    await Progress.findOneAndDelete({ user: userId, course: courseId });

    res.json({
      success: true,
      message: 'Successfully unenrolled from course'
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