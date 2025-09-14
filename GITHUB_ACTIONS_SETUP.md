# Claude Code GitHub Actions Setup Guide

This guide will help you set up Claude Code GitHub Actions for the Ticket Fairy project, enabling AI-powered code assistance directly in your GitHub workflow.

## 🚀 Quick Setup (Recommended)

The easiest way to set up Claude Code GitHub Actions is using the built-in installer:

1. **Install Claude Code** (if not already installed):

   ```bash
   # Install Claude Code CLI
   npm install -g @anthropics/claude-code
   ```

2. **Run the GitHub App installer**:

   ```bash
   # Navigate to your project directory
   cd /Users/victor/Documents/ticketfairy/static-web

   # Run the installer
   claude /install-github-app
   ```

3. **Follow the prompts** to:
   - Install the Claude GitHub App to your repository
   - Set up the required API key secret
   - Configure permissions

## 🔧 Manual Setup (Alternative)

If the quick setup doesn't work, follow these manual steps:

### Step 1: Install Claude GitHub App

1. Go to: https://github.com/apps/claude
2. Click "Install" and select your repository
3. Grant the required permissions:
   - Contents (read/write)
   - Issues (read/write)
   - Pull requests (read/write)

### Step 2: Get Anthropic API Key

1. Visit: https://console.anthropic.com/
2. Sign in to your account
3. Go to "API Keys" section
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### Step 3: Add GitHub Repository Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ANTHROPIC_API_KEY`
5. Value: Your API key from Step 2
6. Click **Add secret**

### Step 4: Verify Workflow File

The workflow file has already been created at `.github/workflows/claude.yml`. It includes:

- Triggers for issue comments, PR comments, and new issues/PRs
- Proper permissions for Claude to interact with your repository
- Node.js setup for your React project
- Claude Code action configuration

## 🧪 Testing the Integration

Once setup is complete, test the integration:

### 1. Create a Test Issue

1. Go to your GitHub repository
2. Create a new issue with content like:
   ```
   @claude Can you help me add a new feature to improve the video recording quality?
   ```

### 2. Test PR Comments

1. Create a pull request
2. Add a comment mentioning Claude:
   ```
   @claude Please review this code and suggest improvements for performance
   ```

### 3. Test Direct Commands

You can also use Claude for specific tasks:

```
@claude /review - Review the current PR for issues
@claude implement user authentication for the video upload feature
@claude fix the TypeScript errors in the recording components
```

## 🎯 Usage Examples

Here are some practical ways to use Claude in your Ticket Fairy project:

### Code Review

```
@claude Please review this PR for:
- TypeScript best practices
- React performance optimizations
- Security considerations for video handling
```

### Feature Implementation

```
@claude Implement a feature to allow users to add annotations to recorded videos before generating tickets
```

### Bug Fixes

```
@claude There's a memory leak in the screen recording component. Can you identify and fix it?
```

### Documentation

```
@claude Update the README with instructions for the new export functionality
```

## ⚙️ Configuration Options

### Workflow Customization

You can modify `.github/workflows/claude.yml` to:

- **Change the model**: Update `--model claude-sonnet-4-20250514` to use different Claude models
- **Adjust max turns**: Modify `--max-turns 10` to allow longer conversations
- **Add custom instructions**: Include project-specific guidelines

### CLAUDE.md Guidelines

The `CLAUDE.md` file contains project-specific guidelines that Claude will follow:

- Code style preferences
- Architecture patterns
- Review criteria
- Security requirements
- UI/UX standards

You can modify this file to customize Claude's behavior for your project.

## 🔒 Security Best Practices

### API Key Security

- ✅ **DO**: Store API keys in GitHub Secrets
- ❌ **DON'T**: Commit API keys to your repository
- ✅ **DO**: Use repository secrets, not environment secrets
- ❌ **DON'T**: Share API keys in issue comments or PRs

### Permissions

- The workflow uses minimal required permissions
- Claude can only access what's necessary for code assistance
- All actions are logged in GitHub's audit trail

### Repository Access

- Claude only has access to repositories where the app is installed
- You can revoke access at any time through GitHub settings
- All interactions are tied to your GitHub identity

## 🛠️ Troubleshooting

### Claude Not Responding

**Issue**: Claude doesn't respond to `@claude` mentions

**Solutions**:

1. Check that the GitHub App is installed on your repository
2. Verify `ANTHROPIC_API_KEY` is set in repository secrets
3. Ensure the workflow file exists at `.github/workflows/claude.yml`
4. Check GitHub Actions tab for any workflow errors

### Workflow Failures

**Issue**: GitHub Actions workflow fails

**Solutions**:

1. Check the Actions tab for error details
2. Verify API key is valid and has sufficient credits
3. Ensure repository permissions are correctly set
4. Check if the workflow syntax is valid YAML

### Permission Errors

**Issue**: Claude can't create PRs or comments

**Solutions**:

1. Verify GitHub App permissions include:
   - Contents: Read and write
   - Issues: Read and write
   - Pull requests: Read and write
2. Check that the workflow has proper permissions block
3. Ensure you're a repository admin or have proper access

### API Rate Limits

**Issue**: API calls are being rate limited

**Solutions**:

1. Reduce `--max-turns` in the workflow
2. Use Claude more selectively for complex tasks
3. Consider upgrading your Anthropic API plan
4. Add delays between multiple Claude requests

## 📊 Monitoring Usage

### GitHub Actions Usage

- Monitor workflow runs in the **Actions** tab
- Check execution time and success rates
- Review logs for any issues or errors

### API Usage

- Monitor API usage in Anthropic Console
- Track costs and rate limits
- Set up billing alerts if needed

## 🔄 Updating

### Updating Claude Code Action

The workflow uses `@v1` which automatically gets patch updates. For major updates:

1. Check the [Claude Code Action releases](https://github.com/anthropics/claude-code-action/releases)
2. Update the version in `.github/workflows/claude.yml`
3. Test with a simple `@claude` mention

### Updating Configuration

- Modify `CLAUDE.md` to change Claude's behavior
- Update workflow triggers or permissions as needed
- Test changes with non-critical requests first

## 🆘 Support

If you encounter issues:

1. **Check Documentation**: [Claude Code GitHub Actions Docs](https://docs.anthropic.com/en/docs/claude-code/github-actions)
2. **GitHub Issues**: Report bugs in the Claude Code Action repository
3. **Anthropic Support**: Contact support for API-related issues
4. **Community**: Join the Anthropic Discord for community help

---

## ✅ Setup Checklist

- [ ] Claude GitHub App installed on repository
- [ ] `ANTHROPIC_API_KEY` added to repository secrets
- [ ] Workflow file exists at `.github/workflows/claude.yml`
- [ ] `CLAUDE.md` configuration file created
- [ ] Tested with a simple `@claude` mention
- [ ] Verified Claude responds appropriately
- [ ] Team members know how to use `@claude` mentions

Once all items are checked, your Claude Code GitHub Actions integration is ready! 🎉
