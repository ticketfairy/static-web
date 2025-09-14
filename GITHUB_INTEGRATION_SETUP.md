# GitHub Issues Integration Setup

This guide will help you set up GitHub Issues integration for Ticket Fairy, allowing you to automatically create GitHub issues from your AI-generated tickets.

## 🚀 Quick Setup

### 1. Create a GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name like "Ticket Fairy Integration"
4. Select the appropriate scopes:

   - For **public repositories**: `public_repo`
   - For **private repositories**: `repo` (full control)
   - For **organization repositories**: `repo` + `read:org`

5. Click **"Generate token"**
6. **Copy the token immediately** (you won't be able to see it again)

### 2. Add Token to Environment Variables

Add your GitHub token to the server's `.env` file:

```bash
# In /server/.env
GITHUB_TOKEN=ghp_your_token_here
```

### 3. Test the Integration

Run the test script to verify everything works:

```bash
cd server
python test_github_integration.py
```

## 🎯 Usage

### Creating GitHub Issues from Tickets

1. **Generate a ticket** from any video in Ticket Fairy
2. **Open the ticket modal** by clicking "📋 VIEW TICKET"
3. **Click the "GitHub" button** in the ticket modal footer
4. **Configure the repository**:
   - Enter repository name in format `owner/repo`
   - The system will validate access automatically
5. **Add optional metadata**:
   - Labels (e.g., "bug", "feature", "enhancement")
   - Assignees (GitHub usernames)
6. **Click "Create Issue"**
7. **View the created issue** on GitHub

### Repository Configuration

- **Repository format**: `owner/repository-name`
- **Examples**:
  - `microsoft/vscode`
  - `facebook/react`
  - `your-username/your-project`

The integration will:

- ✅ Validate repository access
- ✅ Check if issues are enabled
- ✅ Verify your permissions
- ✅ Remember your last used repository

## 🔧 Advanced Configuration

### Custom Labels

You can add labels to categorize your issues:

- **Bug reports**: `bug`, `issue`
- **Feature requests**: `feature`, `enhancement`
- **Documentation**: `documentation`, `docs`
- **Questions**: `question`, `help wanted`

### Assignees

Assign issues to team members by adding their GitHub usernames:

- Must be valid GitHub usernames
- Users must have access to the repository
- You can assign multiple people

## 🔒 Security & Permissions

### Token Permissions

Your GitHub token needs these permissions:

| Permission    | Purpose                    | Required For       |
| ------------- | -------------------------- | ------------------ |
| `public_repo` | Access public repositories | Public repos only  |
| `repo`        | Full repository access     | Private repos      |
| `read:org`    | Read organization info     | Organization repos |

### Best Practices

- ✅ **Use a dedicated token** for Ticket Fairy
- ✅ **Store tokens securely** in environment variables
- ✅ **Regularly rotate tokens** (GitHub recommends yearly)
- ✅ **Use minimal required permissions**
- ❌ **Never commit tokens** to version control
- ❌ **Don't share tokens** in chat or email

## 🐛 Troubleshooting

### Common Issues

#### "Authentication failed"

- **Cause**: Invalid or expired GitHub token
- **Solution**: Generate a new token with correct permissions

#### "Repository not found"

- **Cause**: Repository doesn't exist or no access
- **Solution**: Check repository name format (`owner/repo`)

#### "Issues are disabled"

- **Cause**: Repository has issues disabled
- **Solution**: Enable issues in repository settings

#### "Forbidden"

- **Cause**: Token lacks required permissions
- **Solution**: Update token with `repo` or `public_repo` scope

### Testing Connection

Use the test script to diagnose issues:

```bash
cd server
python test_github_integration.py
```

### Server Logs

Check Flask server logs for detailed error messages:

```bash
# Start server with debug mode
cd server
python api.py
```

## 🚀 API Endpoints

### Create GitHub Issue

```http
POST http://localhost:4000/create-github-issue
Content-Type: application/json

{
  "title": "Issue title",
  "description": "Issue description",
  "repo_name": "owner/repo",
  "labels": ["bug", "urgent"],
  "assignees": ["username1", "username2"]
}
```

### Validate Repository

```http
POST http://localhost:4000/github-repo-info
Content-Type: application/json

{
  "repo_name": "owner/repo"
}
```

## 📋 Integration Checklist

- [ ] GitHub personal access token created
- [ ] Token added to `.env` file with correct permissions
- [ ] Test script runs successfully
- [ ] Flask server is running
- [ ] Repository access validated in web app
- [ ] Test issue created and visible on GitHub
- [ ] Team members can access and use the integration

## 🔄 Workflow Example

1. **Record a video** showing a bug or feature request
2. **Generate AI ticket** using Ticket Fairy
3. **Review and edit** the ticket title/description
4. **Click "GitHub"** to create an issue
5. **Configure repository** and add labels/assignees
6. **Issue is created** and team is notified
7. **Track progress** on GitHub

## 🆘 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Run the test script** to identify problems
3. **Verify token permissions** in GitHub settings
4. **Check server logs** for detailed error messages
5. **Test with a simple public repository** first

---

## 📚 Additional Resources

- [GitHub Personal Access Tokens Documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub REST API - Issues](https://docs.github.com/en/rest/issues/issues)
- [Repository Settings - Issues](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/disabling-issues)

Happy ticket creation! 🎉
