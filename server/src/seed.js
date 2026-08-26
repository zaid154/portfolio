import slugify from 'slugify'
import { assertEnv } from './config/env.js'
import { connectDb } from './config/db.js'
import User from './models/User.js'
import { modelForType, scopeForType } from './models/contentModels.js'
import Message from './models/Message.js'

// ─────────────────────────────────────────────────────────────────────────────
// THE ONE AND ONLY SEED.  Run it with:  npm run seed
//
// It always makes the database exactly match the content below, so whatever you
// edit here is what shows up on the site and in the admin dashboard — no second
// "reset" script, no drift between files.
//
// What it does:
//   • creates the admin user if missing (never touches an existing password)
//   • wipes + reinserts every content type listed in `items` (fresh each run)
//   • leaves real contact-form messages alone (adds a demo lead only if empty)
//
// IMAGE RULE: every image/PDF here is a hosted Cloudinary URL — never a local
// /images/... path — so the deployed site never depends on bundled files.
// (The public site's offline fallback in client/src/lib/site.js mirrors this.)
// ─────────────────────────────────────────────────────────────────────────────

const admin = {
  name: process.env.ADMIN_NAME || 'Mohd Zaid',
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
}

// Cloudinary-hosted profile photo (folder: portfolio-cms).
const PROFILE_IMAGE =
  'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783331204/portfolio-cms/profile'

