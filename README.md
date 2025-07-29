# Learning Management System (LMS) Backend API

A comprehensive backend API for a Learning Management System built with Node.js, Express.js, and MongoDB. This API provides complete functionality for user authentication, course management, enrollment, and progress tracking.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin/Student)
- Secure password hashing
- Token validation middleware

### 📚 Course Management
- CRUD operations for courses
- Lesson management with video URLs and resources
- Quiz creation with multiple-choice questions
- Pagination and search functionality
- Category and level filtering

### 📝 Enrollment System
- Course enrollment for students
- Enrollment status tracking
- Unenrollment functionality

### 📊 Progress Tracking
- Lesson completion tracking
- Quiz attempts with scoring
- Overall course progress calculation
- Multiple quiz attempts allowed
- Detailed quiz results with explanations

### 🛡️ Security Features
- Rate limiting
- Input validation
- Helmet.js security headers
- CORS protection

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express-validator
- **Security**: Helmet.js, bcryptjs
- **Development**: Nodemon

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lms-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root folder with the following:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/lms_database
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```
   > 💡 Tip: Use a strong secret key in production and connect to a real MongoDB instance.

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the database (optional)**
   ```bash
   node utils/seeder.js
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `https://learning-management-system-a1lh.onrender.com`

## API Documentation

### Base URL
```
https://learning-management-system-a1lh.onrender.com
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Student123",
  "role": "student" // optional, defaults to "student"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Student123"
}
```

#### Get User Profile
```http
GET /api/auth/profile
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Smith"
}
```

#### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword"
}
```

### Course Endpoints

#### Get All Courses
```http
GET /api/courses?page=1&limit=10&category=Programming&level=Beginner&search=javascript
```

#### Get Single Course
```http
GET /api/courses/:courseId
```

#### Create Course (Admin only)
```http
POST /api/courses
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "title": "JavaScript Fundamentals",
  "description": "Learn JavaScript from basics",
  "instructor": "John Smith",
  "price": 99.99,
  "category": "Programming",
  "level": "Beginner"
}
```

#### Update Course (Admin only)
```http
PUT /api/courses/:courseId
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "title": "Updated Course Title",
  "price": 129.99
}
```

#### Delete Course (Admin only)
```http
DELETE /api/courses/:courseId
Authorization: Bearer <admin_jwt_token>
```

### Lesson Management (Admin only)

#### Add Lesson to Course
```http
POST /api/courses/:courseId/lessons
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "title": "Introduction to Variables",
  "videoUrl": "https://example.com/video.mp4",
  "order": 1,
  "resourceLinks": [
    {
      "title": "MDN Documentation",
      "url": "https://developer.mozilla.org"
    }
  ]
}
```

#### Update Lesson
```http
PUT /api/courses/:courseId/lessons/:lessonId
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "title": "Updated Lesson Title",
  "videoUrl": "https://example.com/new-video.mp4"
}
```

#### Delete Lesson
```http
DELETE /api/courses/:courseId/lessons/:lessonId
Authorization: Bearer <admin_jwt_token>
```

### Quiz Management (Admin only)

#### Add Quiz to Course
```http
POST /api/courses/:courseId/quizzes
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "title": "JavaScript Basics Quiz",
  "description": "Test your JavaScript knowledge",
  "order": 1,
  "passingScore": 70,
  "timeLimit": 15,
  "questions": [
    {
      "questionText": "What is JavaScript?",
      "options": [
        { "text": "Programming language", "isCorrect": true },
        { "text": "Database", "isCorrect": false },
        { "text": "Operating system", "isCorrect": false }
      ],
      "explanation": "JavaScript is a programming language."
    }
  ]
}
```

### Enrollment Endpoints

#### Enroll in Course
```http
POST /api/enrollments/:courseId
Authorization: Bearer <jwt_token>
```

#### Get User Enrollments
```http
GET /api/enrollments
Authorization: Bearer <jwt_token>
```

#### Get Specific Enrollment Details
```http
GET /api/enrollments/:courseId
Authorization: Bearer <jwt_token>
```

#### Unenroll from Course
```http
DELETE /api/enrollments/:courseId
Authorization: Bearer <jwt_token>
```

### Progress Tracking Endpoints

#### Mark Lesson as Completed
```http
PUT /api/progress/:courseId/lessons/:lessonId/complete
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "watchTime": 300 // optional, in seconds
}
```

#### Mark Lesson as Incomplete
```http
PUT /api/progress/:courseId/lessons/:lessonId/incomplete
Authorization: Bearer <jwt_token>
```

#### Update Lesson Watch Time
```http
PUT /api/progress/:courseId/lessons/:lessonId/watch-time
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "watchTime": 450
}
```

#### Submit Quiz Attempt
```http
POST /api/progress/:courseId/quizzes/:quizId/attempt
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "answers": [
    {
      "questionId": "questionObjectId",
      "selectedOption": 0
    }
  ],
  "timeSpent": 900 // optional, in seconds
}
```

#### Get Quiz Attempts
```http
GET /api/progress/:courseId/quizzes/:quizId/attempts
Authorization: Bearer <jwt_token>
```

#### Get Course Progress
```http
GET /api/progress/:courseId
Authorization: Bearer <jwt_token>
```

#### Get Detailed Quiz Attempt
```http
GET /api/progress/:courseId/quizzes/:quizId/attempts/:attemptId
Authorization: Bearer <jwt_token>
```

### Health Check
```http
GET /api/health
```

## Database Models

### User Model
- name, email, password (hashed)
- role (student/admin)
- enrolledCourses array
- timestamps

### Course Model
- title, description, instructor, price
- category, level, duration
- lessons array (embedded)
- quizzes array (embedded)
- enrolledStudents array
- timestamps

### Progress Model
- user and course references
- lessonProgress array
- quizAttempts array
- overallProgress percentage
- completion status
- timestamps

## Sample Data

The seeder utility creates sample data including:

### Users
- **Admin**: admin@lms.com / Admin123
- **Student**: john@example.com / Student123
- **Student**: jane@example.com / Student123

### Courses
- JavaScript Fundamentals (Beginner)
- React Development Masterclass (Intermediate)
- Node.js Backend Development (Intermediate)

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // validation errors if any
}
```

## Rate Limiting

- 100 requests per 15 minutes per IP address
- Can be configured in server.js

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet.js security headers

## Scripts

```bash
# Start server
npm start

# Development mode with auto-restart
npm run dev

# Seed database with sample data
node utils/seeder.js

# Clear database
node utils/seeder.js -d
```

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Use a production MongoDB instance
3. Set a strong JWT secret
4. Configure proper CORS settings
5. Use a process manager like PM2

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
