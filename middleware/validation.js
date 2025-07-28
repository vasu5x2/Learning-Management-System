const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
exports.validateRegister = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('role')
    .optional()
    .isIn(['student', 'admin'])
    .withMessage('Role must be either student or admin')
];

// User login validation
exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Course creation validation
exports.validateCourse = [
  body('title')
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters')
    .trim(),
  body('description')
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
    .trim(),
  body('instructor')
    .notEmpty()
    .withMessage('Instructor name is required')
    .trim(),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .isFloat({ min: 0 })
    .withMessage('Price cannot be negative'),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .trim(),
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced')
];

// Lesson validation
exports.validateLesson = [
  body('title')
    .notEmpty()
    .withMessage('Lesson title is required')
    .trim(),
  body('videoUrl')
    .notEmpty()
    .withMessage('Video URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
  body('order')
    .isInt({ min: 1 })
    .withMessage('Order must be a positive integer')
];

// Quiz validation
exports.validateQuiz = [
  body('title')
    .notEmpty()
    .withMessage('Quiz title is required')
    .trim(),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('Quiz must have at least one question'),
  body('questions.*.questionText')
    .notEmpty()
    .withMessage('Question text is required'),
  body('questions.*.options')
    .isArray({ min: 2, max: 6 })
    .withMessage('Each question must have between 2 and 6 options'),
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
  body('timeLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Time limit must be at least 1 minute')
];

// Quiz attempt validation
exports.validateQuizAttempt = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers array is required'),
  body('answers.*.questionId')
    .notEmpty()
    .withMessage('Question ID is required')
    .isMongoId()
    .withMessage('Invalid question ID'),
  body('answers.*.selectedOption')
    .isInt({ min: 0 })
    .withMessage('Selected option must be a valid index'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number')
];

// MongoDB ObjectId validation
exports.validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName} ID`)
];

// Pagination validation
exports.validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];