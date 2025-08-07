const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Initialize OpenAI (you'll need to set OPENAI_API_KEY in Railway environment)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Create uploads directory
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Database setup - use Railway's persistent storage
const dbPath = process.env.DATABASE_URL || './todos.db';
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    forward_email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Emails table
  db.run(`CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    html_body TEXT,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Attachments table
  db.run(`CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    mimetype TEXT NOT NULL,
    FOREIGN KEY (email_id) REFERENCES emails (id)
  )`);

  // Todos table (enhanced)
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    deadline TEXT,
    completed BOOLEAN DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    email_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (email_id) REFERENCES emails (id)
  )`);
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Generate unique forward email
function generateForwardEmail() {
  const domain = process.env.EMAIL_DOMAIN || 'yourdomain.com';
  return `todo-${uuidv4().substring(0, 8)}@${domain}`;
}

// Create sample todos for new users
function createSampleTodos(userId) {
  const sampleTodos = [
    {
      title: "Welcome to ToDone! 🎉",
      summary: "This is your first todo. You can edit, delete, or drag to reorder it.",
      priority: "HIGH",
      deadline: null,
      orderIndex: 1
    },
    {
      title: "Forward your first email",
      summary: "Try forwarding an email to your unique address to see AI-powered todo creation in action!",
      priority: "MEDIUM",
      deadline: null,
      orderIndex: 2
    },
    {
      title: "Explore the features",
      summary: "Drag todos to reorder, click 'View Email' on AI-generated todos, and mark items as complete.",
      priority: "LOW",
      deadline: null,
      orderIndex: 3
    }
  ];

  sampleTodos.forEach(todo => {
    db.run('INSERT INTO todos (user_id, title, summary, priority, deadline, order_index) VALUES (?, ?, ?, ?, ?, ?)', 
      [userId, todo.title, todo.summary, todo.priority, todo.deadline, todo.orderIndex]);
  });
}

// AI processing function
async function processEmailWithAI(subject, body) {
  try {
    const prompt = `Analyze this email and extract actionable tasks. Return a JSON object with:
    {
      "summary": "Brief summary of the main task",
      "priority": "HIGH/MEDIUM/LOW",
      "deadline": "YYYY-MM-DD if mentioned, otherwise null",
      "notes": "Additional important details"
    }

    Email Subject: ${subject}
    Email Body: ${body.substring(0, 1000)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('AI processing error:', error);
    return {
      summary: subject,
      priority: 'MEDIUM',
      deadline: null,
      notes: 'AI processing failed, using email subject as task'
    };
  }
}

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes

// User registration
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const forwardEmail = generateForwardEmail();
    
    db.run('INSERT INTO users (email, password, forward_email) VALUES (?, ?, ?)', 
      [email, hashedPassword, forwardEmail], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      const userId = this.lastID;
      const token = jwt.sign({ userId, email }, JWT_SECRET);
      
      // Create sample todos for new user
      createSampleTodos(userId);
      
      res.json({ 
        message: 'User registered successfully',
        token,
        forwardEmail
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    res.json({ 
      message: 'Login successful',
      token,
      forwardEmail: user.forward_email
    });
  });
});

// Get user info
app.get('/api/user', authenticateToken, (req, res) => {
  db.get('SELECT id, email, forward_email FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(user);
  });
});

// Get todos for user
app.get('/api/todos', authenticateToken, (req, res) => {
  db.all(`
    SELECT t.*, e.subject as email_subject, e.from_email 
    FROM todos t 
    LEFT JOIN emails e ON t.email_id = e.id 
    WHERE t.user_id = ? 
    ORDER BY t.order_index ASC, t.created_at DESC
  `, [req.user.userId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows || []);
  });
});

// Create todo
app.post('/api/todos', authenticateToken, (req, res) => {
  const { title, summary, priority, deadline } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  db.get('SELECT MAX(order_index) as maxOrder FROM todos WHERE user_id = ?', [req.user.userId], (err, result) => {
    const orderIndex = (result && result.maxOrder ? result.maxOrder : 0) + 1;
    
    db.run('INSERT INTO todos (user_id, title, summary, priority, deadline, order_index) VALUES (?, ?, ?, ?, ?, ?)', 
      [req.user.userId, title, summary, priority || 'MEDIUM', deadline, orderIndex], function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, title, summary, priority, deadline, orderIndex });
    });
  });
});

// Update todo
app.put('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, summary, priority, deadline, completed, orderIndex } = req.body;
  
  db.run('UPDATE todos SET title = ?, summary = ?, priority = ?, deadline = ?, completed = ?, order_index = ? WHERE id = ? AND user_id = ?', 
    [title, summary, priority, deadline, completed ? 1 : 0, orderIndex, id, req.user.userId], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Updated successfully' });
  });
});

// Delete todo
app.delete('/api/todos/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM todos WHERE id = ? AND user_id = ?', [id, req.user.userId], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Deleted successfully' });
  });
});

// Reorder todos
app.post('/api/todos/reorder', authenticateToken, (req, res) => {
  const { todoIds } = req.body;
  
  if (!Array.isArray(todoIds)) {
    return res.status(400).json({ error: 'todoIds must be an array' });
  }
  
  const updates = todoIds.map((id, index) => {
    return new Promise((resolve, reject) => {
      db.run('UPDATE todos SET order_index = ? WHERE id = ? AND user_id = ?', 
        [index + 1, id, req.user.userId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  
  Promise.all(updates)
    .then(() => res.json({ message: 'Reordered successfully' }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Get email details
app.get('/api/emails/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get(`
    SELECT e.*, GROUP_CONCAT(a.filename) as attachments 
    FROM emails e 
    LEFT JOIN attachments a ON e.id = a.email_id 
    WHERE e.id = ? AND e.user_id = ?
    GROUP BY e.id
  `, [id, req.user.userId], (err, email) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }
    res.json(email);
  });
});

// Email webhook (for receiving forwarded emails)
app.post('/api/email-webhook', upload.array('attachments'), async (req, res) => {
  try {
    const { from, to, subject, text, html } = req.body;
    
    // Find user by forward email
    db.get('SELECT id FROM users WHERE forward_email = ?', [to], async (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Save email
      db.run('INSERT INTO emails (user_id, from_email, subject, body, html_body) VALUES (?, ?, ?, ?, ?)', 
        [user.id, from, subject, text || '', html || ''], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        const emailId = this.lastID;
        
        // Save attachments
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            db.run('INSERT INTO attachments (email_id, filename, filepath, mimetype) VALUES (?, ?, ?, ?)', 
              [emailId, file.originalname, file.filename, file.mimetype]);
          });
        }
        
        // Process with AI and create todo
        processEmailWithAI(subject, text || html || '').then(aiResult => {
          db.get('SELECT MAX(order_index) as maxOrder FROM todos WHERE user_id = ?', [user.id], (err, result) => {
            const orderIndex = (result && result.maxOrder ? result.maxOrder : 0) + 1;
            
            db.run('INSERT INTO todos (user_id, title, summary, priority, deadline, order_index, email_id) VALUES (?, ?, ?, ?, ?, ?, ?)', 
              [user.id, aiResult.summary, aiResult.notes, aiResult.priority, aiResult.deadline, orderIndex, emailId]);
          });
        });
        
        res.json({ message: 'Email processed successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Email processing failed' });
  }
});

// Serve static files
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ToDone app running on port ${PORT}`);
  console.log(`📝 Sign up and get your forward email at http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 