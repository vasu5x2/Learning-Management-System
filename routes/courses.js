const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../middleware/auth');
const { 
  validateCourse, 
  validateLesson, 
  validateQuiz, 
  validateObjectId, 
  validatePagination,
  handleValidationErrors 
} = require('../middleware/validation');

// @desc    Get all courses with pagination
// @route   GET /api/courses
// @access  Public
router.get('/', validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isPublished: true };
    if (req.query.category) {
      filter.category = new RegExp(req.query.category, 'i');
    }
    if (req.query.level) {
      filter.level = req.query.level;
    }
    if (req.query.search) {
      filter.$or = [
        { title: new RegExp(req.query.search, 'i') },
        { description: new RegExp(req.query.search, 'i') },
        { instructor: new RegExp(req.query.search, 'i') }
      ];
    }

    // Build sort
    let sort = { createdAt: -1 };
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }

    const courses = await Course.find(filter)
      .select('-lessons.resourceLinks -quizzes.questions')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', validateObjectId('id'), handleValidationErrors, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (!course.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Course not available'
      });
    }

    res.json({
      success: true,
      data: {
        course
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

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin only)
router.post('/', protect, authorize('admin'), validateCourse, handleValidationErrors, async (req, res) => {
  try {
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course
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

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin only)
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), validateCourse, handleValidationErrors, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course
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

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), handleValidationErrors, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Add lesson to course
// @route   POST /api/courses/:id/lessons
// @access  Private (Admin only)
router.post('/:id/lessons', protect, authorize('admin'), validateObjectId('id'), validateLesson, handleValidationErrors, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.lessons.push(req.body);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Lesson added successfully',
      data: {
        course
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

// @desc    Update lesson
// @route   PUT /api/courses/:courseId/lessons/:lessonId
// @access  Private (Admin only)
router.put('/:courseId/lessons/:lessonId', protect, authorize('admin'), validateLesson, handleValidationErrors, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    Object.assign(lesson, req.body);
    await course.save();

    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: {
        course
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

// @desc    Delete lesson
// @route   DELETE /api/courses/:courseId/lessons/:lessonId
// @access  Private (Admin only)
router.delete('/:courseId/lessons/:lessonId', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.lessons.pull(req.params.lessonId);
    await course.save();

    res.json({
      success: true,
      message: 'Lesson deleted successfully',
      data: {
        course
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

// @desc    Add quiz to course
// @route   POST /api/courses/:id/quizzes
// @access  Private (Admin only)
router.post('/:id/quizzes', protect, authorize('admin'), validateObjectId('id'), validateQuiz, handleValidationErrors, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.quizzes.push(req.body);
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Quiz added successfully',
      data: {
        course
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

// @desc    Update quiz
// @route   PUT /api/courses/:courseId/quizzes/:quizId
// @access  Private (Admin only)
router.put('/:courseId/quizzes/:quizId', protect, authorize('admin'), validateQuiz, handleValidationErrors, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const quiz = course.quizzes.id(req.params.quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    Object.assign(quiz, req.body);
    await course.save();

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: {
        course
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

// @desc    Delete quiz
// @route   DELETE /api/courses/:courseId/quizzes/:quizId
// @access  Private (Admin only)
router.delete('/:courseId/quizzes/:quizId', protect, authorize('admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.quizzes.pull(req.params.quizId);
    await course.save();

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
      data: {
        course
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