const items = [
  // ── Hero ───────────────────────────────────────────────────────────────────
  {
    type: 'hero',
    title: 'Mohd Zaid',
    order: 1,
    featured: true,
    data: {
      badge: 'Open to Full-Time & Internship Opportunities',
      eyebrow: 'Full Stack MERN Developer',
      headline: 'Building modern MERN web applications.',
      roles: ['Full Stack Developer', 'MERN Stack Developer', 'React Developer', 'Node.js Developer'],
      description:
        "I'm a BCA final semester student at IGNOU and a Full Stack MERN Developer Intern at Humanoid Maker. I enjoy building responsive user interfaces, secure backend APIs, and scalable web applications using React, Node.js, Express.js, and MongoDB.",
      primaryCta: 'View Projects',
      secondaryCta: 'Contact Me',
      floatOne: 'MERN Stack',
      floatTwo: 'Clean Code',
      image: PROFILE_IMAGE,
    },
  },

  // ── Stats ────────────────────────────────────────────────────────────────────
  { type: 'stat', title: '22+', order: 1, data: { value: '22+', label: 'Projects Completed' } },
  { type: 'stat', title: '15+', order: 2, data: { value: '15+', label: 'Technologies' } },
  { type: 'stat', title: '1', order: 3, data: { value: '1', label: 'Internship' } },
  { type: 'stat', title: '100%', order: 4, data: { value: '100%', label: 'Dedication' } },

  // ── About ────────────────────────────────────────────────────────────────────
  {
    type: 'about',
    title: 'About',
    order: 1,
    data: {
      summary:
        "I'm a Full Stack MERN Developer with a strong interest in building modern, responsive, and scalable web applications. I have completed my Bachelor of Computer Applications (BCA) examinations at IGNOU and am currently awaiting the final results. During my internship at Humanoid Maker, I worked on real-world MERN applications, focusing on clean architecture, secure backend APIs, and intuitive user experiences. I'm passionate about continuous learning and enjoy turning ideas into production-ready solutions.",
      highlights: [
        'Full Stack MERN Development',
        'React.js & Node.js',
        'REST APIs & Authentication',
        'MongoDB & Mongoose',
        'Admin Dashboards & CMS',
        'Responsive UI Development',
      ],
    },
  },

  // ── Skills ───────────────────────────────────────────────────────────────────
  // NOTE: `level` is the public site's progress-bar percentage (Number(level) ||
  // 80). Keep it numeric so the bar renders meaningfully.
  {
    type: 'skill',
    title: 'Frontend',
    order: 1,
    data: {
      level: '90',
      skills: ['React.js', 'JavaScript (ES6+)', 'HTML5', 'CSS3', 'Tailwind CSS', 'Vite', 'React Router', 'Redux Toolkit'],
    },
  },
  {
    type: 'skill',
    title: 'Backend',
    order: 2,
    data: {
      level: '85',
      skills: ['Node.js', 'Express.js', 'MongoDB', 'Mongoose', 'REST APIs', 'JWT Authentication', 'Firebase Authentication', 'Cloudinary', 'Resend', 'MongoDB Atlas', 'Render', 'Vercel'],
    },
  },

  // ── Projects ─────────────────────────────────────────────────────────────────
  {
    type: 'project',
    title: 'NoteGenie',
    order: 1,
    featured: true,
    data: {
      description:
        'Built a full-stack MERN-based AI-powered digital study marketplace where students can discover, purchase, and manage notes, books, assignments, academic projects, and help books. The platform features secure JWT authentication, email verification and password recovery using Resend, category-based browsing, advanced search and filtering, shopping cart, secure checkout, order management, an admin dashboard, AI-powered note generation, an intelligent chat assistant, note summarization, flashcard generation, and a responsive user experience.',
      image: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783331196/portfolio-cms/notegenie.png',
      stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Razorpay', 'Gemini AI', 'Resend', 'Vercel', 'Render'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'NexaMart',
    order: 2,
    featured: true,
    data: {
      description:
        'Built a full-featured MERN e-commerce platform with 70+ product listings, featuring advanced search and filtering, shopping cart, wishlist, secure checkout (Razorpay & Cash on Delivery), order tracking, returns, invoicing, and inventory management. Implemented JWT authentication, OTP verification via Gmail SMTP, and role-based access control for secure user and admin operations. Deployed the application using Vercel and Render with a scalable production-ready architecture.',
      image: '/images/nexamart.png',
      stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Razorpay', 'Nodemailer', 'Vercel', 'Render'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'MockMate AI',
    order: 3,
    featured: true,
    data: {
      description:
        'AI-powered mock interview and skill assessment platform with real-time Google Gemini 2.5 AI evaluation, live scoring, open-ended question grading with line-by-line feedback, auto-scored technical quizzes, resume PDF parsing with stack-tailored question generation, and admin-managed milestone certificates with public credential verification.',
      image: '',
      stack: ['React.js', 'Vite', 'Node.js', 'Express.js', 'Google Gemini AI', 'MongoDB', 'JWT', 'Vercel'],
      liveUrl: 'https://ai-mock-interview-three-pi.vercel.app/',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'ATS Resume Builder & Analyzer',
    order: 4,
    featured: true,
    data: {
      description:
        'Production-grade ATS resume creation and scoring platform featuring 16+ ATS-compliant templates, real-time heuristic ATS scoring engine (0–100%), job description keyword diagnostics with missing term recommendations, drag-and-drop section reordering, interactive A4 canvas, and text-selectable vectorized PDF export with 100% parseability.',
      image: '',
      stack: ['React.js', 'Vite', 'Node.js', 'Express.js', 'MongoDB Atlas', 'Zod', 'Nodemailer', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'DevMeet',
    order: 5,
    featured: true,
    data: {
      description:
        'Full-stack dating and professional networking platform tailored for software developers. Features Tinder-style swipe matchmaking, real-time Socket.io direct messaging, WebRTC 1-on-1 audio and video calling, photo verification badge system, tech-stack filters, and an analytics-rich admin control suite.',
      image: '',
      stack: ['React 19', 'Vite', 'Node.js', 'Express.js', 'Socket.io', 'WebRTC', 'MongoDB', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'NexTalk',
    order: 6,
    featured: false,
    data: {
      description:
        'Private real-time communication platform offering instant messaging, group conversations, peer-to-peer WebRTC audio and video calling without intermediate server bottlenecks, inline voice notes, rich file sharing, message reactions, pinned chats, and presence status indicators.',
      image: '',
      stack: ['React 19', 'Node.js', 'Express.js', 'MongoDB', 'Socket.io', 'WebRTC', 'Vite'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'PeoplePay HR & Payroll EMS',
    order: 7,
    featured: false,
    data: {
      description:
        'Full-stack employee management and payroll platform. Offers dynamic HR metric dashboards, employee profiles with salary structures, one-click attendance check-in/out, multi-type leave approval workflows, automatic gross-to-net salary computation with deductions, and batch printable payslip generation.',
      image: '',
      stack: ['React.js', 'Vite', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'REST API'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'MZ Karigar',
    order: 8,
    featured: false,
    data: {
      description:
        'Hyperlocal home services gig platform connecting urban households with verified local technicians (electricians, plumbers, mechanics, carpenters) within 30 minutes. Features upfront transparent rate cards, WhatsApp-first booking UX, technician partner registration, and instant payout workflows.',
      image: '',
      stack: ['React.js', 'Vite', 'Node.js', 'Express.js', 'MongoDB', 'REST API'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'Natifix',
    order: 9,
    featured: true,
    data: {
      description:
        'Modern Netflix clone featuring a Gemini-powered conversational AI movie assistant, real-time TMDB catalog search, categorized movie/TV carousels, detailed title pages with trailer video playback, Firebase authentication, and offline watchlist persistence via Redux Toolkit.',
      image: '/images/Natifix.png',
      stack: ['React 19', 'Redux Toolkit', 'Firebase Auth', 'Gemini AI', 'TMDB API', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'TenantSphere (.NET SaaS)',
    order: 10,
    featured: false,
    data: {
      description:
        'Enterprise Multi-Tenant B2B SaaS architecture engineered with ASP.NET Core 8 Web API, Clean Architecture, CQRS with MediatR, Entity Framework Core 8, Dapper high-speed reads, Redis distributed caching, and dynamic tenant isolation with global query filters.',
      image: '',
      stack: ['ASP.NET Core 8', 'C#', 'Clean Architecture', 'CQRS', 'MediatR', 'EF Core', 'Redis', 'React 18'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'AI Image Generator',
    order: 11,
    featured: false,
    data: {
      description:
        'Full-stack AI image generation web application allowing users to turn natural language prompts into high-resolution images. Features prompt customization, generation history, instant image downloads, and responsive design.',
      image: '',
      stack: ['React.js', 'Node.js', 'Express.js', 'OpenAI API', 'REST API'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'YumRun Food Delivery',
    order: 12,
    featured: false,
    data: {
      description:
        'Full-stack food ordering and delivery web application featuring interactive restaurant menus, categorized dish filtering, cart state management, checkout with delivery tracking, and responsive mobile-first UI.',
      image: '/images/yumrun.png',
      stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'QuizMaster Platform',
    order: 13,
    featured: false,
    data: {
      description:
        'Dynamic quiz and assessment platform featuring timed questions, multi-domain categories (Frontend, Backend, Aptitude), instant score calculation, detailed solution reviews, and progress tracking.',
      image: '',
      stack: ['React 19', 'Node.js', 'Express.js', 'MongoDB', 'Razorpay', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'TaskFlow MERN Task Manager',
    order: 14,
    featured: false,
    data: {
      description:
        'Full-stack productivity tool with CRUD task capabilities, priority tags, status filtering (Active, Completed, Overdue), search, and persistent database storage with JWT authentication.',
      image: '/images/todo.png',
      stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'Flipkart Clone',
    order: 15,
    featured: false,
    data: {
      description:
        'Responsive e-commerce frontend replica replicating Flipkart’s browsing experience, multi-level category navigation, product detail views, deal banners, and stateful cart management.',
      image: '',
      stack: ['React.js', 'Vite', 'Tailwind CSS', 'Redux Toolkit'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'MovieSphere Discovery',
    order: 16,
    featured: false,
    data: {
      description:
        'Dynamic movie search and discovery web application consuming TMDB API with real-time keyword search, genre filtering, modal previews, and responsive movie cards.',
      image: '',
      stack: ['React.js', 'Tailwind CSS', 'TMDB API', 'JavaScript'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'TrendyKart .NET Store',
    order: 17,
    featured: false,
    data: {
      description:
        'E-commerce platform developed with ASP.NET Core MVC and Entity Framework Core, featuring product catalog management, product variants, shopping cart, Razorpay payment, and order management.',
      image: '',
      stack: ['ASP.NET Core', 'C#', 'Entity Framework Core', 'SQL Server', 'Razorpay', 'Bootstrap'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'Interactive Proposal App',
    order: 18,
    featured: false,
    data: {
      description:
        'Interactive and playful romantic web application built with responsive animations, interactive button behaviors, date planning flow, and celebratory particle animations.',
      image: '/images/proposal.png',
      stack: ['React.js', 'Framer Motion', 'HTML5', 'CSS3', 'JavaScript'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'Color Palette & Gradient Studio',
    order: 19,
    featured: false,
    data: {
      description:
        'Interactive color tool for developers and designers to generate, explore, and copy HEX/RGB/HSL color codes, contrast scores, and CSS gradient backgrounds.',
      image: '',
      stack: ['HTML5', 'CSS3', 'JavaScript (ES6+)'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'Number Guessing Arena',
    order: 20,
    featured: false,
    data: {
      description:
        'Interactive logic game with dynamic difficulty levels, real-time proximity hints, attempt counters, and local high-score records.',
      image: '/images/game.png',
      stack: ['HTML5', 'CSS3', 'JavaScript'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'Neumorphic Web Calculator',
    order: 21,
    featured: false,
    data: {
      description:
        'Modern web calculator featuring soft neumorphic UI aesthetics, keyboard input event listening, history calculation memory, and mathematical operations.',
      image: '/images/calculator.png',
      stack: ['HTML5', 'CSS3', 'JavaScript'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },
  {
    type: 'project',
    title: 'University Portal Website',
    order: 22,
    featured: false,
    data: {
      description:
        'Responsive higher education institution website template featuring academic course outlines, department overviews, campus admissions information, and contact inquiry forms.',
      image: '',
      stack: ['HTML5', 'CSS3', 'JavaScript'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154',
    },
  },

  // ── Experience ───────────────────────────────────────────────────────────────
  {
    type: 'experience',
    title: 'Full Stack MERN Developer Intern',
    order: 1,
    data: {
      company: 'Humanoid Maker',
      period: 'May 2026 – Present',
      description:
        'Working as a Full Stack MERN Developer Intern, contributing to the development of modern web applications with a focus on responsive user interfaces, secure backend systems, and scalable application architecture.',
      points: [
        'Developing responsive user interfaces using React.js and Tailwind CSS.',
        'Building and integrating RESTful APIs with Node.js, Express.js, and MongoDB.',
        'Implementing secure authentication using JWT and Firebase Authentication.',
        'Integrating Cloudinary for media management and Resend for email services.',
        'Collaborating with the team using Git and GitHub while following clean coding practices.',
      ],
    },
  },

  // ── Education ────────────────────────────────────────────────────────────────
  {
    type: 'education',
    title: 'Bachelor of Computer Applications (BCA)',
    order: 1,
    data: {
      institution: 'Indira Gandhi National Open University (IGNOU), New Delhi',
      period: '2023 – 2026',
      description:
        'Completed the Bachelor of Computer Applications (BCA) program with a focus on programming, database management, software engineering, web development, and computer science fundamentals. Final semester examinations completed; result awaited.',
    },
  },

  // ── Certificates ─────────────────────────────────────────────────────────────
  {
    type: 'certificate',
    title: 'AI for All',
    order: 1,
    data: {
      issuer: 'Intel & Skill India',
      date: 'Jul 2025',
      credentialUrl: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783509362/AI_For_All_zduudf.pdf',
    },
  },
  {
    type: 'certificate',
    title: 'Program in Cyber Awareness AI Basic',
    order: 2,
    data: {
      issuer: 'NIIT Foundation & Skill India',
      date: 'Jul 2025',
      credentialUrl: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783509361/program_in_cyber_awareness_ai_basics_jklrqh.pdf',
    },
  },
  {
    type: 'certificate',
    title: 'Exploring Computers',
    order: 3,
    data: {
      issuer: 'Infosys Springboard',
      date: 'Jul 2025',
      credentialUrl: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783509361/Exploring_Computers_kzlldf.pdf',
    },
  },
  {
    type: 'certificate',
    title: 'Freedom Employability Academy',
    order: 4,
    data: {
      issuer: 'Freedom Employability Academy',
      date: 'Oct 2025',
      credentialUrl: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783509362/FEA_nbp9ft.pdf',
    },
  },

  // ── Blog ─────────────────────────────────────────────────────────────────────
  {
    type: 'blog',
    title: 'Building Scalable MERN Applications',
    order: 1,
    data: {
      excerpt: 'Key practices I follow to build secure, scalable, and maintainable MERN applications.',
      content:
        'In this article, I share my approach to developing MERN applications, including project structure, authentication, API design, database modeling, and deployment. These practices help me write clean, maintainable, and production-ready code.',
      coverImage: '',
    },
  },
  {
    type: 'blog',
    title: 'Getting Started with React and Node.js',
    order: 2,
    data: {
      excerpt: 'A beginner-friendly guide to building your first full-stack web application.',
      content:
        'This article covers the fundamentals of building a full-stack application using React.js, Node.js, Express.js, and MongoDB. It explains project setup, routing, REST APIs, authentication, and deployment in a simple and practical way.',
      coverImage: '',
    },
  },

  // ── Services ─────────────────────────────────────────────────────────────────
  {
    type: 'service',
    title: 'MERN Stack Development',
    order: 1,
    data: { description: 'Build fast, secure, and scalable full-stack web applications using React, Node.js, Express.js, and MongoDB.', icon: 'Code' },
  },
  {
    type: 'service',
    title: 'AI-Powered Applications',
    order: 2,
    data: { description: 'Add AI features like chat assistants, content generation, note summaries, and flashcards to modern web applications.', icon: 'Sparkles' },
  },
  {
    type: 'service',
    title: 'REST API Development',
    order: 3,
    data: { description: 'Design and develop secure REST APIs with authentication, authorization, and database integration.', icon: 'Server' },
  },
  {
    type: 'service',
    title: 'Admin Dashboard Development',
    order: 4,
    data: { description: 'Create powerful admin panels for managing users, products, orders, content, and application settings.', icon: 'LayoutDashboard' },
  },
  {
    type: 'service',
    title: 'Deployment & Support',
    order: 5,
    data: { description: 'Deploy applications on Vercel and Render with proper environment configuration and ongoing maintenance.', icon: 'Rocket' },
  },

  // ── Contact ──────────────────────────────────────────────────────────────────
  {
    type: 'contactInfo',
    title: 'Contact Information',
    order: 1,
    data: { email: 'zaidm1323@gmail.com', phone: '+91 9999201255', location: 'New Delhi, India' },
  },

  // ── Resume ───────────────────────────────────────────────────────────────────
  {
    type: 'resume',
    title: 'Resume',
    order: 1,
    data: { url: 'https://res.cloudinary.com/uvxhwkuo/raw/upload/v1783331207/portfolio-cms/resume.pdf', label: 'Download Resume' },
  },

  // ── Social links ─────────────────────────────────────────────────────────────
  { type: 'socialLink', title: 'GitHub', order: 1, data: { platform: 'GitHub', url: 'https://github.com/zaid154' } },
  { type: 'socialLink', title: 'LinkedIn', order: 2, data: { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/mohd-zaid-794090231/' } },
  { type: 'socialLink', title: 'Email', order: 3, data: { platform: 'Email', url: 'mailto:zaidm1323@gmail.com' } },

  // ── SEO ──────────────────────────────────────────────────────────────────────
  {
    type: 'seo',
    title: 'Default SEO',
    order: 1,
    data: {
      title: 'Mohd Zaid | Full Stack MERN Developer',
      description:
        'Portfolio of Mohd Zaid, a Full Stack MERN Developer showcasing modern web applications, AI-powered solutions, REST APIs, admin dashboards, and scalable full-stack projects built with React.js, Node.js, Express.js, and MongoDB.',
      keywords:
        'Mohd Zaid, Full Stack Developer, MERN Stack Developer, React.js, Node.js, Express.js, MongoDB, JavaScript, AI Integration, Portfolio, Web Developer',
    },
  },

  // ── Section titles ───────────────────────────────────────────────────────────
  {
    type: 'siteText',
    title: 'Section Titles',
    order: 1,
    data: {
      workEyebrow: 'Projects',
      workTitle: 'Featured *Projects*',
      workSubtitle:
        'A collection of full-stack applications, AI-powered solutions, and modern web experiences built using the MERN stack.',
      skillsEyebrow: 'Skills',
      skillsTitle: 'Technologies I *Work With*',
      servicesEyebrow: 'Services',
      servicesTitle: 'What I *Build*',
      aboutEyebrow: 'About',
      aboutTitle: 'Know More *About Me*',
      testimonialsEyebrow: 'Testimonials',
      testimonialsTitle: 'What People *Say*',
      blogEyebrow: 'Blog',
      blogTitle: 'Latest *Articles*',
      contactEyebrow: 'Contact',
      contactTitle: "Let's *Connect*",
      contactSubtitle: 'Have a project, an idea, or an opportunity? Feel free to get in touch.',
      experienceTitle: 'Experience',
      educationTitle: 'Education & Certifications',
      liveLabel: 'Live Demo',
      codeLabel: 'Source Code',
      detailsLabel: 'View Details',
      featuredLabel: 'Featured',
      readMoreLabel: 'Read More',
      viewCredentialLabel: 'View credential',
      // Navigation labels (anchors are fixed in code; only the text is editable)
      navWork: 'Work',
      navSkills: 'Skills',
      navServices: 'Services',
      navAbout: 'About',
      navContact: 'Contact',
      navAdmin: 'Admin',
      // Contact section micro-labels
      contactEmailLabel: 'Email',
      contactPhoneLabel: 'Phone',
      contactLocationLabel: 'Location',
      // Contact form labels, placeholders, button + success toast
      formNameLabel: 'Name',
      formNamePlaceholder: 'Your name',
      formEmailLabel: 'Email',
      formEmailPlaceholder: 'you@email.com',
      formSubjectLabel: 'Subject',
      formSubjectPlaceholder: "What's this about?",
      formMessageLabel: 'Message',
      formMessagePlaceholder: 'Tell me about your project...',
      formSendLabel: 'Send Message',
      formSendingLabel: 'Sending...',
      formSuccessMessage: "Message sent — I'll get back to you soon!",
      // Loading banner shown while the CMS content is fetching
      syncingLabel: 'Syncing live CMS content…',
    },
  },

  // ── Brand / site settings ────────────────────────────────────────────────────
  {
    type: 'siteSetting',
    title: 'Brand Settings',
    order: 1,
    data: {
      siteName: 'Mohd Zaid',
      logoText: 'MZ',
      accentColor: '#5A63E0',
      ctaText: 'Get In Touch',
      footerText: '© 2026 Mohd Zaid. Built with React, Node.js, Express.js, and MongoDB.',
    },
  },
]

async function seed() {
  assertEnv()
  await connectDb()

  const existingAdmin = await User.findOne({ email: admin.email })
  if (!existingAdmin) {
    await User.create(admin)
    console.log(`Created admin: ${admin.email}`)
  } else {
    console.log(`Admin already exists: ${admin.email}`)
  }

  // Wipe every content type present in `items`, then reinsert fresh — so the DB
  // always matches this file exactly (no stale docs, no duplicates).
  const types = [...new Set(items.map((i) => i.type))]
  for (const type of types) {
    const { deletedCount } = await modelForType(type).deleteMany(scopeForType(type))
    if (deletedCount) console.log(`Cleared ${deletedCount} existing "${type}" item(s)`)
  }

  // Slug must be unique within its type — build one manually (the pre-save hook
  // doesn't run for bulk paths, and a plain create() loop still needs to avoid
  // collisions, e.g. the 2nd "stat" or 2nd "socialLink").
  const usedSlugs = {}
  const seedSlug = (type, title) => {
    const taken = (usedSlugs[type] ||= new Set())
    const root = slugify(title, { lower: true, strict: true }) || 'item'
    let slug = root
    let n = 2
    while (taken.has(slug)) slug = `${root}-${n++}`
    taken.add(slug)
    return slug
  }

  for (const item of items) {
    await modelForType(item.type).create({
      ...item,
      ...scopeForType(item.type),
      slug: seedSlug(item.type, item.title),
    })
  }
  console.log(`Inserted ${items.length} content item(s)`)

  // Leave real contact-form submissions alone — only add a demo lead if the
  // inbox is completely empty, so a fresh install has something to show.
  if ((await Message.countDocuments()) === 0) {
    await Message.create({
      name: 'Demo Lead',
      email: 'lead@example.com',
      subject: 'Portfolio inquiry',
      message: 'I would like to discuss a MERN project with you.',
    })
  }

  console.log('Seed complete')
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
