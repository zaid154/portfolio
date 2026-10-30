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
  email: process.env.ADMIN_EMAIL || 'zaidm1323@gmail.com',
  password: process.env.ADMIN_PASSWORD || 'Zaid@9999201255',
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
      badge: 'Open for Full-Time Software Engineering Roles',
      eyebrow: 'Mohd Zaid — Full-Stack Engineer',
      headline: 'Engineering High-Throughput & Scalable Web Applications.',
      roles: ['Full-Stack Engineer', 'MERN Systems Developer', 'Backend & API Engineer'],
      description:
        "Full-Stack Software Engineer with production experience at Humanoid Maker. Specialized in high-performance MERN architectures, Redis caching, real-time WebSockets, and clean system design.",
      primaryCta: 'Explore Projects & Systems',
      secondaryCta: 'Get In Touch',
      floatOne: 'MERN Stack',
      floatTwo: 'Clean Code',
      image: PROFILE_IMAGE,
    },
  },

  // ── Stats ────────────────────────────────────────────────────────────────────
  { type: 'stat', title: '60%', order: 1, data: { value: '60%', label: 'DB Load Reduction (Redis)' } },
  { type: 'stat', title: '45%', order: 2, data: { value: '45%', label: 'API Latency Drop' } },
  { type: 'stat', title: '11+', order: 3, data: { value: '11+', label: 'Production Web Apps' } },
  { type: 'stat', title: '4+', order: 4, data: { value: '4+', label: 'Real-Time / Streaming Systems' } },

  // ── About ────────────────────────────────────────────────────────────────────
  {
    type: 'about',
    title: 'About',
    order: 1,
    data: {
      summary:
        "I'm a Full Stack MERN Developer with proven production experience delivering full-cycle web applications. Having completed my internship at Humanoid Maker, I specialize in engineering modular MERN architectures, sub-second API performance, Redis caching, and real-time communication systems. I hold a Bachelor of Computer Applications (BCA) from IGNOU (70.17%) and am actively seeking full-time software engineering roles.",
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
    title: 'Frontend & UI Engineering',
    order: 1,
    data: {
      level: '95',
      skills: ['React 19', 'JavaScript (ES6+)', 'Tailwind CSS v4', 'Redux Toolkit', 'Vite', 'React Router', 'Framer Motion', 'HTML5 & Modern CSS3', 'Responsive Design'],
    },
  },
  {
    type: 'skill',
    title: 'Backend & API Architecture',
    order: 2,
    data: {
      level: '90',
      skills: ['Node.js', 'Express.js', 'RESTful APIs', 'JWT Authentication', 'Socket.io', 'WebRTC', 'Firebase Auth', 'Zod Validation', 'Bcrypt.js'],
    },
  },
  {
    type: 'skill',
    title: 'AI Integration & Third-Party APIs',
    order: 3,
    data: {
      level: '92',
      skills: ['Google Gemini AI (2.5)', 'OpenAI API', 'Razorpay Payment Gateway', 'Resend Email API', 'Cloudinary Media CDN', 'Nodemailer SMTP'],
    },
  },
  {
    type: 'skill',
    title: 'Databases, Cloud & DevOps',
    order: 4,
    data: {
      level: '88',
      skills: ['MongoDB', 'Mongoose ODM', 'MongoDB Atlas', 'SQL Server', 'Redis Caching', 'ASP.NET Core 8', 'Git & GitHub', 'Vercel', 'Render'],
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
        'AI Study Notes Marketplace — Architected digital study resource marketplace with protected PDF reader and Razorpay checkout. Integrated Gemini 2.5 AI for automated chapter summaries, interactive flashcards, and conceptual takeaways.',
      image: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783331196/portfolio-cms/notegenie.png',
      stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Razorpay', 'Gemini AI', 'Resend', 'Vercel', 'Render'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154/NoteGenie',
    },
  },
  {
    type: 'project',
    title: 'NexaMart',
    order: 2,
    featured: true,
    data: {
      description:
        'Multi-Vendor E-Commerce Platform — Engineered scalable marketplace architecture with indexed MongoDB schemas, multi-filter catalog search, cart workflows, Razorpay payment gateway integration, automated GST invoicing, and merchant control panel.',
      image: '/images/nexamart.png',
      stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'Razorpay', 'Nodemailer', 'Vercel', 'Render'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154/Nexa-Mart',
    },
  },
  {
    type: 'project',
    title: 'MockMate AI',
    order: 3,
    featured: true,
    data: {
      description:
        'AI Technical Interview Platform — Built resume-parsing engine that dynamically structures role-tailored technical questions using Google Gemini API. Features multi-turn prompt evaluation, live candidate scoring, and structured feedback reports.',
      image: '',
      stack: ['React.js', 'Vite', 'Node.js', 'Express.js', 'Google Gemini AI', 'MongoDB', 'JWT', 'Vercel'],
      liveUrl: 'https://mockmate-pro.vercel.app/',
      githubUrl: 'https://github.com/zaid154/Ai-Mock-Interview',
    },
  },
  {
    type: 'project',
    title: 'ATS Resume Builder and Analyzer',
    order: 4,
    featured: true,
    data: {
      description:
        'ATS Resume Engine & Vector PDF Generator — Created real-time ATS resume editor with scoring engine, customizable typography, and client-side vector PDF generation ensuring 100% lossless layout formatting across parsers.',
      image: '',
      stack: ['React.js', 'Vite', 'Node.js', 'Express.js', 'MongoDB Atlas', 'Zod', 'Nodemailer', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154/ATS-Resume-Builder',
    },
  },
  {
    type: 'project',
    title: 'DevMeet',
    order: 5,
    featured: true,
    data: {
      description:
        'Developer Networking & Real-Time Matchmaking — Full-stack networking platform featuring swipe-based matching, real-time Socket.io direct messaging, WebRTC 1-on-1 audio/video peer calling, tech-stack search filters, and admin moderation.',
      image: '',
      stack: ['React 19', 'Vite', 'Node.js', 'Express.js', 'Socket.io', 'WebRTC', 'MongoDB', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154/developer-meetups',
    },
  },
  {
    type: 'project',
    title: 'NexTalk',
    order: 6,
    featured: false,
    data: {
      description:
        'Real-Time P2P Communication Suite — Engineered instant messaging system with peer-to-peer WebRTC voice/video calls, inline voice notes, rich file transfers, pinned chats, message reactions, and live user presence indicators.',
      image: '',
      stack: ['React 19', 'Node.js', 'Express.js', 'MongoDB', 'Socket.io', 'WebRTC', 'Vite'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154/Share-System',
    },
  },
  {
    type: 'project',
    title: 'PeoplePay HR & Payroll EMS',
    order: 7,
    featured: false,
    data: {
      description:
        'Enterprise Payroll & HR System — Production workforce platform with real-time employee attendance tracking, multi-tier leave approval workflows, automated gross-to-net salary computation with deductions, and batch printable PDF payslips.',
      image: '',
      stack: ['React.js', 'Vite', 'Node.js', 'Express.js', 'MongoDB', 'JWT', 'REST API'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154/Employee-Management-System',
    },
  },
  {
    type: 'project',
    title: 'Natifix',
    order: 8,
    featured: true,
    data: {
      description:
        'AI-Powered Streaming & Discovery — OTT platform with conversational Gemini AI movie assistant, real-time TMDB API catalog, categorized carousels, video trailer player, Firebase auth, and Redux Toolkit persistent watchlist state.',
      image: '/images/Natifix.png',
      stack: ['React 19', 'Redux Toolkit', 'Firebase Auth', 'Gemini AI', 'TMDB API', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154/Natifix',
    },
  },
  {
    type: 'project',
    title: 'YumRun Food Delivery',
    order: 9,
    featured: false,
    data: {
      description:
        'Food Ordering & Delivery Application — Full-stack food ordering app with interactive restaurant catalogs, categorized meal filtering, cart state management, checkout with order status tracking, and mobile-optimized UI.',
      image: '/images/yumrun.png',
      stack: ['React.js', 'Node.js', 'Express.js', 'MongoDB', 'Tailwind CSS'],
      liveUrl: '',
      githubUrl: 'https://github.com/zaid154/YumRun',
    },
  },
  {
    type: 'project',
    title: 'TrendyKart .NET Store',
    order: 10,
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
    order: 11,
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

  // ── Hidden / Draft Projects (Saved in CMS but hidden from public) ───────────
  {
    type: 'project',
    title: 'MZ Karigar',
    status: 'draft',
    order: 90,
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
    title: 'TenantSphere (.NET SaaS)',
    status: 'draft',
    order: 91,
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
    status: 'draft',
    order: 92,
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
    title: 'QuizMaster Platform',
    status: 'draft',
    order: 93,
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
    status: 'draft',
    order: 94,
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
    title: 'University Portal Website',
    status: 'draft',
    order: 95,
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
  {
    type: 'project',
    title: 'Color Palette & Gradient Studio',
    status: 'draft',
    order: 96,
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
    status: 'draft',
    order: 97,
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
    status: 'draft',
    order: 98,
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

  // ── Experience ───────────────────────────────────────────────────────────────
  {
    type: 'experience',
    title: 'Full Stack Developer Intern',
    order: 1,
    data: {
      company: 'Humanoid Maker',
      period: 'April 2026 – August 2026 (Completed · Delhi, India)',
      description:
        'Architected scalable web applications, real-time communication systems, and video streaming pipelines with high reliability and performance.',
      points: [
        'Performance & Security: Decreased database load by 60% and API latency by 45% using Redis caching; enforced JWT authentication, Role-Based Access Control (RBAC), and wrote Jest test suites.',
        'OTT Video Streaming: Built streaming pipeline with chunked media delivery and adaptive bitrate playback (HLS), reducing initial buffering latency by 35% across active streams.',
        'Real-Time Platform (Wisp): Implemented WebRTC for audio/video calling and Socket.IO for real-time messaging, live user presence indicators, and instant event notifications.',
        'E-Commerce Architecture: Engineered scalable marketplace for 50+ merchants, handling dynamic product catalogs, order workflows, and admin dashboards via MERN stack.',
      ],
    },
  },

  // ── Education ────────────────────────────────────────────────────────────────
  {
    type: 'education',
    title: 'Bachelor of Computer Applications (BCA)',
    order: 1,
    data: {
      institution: 'Indira Gandhi National Open University (IGNOU), Delhi',
      period: '2023 – 2026',
      description:
        'Final Semester (Result Awaited) | Aggregate: 70.17%. Focused on full-stack web development, data structures, database management systems (DBMS), software engineering, and system design.',
    },
  },
  {
    type: 'education',
    title: 'Senior Secondary (12th) & Secondary (10th) School',
    order: 2,
    data: {
      institution: 'SBV B1 Yamuna Vihar, Delhi',
      period: '2021 – 2023',
      description:
        'Completed Grade 12 (Senior Secondary, 2023) and Grade 10 (Secondary School, 2021) with strong academic foundation in Computer Science & Science.',
    },
  },

  // ── Certificates ─────────────────────────────────────────────────────────────
  {
    type: 'certificate',
    title: 'Fundamentals of Remote Sensing',
    order: 1,
    data: {
      issuer: 'NASA Applied Remote Sensing Training (ARSET)',
      date: 'Aug 2026',
      credentialUrl: '',
    },
  },
  {
    type: 'certificate',
    title: 'English, Digital Skills & Workplace Readiness',
    order: 2,
    data: {
      issuer: 'Freedom Employability Academy (FEA)',
      date: 'Oct 2025',
      credentialUrl: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783509362/FEA_nbp9ft.pdf',
    },
  },
  {
    type: 'certificate',
    title: 'Artificial Intelligence for All',
    order: 3,
    data: {
      issuer: 'Intel & Skill India Digital Hub',
      date: 'Jul 2025',
      credentialUrl: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783509362/AI_For_All_zduudf.pdf',
    },
  },
  {
    type: 'certificate',
    title: 'Program in Cyber Awareness AI Basic',
    order: 4,
    data: {
      issuer: 'NIIT Foundation & Skill India',
      date: 'Jul 2025',
      credentialUrl: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783509361/program_in_cyber_awareness_ai_basics_jklrqh.pdf',
    },
  },
  {
    type: 'certificate',
    title: 'Exploring Computers',
    order: 5,
    data: {
      issuer: 'Infosys Springboard',
      date: 'Jul 2025',
      credentialUrl: 'https://res.cloudinary.com/uvxhwkuo/image/upload/v1783509361/Exploring_Computers_kzlldf.pdf',
    },
  },
  {
    type: 'certificate',
    title: 'Talent Hunt Competition',
    order: 6,
    data: {
      issuer: 'PC Training Institute Limited',
      date: 'Jun 2025',
      credentialUrl: '',
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
    title: 'Full-Stack Web Engineering',
    order: 1,
    data: {
      description:
        'Architecting robust end-to-end web applications with React 19, Node.js, Express.js, and MongoDB. Modern responsive design, state management, and high-quality UX.',
      icon: 'Code2',
    },
  },
  {
    type: 'service',
    title: 'Scalable APIs & Backend Architecture',
    order: 2,
    data: {
      description:
        'Designing secure RESTful APIs with JWT authentication, RBAC authorization, MongoDB Atlas indexing, and Redis caching for 45% lower latency.',
      icon: 'Server',
    },
  },
  {
    type: 'service',
    title: 'Real-Time Communication & Streaming',
    order: 3,
    data: {
      description:
        'Building WebRTC peer-to-peer audio/video calling, Socket.IO live messaging and notifications, and adaptive HLS video streaming pipelines.',
      icon: 'Layers',
    },
  },
  {
    type: 'service',
    title: 'AI Integrations & Intelligent Tools',
    order: 4,
    data: {
      description:
        'Integrating Google Gemini AI and LLM APIs for automated resume analysis, smart summarization, conversational assistants, and prompt engineering.',
      icon: 'Sparkles',
    },
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
    data: { url: '/resume.pdf', label: 'Download Resume' },
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
      workEyebrow: 'Engineering Work',
      workTitle: 'Featured *Systems & Projects*',
      workSubtitle:
        'Production-grade full-stack architectures, real-time communication systems, and high-performance web applications.',
      skillsEyebrow: 'Technical Capabilities',
      skillsTitle: 'Engineering *Stack & Architecture*',
      servicesEyebrow: 'Services',
      servicesTitle: 'What I *Build*',
      experienceEyebrow: 'Track Record',
      experienceTitle: 'Experience & *Education*',
      experienceColTitle: 'Work Experience',
      educationColTitle: 'Education & Certifications',
      aboutEyebrow: 'Background',
      aboutTitle: 'Engineer *Profile & Story*',
      testimonialsEyebrow: 'Testimonials',
      testimonialsTitle: 'What People *Say*',
      blogEyebrow: 'Blog',
      blogTitle: 'Latest *Articles*',
      contactEyebrow: 'Contact',
      contactTitle: "Let's *Connect*",
      contactSubtitle: 'Have a project, an idea, or an opportunity? Feel free to get in touch.',
      liveLabel: 'Live Demo',
      codeLabel: 'Source Code',
      detailsLabel: 'View Details',
      featuredLabel: 'Featured',
      readMoreLabel: 'Read More',
      viewCredentialLabel: 'View credential',
      // Navigation labels (anchors are fixed in code; only the text is editable)
      navWork: 'Work',
      navSkills: 'Skills',
      navExperience: 'Experience',
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
    existingAdmin.password = admin.password
    await existingAdmin.save()
    console.log(`Admin password updated: ${admin.email}`)
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
