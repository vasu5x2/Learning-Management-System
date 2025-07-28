const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Course = require('../models/Course');

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@lms.com',
    password: 'Admin123',
    role: 'admin'
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'Student123',
    role: 'student'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'Student123',
    role: 'student'
  }
];

const courses = [
  {
    title: 'JavaScript Fundamentals',
    description: 'Learn the basics of JavaScript programming language. This comprehensive course covers variables, functions, objects, arrays, and modern ES6+ features.',
    instructor: 'John Smith',
    price: 99.99,
    category: 'Programming',
    level: 'Beginner',
    duration: 40,
    thumbnail: 'https://example.com/js-course.jpg',
    lessons: [
      {
        title: 'Introduction to JavaScript',
        videoUrl: 'https://example.com/video1.mp4',
        order: 1,
        resourceLinks: [
          {
            title: 'MDN JavaScript Guide',
            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide'
          }
        ]
      },
      {
        title: 'Variables and Data Types',
        videoUrl: 'https://example.com/video2.mp4',
        order: 2,
        resourceLinks: [
          {
            title: 'JavaScript Data Types',
            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures'
          }
        ]
      },
      {
        title: 'Functions and Scope',
        videoUrl: 'https://example.com/video3.mp4',
        order: 3,
        resourceLinks: []
      }
    ],
    quizzes: [
      {
        title: 'JavaScript Basics Quiz',
        description: 'Test your understanding of JavaScript fundamentals',
        order: 1,
        passingScore: 70,
        timeLimit: 15,
        questions: [
          {
            questionText: 'Which of the following is used to declare a variable in JavaScript?',
            options: [
              { text: 'var', isCorrect: true },
              { text: 'variable', isCorrect: false },
              { text: 'v', isCorrect: false },
              { text: 'declare', isCorrect: false }
            ],
            explanation: 'The "var" keyword is used to declare variables in JavaScript, along with "let" and "const" in modern JavaScript.'
          },
          {
            questionText: 'What is the result of 5 + "5" in JavaScript?',
            options: [
              { text: '10', isCorrect: false },
              { text: '"55"', isCorrect: true },
              { text: 'Error', isCorrect: false },
              { text: 'undefined', isCorrect: false }
            ],
            explanation: 'JavaScript performs string concatenation when one operand is a string, resulting in "55".'
          }
        ]
      }
    ]
  },
  {
    title: 'React Development Masterclass',
    description: 'Master React.js development from basics to advanced concepts. Build real-world applications using React hooks, context, and state management.',
    instructor: 'Sarah Johnson',
    price: 149.99,
    category: 'Web Development',
    level: 'Intermediate',
    duration: 60,
    thumbnail: 'https://example.com/react-course.jpg',
    lessons: [
      {
        title: 'Introduction to React',
        videoUrl: 'https://example.com/react1.mp4',
        order: 1,
        resourceLinks: [
          {
            title: 'React Official Documentation',
            url: 'https://reactjs.org/docs'
          }
        ]
      },
      {
        title: 'Components and JSX',
        videoUrl: 'https://example.com/react2.mp4',
        order: 2,
        resourceLinks: []
      },
      {
        title: 'State and Props',
        videoUrl: 'https://example.com/react3.mp4',
        order: 3,
        resourceLinks: []
      },
      {
        title: 'React Hooks',
        videoUrl: 'https://example.com/react4.mp4',
        order: 4,
        resourceLinks: [
          {
            title: 'React Hooks Guide',
            url: 'https://reactjs.org/docs/hooks-intro.html'
          }
        ]
      }
    ],
    quizzes: [
      {
        title: 'React Components Quiz',
        description: 'Test your knowledge of React components and JSX',
        order: 1,
        passingScore: 75,
        timeLimit: 20,
        questions: [
          {
            questionText: 'What is JSX in React?',
            options: [
              { text: 'JavaScript XML', isCorrect: true },
              { text: 'Java Syntax Extension', isCorrect: false },
              { text: 'JSON Extended', isCorrect: false },
              { text: 'JavaScript Extension', isCorrect: false }
            ],
            explanation: 'JSX stands for JavaScript XML and allows you to write HTML-like syntax in JavaScript.'
          },
          {
            questionText: 'Which hook is used for state management in functional components?',
            options: [
              { text: 'useEffect', isCorrect: false },
              { text: 'useState', isCorrect: true },
              { text: 'useContext', isCorrect: false },
              { text: 'useReducer', isCorrect: false }
            ],
            explanation: 'useState is the primary hook for managing state in React functional components.'
          }
        ]
      }
    ]
  },
  {
    title: 'Node.js Backend Development',
    description: 'Learn to build scalable backend applications with Node.js, Express, and MongoDB. Master server-side JavaScript development.',
    instructor: 'Mike Wilson',
    price: 129.99,
    category: 'Backend Development',
    level: 'Intermediate',
    duration: 50,
    thumbnail: 'https://example.com/nodejs-course.jpg',
    lessons: [
      {
        title: 'Node.js Fundamentals',
        videoUrl: 'https://example.com/node1.mp4',
        order: 1,
        resourceLinks: [
          {
            title: 'Node.js Documentation',
            url: 'https://nodejs.org/en/docs/'
          }
        ]
      },
      {
        title: 'Express.js Framework',
        videoUrl: 'https://example.com/node2.mp4',
        order: 2,
        resourceLinks: []
      },
      {
        title: 'MongoDB Integration',
        videoUrl: 'https://example.com/node3.mp4',
        order: 3,
        resourceLinks: []
      }
    ],
    quizzes: [
      {
        title: 'Node.js Basics Quiz',
        description: 'Test your understanding of Node.js fundamentals',
        order: 1,
        passingScore: 70,
        timeLimit: 15,
        questions: [
          {
            questionText: 'What is Node.js?',
            options: [
              { text: 'A JavaScript framework', isCorrect: false },
              { text: 'A JavaScript runtime environment', isCorrect: true },
              { text: 'A database', isCorrect: false },
              { text: 'A web browser', isCorrect: false }
            ],
            explanation: 'Node.js is a JavaScript runtime environment that allows you to run JavaScript on the server side.'
          }
        ]
      }
    ]
  }
];

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Import data
const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany();
    await Course.deleteMany();
    console.log('Existing data cleared');

    // Hash passwords for users
    const hashedUsers = await Promise.all(
      users.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return { ...user, password: hashedPassword };
      })
    );

    // Create users
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`${createdUsers.length} users created`);

    // Create courses
    const createdCourses = await Course.insertMany(courses);
    console.log(`${createdCourses.length} courses created`);

    console.log('Data import completed successfully!');
    console.log('\nSample credentials:');
    console.log('Admin: admin@lms.com / Admin123');
    console.log('Student: john@example.com / Student123');
    console.log('Student: jane@example.com / Student123');

    process.exit(0);
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
};

// Destroy data
const destroyData = async () => {
  try {
    await connectDB();

    await User.deleteMany();
    await Course.deleteMany();

    console.log('All data destroyed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error destroying data:', error);
    process.exit(1);
  }
};

// Check command line arguments
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}