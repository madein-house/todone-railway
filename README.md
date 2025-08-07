# ToDone - Email to Todo App

A modern web application that converts forwarded emails into organized todo lists using AI. Deployed on Railway for easy one-click deployment.

## 🚀 Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new?template=https://github.com/yourusername/todone-railway)

## ✨ Features

- **User Authentication**: Secure signup/login with JWT
- **Email Forwarding**: Get a unique email address to forward emails to
- **AI Processing**: Automatically extracts tasks, priorities, and deadlines from emails
- **Drag & Drop**: Reorder todos with intuitive drag and drop
- **Email Viewing**: Click to view original emails and attachments
- **Priority Levels**: HIGH, MEDIUM, LOW priority tasks
- **Deadlines**: Automatic deadline extraction from emails
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/todone-railway.git
cd todone-railway

# Install dependencies
npm install

# Start the development server
npm start
```

## 🌐 Railway Deployment

### One-Click Deploy
1. Click the "Deploy on Railway" button above
2. Connect your GitHub account
3. Railway will automatically deploy your app

### Manual Deploy
1. Fork this repository
2. Go to [Railway](https://railway.app)
3. Create a new project
4. Connect your GitHub repository
5. Railway will automatically detect and deploy

## 🔧 Environment Variables

Set these in your Railway project settings:

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT tokens | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI processing | Optional |
| `EMAIL_DOMAIN` | Domain for forward emails | Optional |
| `FRONTEND_URL` | Frontend URL for CORS | Optional |

### Getting OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an account and get your API key
3. Add it to Railway environment variables

## 📧 Email Forwarding Setup

After deployment, you'll get a unique forward email like:
`todo-abc123@yourdomain.com`

To set up email forwarding:
1. Use an email service like SendGrid, Mailgun, or Resend
2. Configure webhooks to point to your Railway app's `/api/email-webhook` endpoint
3. Forward emails to your unique address

## 🗄️ Database

The app uses SQLite with Railway's persistent storage. The database is automatically created and managed by Railway.

## 📱 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `GET /api/user` - Get current user info

### Todos
- `GET /api/todos` - Get all todos for user
- `POST /api/todos` - Create new todo
- `PUT /api/todos/:id` - Update todo
- `DELETE /api/todos/:id` - Delete todo
- `POST /api/todos/reorder` - Reorder todos

### Email
- `GET /api/emails/:id` - Get email details
- `POST /api/email-webhook` - Email processing webhook

### Health
- `GET /health` - Health check endpoint

## 🎯 How to Use

1. **Sign up** with your email and password
2. **Copy your forward email** (shown after registration)
3. **Forward emails** to that address from your email client
4. **Watch as AI creates todos** automatically with summaries and priorities
5. **Drag to reorder** your todos as needed
6. **Click "View Email"** to see the original email and attachments

## 🔒 Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- CORS protection
- Input validation and sanitization
- SQL injection protection

## 🚀 Performance

- Lightweight SQLite database
- Efficient queries with proper indexing
- Static file serving
- Optimized for Railway's infrastructure

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🆘 Support

If you encounter any issues:
1. Check the Railway logs
2. Verify environment variables are set
3. Ensure the database is properly initialized
4. Check the health endpoint: `https://your-app.railway.app/health`

---

Happy todo-ing! 🎉 