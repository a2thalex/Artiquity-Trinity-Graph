# Heroku Deployment Guide for Artiquity Trinity Graph

This guide will help you deploy the Artiquity Trinity Graph application to Heroku.

## Prerequisites

1. **Heroku Account**: Sign up at [heroku.com](https://heroku.com)
2. **Heroku CLI**: Install from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Git**: Ensure your project is in a Git repository

## Step 1: Prepare Your Application

The application is already configured for Heroku with:
- `Procfile` - Tells Heroku how to run your app
- `heroku-postbuild` script - Builds the frontend during deployment
- Dynamic port configuration - Uses Heroku's assigned port
- Static file serving - Serves the built React app in production

## Step 2: Create a Heroku App

```bash
# Login to Heroku
heroku login

# Create a new Heroku app (replace 'your-app-name' with your desired name)
heroku create your-app-name

# Or let Heroku generate a name
heroku create
```

## Step 3: Set Environment Variables

Set your API keys and configuration:

```bash
# Required: Google Gemini API Key
heroku config:set GEMINI_API_KEY=your_gemini_api_key_here

# Required: FAL AI API Key
heroku config:set FAL_API_KEY=your_fal_api_key_here

# Required: Perplexity API Key (for real-time web search)
heroku config:set PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Optional: Set Node environment
heroku config:set NODE_ENV=production

# Verify your config
heroku config
```

## Step 4: Deploy to Heroku

```bash
# Add Heroku remote (if not already added)
heroku git:remote -a your-app-name

# Deploy your application
git push heroku main

# Or if you're on a different branch
git push heroku your-branch:main
```

## Step 5: Open Your Application

```bash
# Open your deployed app in the browser
heroku open

# Or check the logs if there are issues
heroku logs --tail
```

## Environment Variables Required

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI generation | Yes |
| `FAL_API_KEY` | FAL AI API key for image generation | Yes |
| `PERPLEXITY_API_KEY` | Perplexity API key for real-time web search | Yes |
| `NODE_ENV` | Set to 'production' for production builds | Auto-set |
| `PORT` | Port for the server (auto-assigned by Heroku) | Auto-set |

## Troubleshooting

### Build Failures
```bash
# Check build logs
heroku logs --tail --dyno=build

# Restart the app
heroku restart
```

### Runtime Issues
```bash
# Check application logs
heroku logs --tail

# Check dyno status
heroku ps
```

### Environment Variables
```bash
# List all config vars
heroku config

# Set a new variable
heroku config:set VARIABLE_NAME=value

# Remove a variable
heroku config:unset VARIABLE_NAME
```

## Quick Deploy Script

You can also use the npm script for quick deployment:

```bash
npm run deploy:heroku
```

## Application Structure

- **Frontend**: React + Vite application served as static files
- **Backend**: Express.js API server handling AI requests
- **Build Process**: Vite builds the frontend, Heroku serves both frontend and API
- **Routing**: API routes under `/api/*`, all other routes serve the React app

## Performance Optimization

The application is configured for production with:
- Gzip compression
- Static file caching
- Optimized build process
- Environment-based configuration

Your Artiquity Trinity Graph application will be available at:
`https://your-app-name.herokuapp.com`
