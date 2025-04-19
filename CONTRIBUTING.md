# Contributing to MCPBlitz

Thank you for your interest in contributing to MCPBlitz! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) to understand what actions will and will not be tolerated.

## Development Setup

### Prerequisites

- Node.js (v16+)
- MongoDB
- Redis
- Twitter API credentials
- Web3 wallet or provider

### Installation

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/mcpblitz.git
   cd mcpblitz
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file based on `.env.example`
5. Start the development server:
   ```bash
   npm run dev
   ```

## Making Changes

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   
2. Make your changes following our coding standards and guidelines.
   
3. Write tests for your changes:
   ```bash
   npm test
   ```
   
4. Ensure code passes linting:
   ```bash
   npm run lint
   ```
   
5. Commit your changes with a descriptive commit message:
   ```bash
   git commit -m "feat: add new feature xyz"
   ```
   
We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

## Pull Requests

1. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
   
2. Open a pull request against our `development` branch
   
3. In your pull request description, explain:
   - What you implemented/fixed
   - How it works
   - Why you made those changes
   - Any testing considerations
   
4. Wait for a maintainer to review your PR

## Code Standards

- Use ESLint and Prettier configured in the project
- Follow the existing code style
- Write descriptive comments for complex logic
- Include JSDoc documentation for functions and classes
- Keep functions focused on a single responsibility
- Use meaningful variable and function names

## Testing

- Write unit tests for new code
- Ensure all tests pass before submitting a PR
- Include integration tests for API endpoints
- Document test cases in comments

## Documentation

- Update documentation when changing functionality
- Document new features, API endpoints, and configuration options
- Keep the README, API docs, and other documentation in sync with code

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE). 