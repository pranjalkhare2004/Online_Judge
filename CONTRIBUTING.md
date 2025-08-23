# Contributing to Online Judge Platform

Thank you for your interest in contributing to the Online Judge Platform! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use issue templates** when creating new issues
3. **Provide detailed information** including:
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details

### Feature Requests

1. **Check existing feature requests** to avoid duplicates
2. **Describe the feature** in detail
3. **Explain the use case** and benefits
4. **Consider implementation complexity**

### Code Contributions

#### Getting Started

1. **Fork the repository**
```bash
git clone https://github.com/your-username/online-judge.git
cd online-judge
```

2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Set up development environment**
```bash
# Backend setup
cd Backend
npm install
cp .env.example .env
# Configure your .env file
npm run dev

# Frontend setup (in new terminal)
cd ../ONLINE-JUDGE-FRONTEND
npm install
cp .env.example .env.local
# Configure your .env.local file
npm run dev
```

#### Development Guidelines

##### Code Style

- **Backend**: Follow Node.js best practices
- **Frontend**: Follow React/Next.js conventions
- **Use ESLint and Prettier** for code formatting
- **Write meaningful commit messages**

##### Commit Message Format
```
type(scope): description

- feat: new feature
- fix: bug fix
- docs: documentation changes
- style: formatting changes
- refactor: code refactoring
- test: adding tests
- chore: maintenance tasks
```

Example:
```
feat(auth): add OAuth login support
fix(backend): resolve submission processing issue
docs(readme): update installation instructions
```

##### Pull Request Process

1. **Ensure all tests pass**
```bash
# Backend tests
cd Backend && npm test

# Frontend tests
cd ONLINE-JUDGE-FRONTEND && npm test
```

2. **Update documentation** if needed
3. **Add/update tests** for new features
4. **Follow the PR template**
5. **Request review** from maintainers

#### Code Review Checklist

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Accessibility guidelines followed (frontend)

## 🏗️ Project Structure

### Backend Structure
```
Backend/
├── controllers/     # Request handlers
├── middleware/     # Custom middleware
├── models/        # Database models
├── routes/       # API routes
├── services/    # Business logic
├── utils/      # Utility functions
├── tests/     # Test files
└── server.js # Entry point
```

### Frontend Structure
```
ONLINE-JUDGE-FRONTEND/
├── app/           # Next.js App Router
├── components/   # React components
├── contexts/    # React contexts
├── hooks/      # Custom hooks
├── lib/       # Utility functions
└── types/    # TypeScript types
```

## 🧪 Testing

### Backend Testing
- **Unit tests**: Test individual functions
- **Integration tests**: Test API endpoints
- **E2E tests**: Test complete workflows

```bash
cd Backend
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
```

### Frontend Testing
- **Component tests**: Test React components
- **Hook tests**: Test custom hooks
- **E2E tests**: Test user workflows

```bash
cd ONLINE-JUDGE-FRONTEND
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:e2e    # E2E tests
```

## 📝 Documentation

### Code Documentation
- **Use JSDoc** for function documentation
- **Add inline comments** for complex logic
- **Update README** for new features
- **Include API documentation** for new endpoints

### Example JSDoc
```javascript
/**
 * Executes code in a sandboxed environment
 * @param {string} code - Source code to execute
 * @param {string} language - Programming language
 * @param {Array} testCases - Test cases to run
 * @returns {Promise<Object>} Execution results
 */
async function executeCode(code, language, testCases) {
  // Implementation
}
```

## 🚀 Deployment Testing

### Local Testing
```bash
# Test Docker builds
cd Backend && docker build -t backend-test .
cd ../ONLINE-JUDGE-FRONTEND && docker build -t frontend-test .

# Test with Docker Compose
docker-compose up --build
```

### AWS Testing
```bash
# Test deployment scripts
cd deployment/aws
./deploy.sh --dry-run
```

## 🐛 Bug Report Template

```markdown
**Bug Description**
A clear description of the bug.

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 91]
- Node.js: [e.g., 18.17.0]
```

## 💡 Feature Request Template

```markdown
**Feature Description**
A clear description of the feature.

**Problem it Solves**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Any alternative solutions considered?

**Additional Context**
Any other context or screenshots.
```

## 📋 Development Checklist

Before submitting a PR, ensure:

- [ ] Code follows style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console.log statements in production code
- [ ] Environment variables are documented
- [ ] Security best practices followed
- [ ] Performance impact considered
- [ ] Accessibility guidelines followed
- [ ] Mobile responsiveness tested (frontend)
- [ ] Cross-browser compatibility tested (frontend)

## 🎯 Areas for Contribution

### High Priority
- [ ] Contest management system
- [ ] Real-time leaderboards
- [ ] Performance optimizations
- [ ] Security enhancements

### Medium Priority
- [ ] Additional programming languages
- [ ] Code plagiarism detection
- [ ] Advanced analytics
- [ ] Mobile application

### Low Priority
- [ ] UI/UX improvements
- [ ] Documentation improvements
- [ ] Accessibility enhancements
- [ ] Internationalization

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Special contributors page (coming soon)

## 📞 Getting Help

- **Discord**: [Join our community](https://discord.gg/onlinejudge)
- **GitHub Discussions**: Ask questions and share ideas
- **Email**: maintainers@onlinejudge.com

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

Thank you for contributing to the Online Judge Platform! 🚀
