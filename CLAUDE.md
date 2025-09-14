# Claude Configuration for Ticket Fairy

## Project Overview

Ticket Fairy is a magical web application that transforms video recordings into project tickets with AI-powered analysis and seamless export capabilities. The project consists of:

- **Frontend**: React + TypeScript + Vite + Chakra UI
- **Backend**: Python Flask API with AI integrations
- **Core Features**: Screen recording, AI ticket generation, export to Jira/Linear

## Code Style Guidelines

### TypeScript/React Standards

- Use **TypeScript** for all new code
- Follow **React functional components** with hooks
- Use **Chakra UI** components for consistent styling
- Implement **proper error handling** with try-catch blocks
- Use **async/await** instead of Promise chains
- Follow **camelCase** for variables and functions
- Use **PascalCase** for components and interfaces

### File Organization

- Place components in `client/src/components/`
- Place custom hooks in `client/src/hooks/`
- Place utilities in `client/src/utils/`
- Use descriptive, clear file names (e.g., `useScreenRecording.ts`, `VideoPlayerModal.tsx`)

### Component Structure

```typescript
// Import order: React, third-party, local
import React from "react";
import { Box, Button } from "@chakra-ui/react";
import { useCustomHook } from "../hooks/useCustomHook";

// Props interface
interface ComponentProps {
  title: string;
  onAction: () => void;
}

// Component with proper typing
export const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
  // Component logic
  return <Box>{/* JSX content */}</Box>;
};
```

### Python Standards (Backend)

- Follow **PEP 8** style guidelines
- Use **type hints** for function parameters and returns
- Implement **proper error handling** with specific exceptions
- Use **descriptive variable names**
- Add **docstrings** for functions and classes

## Architecture Patterns

### State Management

- Use **React hooks** (`useState`, `useEffect`, `useCallback`)
- Create **custom hooks** for complex logic (e.g., `useScreenRecording`)
- Avoid prop drilling - use context when needed
- Keep state as close to usage as possible

### Recording System

- Use **WebRTC APIs** for screen/camera capture
- Implement **proper cleanup** of media streams
- Handle **browser compatibility** gracefully
- Provide **user-friendly error messages**

### AI Integration

- Use **Claude API** for ticket generation
- Implement **loading states** with progress indicators
- Handle **API errors** gracefully with fallbacks
- Cache responses when appropriate

## Development Practices

### Testing

- Write **unit tests** for utility functions
- Test **component rendering** and interactions
- Mock **external APIs** in tests
- Ensure **cross-browser compatibility**

### Performance

- Use **React.memo** for expensive components
- Implement **lazy loading** for large components
- Optimize **video handling** and memory usage
- Use **proper cleanup** in useEffect hooks

### Security

- **Validate all inputs** from users and APIs
- **Sanitize data** before displaying
- Use **environment variables** for sensitive data
- Implement **proper CORS** handling

## Feature Implementation Guidelines

### When Adding New Features

1. **Plan the component structure** before coding
2. **Create reusable components** when possible
3. **Implement proper TypeScript types**
4. **Add error handling and loading states**
5. **Test across different browsers**
6. **Update documentation** if needed

### UI/UX Standards

- Follow **Chakra UI design system**
- Implement **responsive design** (mobile-first)
- Use **consistent spacing** and typography
- Add **smooth animations** with Framer Motion
- Provide **clear user feedback** for all actions
- Ensure **accessibility** (ARIA labels, keyboard navigation)

### Recording Features

- Always **request permissions** before accessing media
- Provide **clear instructions** to users
- Handle **permission denials** gracefully
- Implement **countdown timers** for recording start
- Show **recording indicators** during capture
- Ensure **proper stream cleanup** on component unmount

### AI Features

- Show **loading animations** during processing
- Provide **progress indicators** for long operations
- Handle **API failures** with retry mechanisms
- Allow **user editing** of AI-generated content
- Cache **successful responses** to avoid re-processing

## Common Patterns

### Error Handling

```typescript
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  console.error("Operation failed:", error);
  // Show user-friendly error message
  toast({
    title: "Error",
    description: "Something went wrong. Please try again.",
    status: "error",
  });
}
```

### Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await performAction();
  } finally {
    setIsLoading(false);
  }
};
```

### Modal Patterns

- Use Chakra UI `Modal` components
- Implement proper focus management
- Handle escape key and overlay clicks
- Provide clear action buttons

## Review Criteria

When reviewing code, check for:

- [ ] **TypeScript compliance** - no `any` types
- [ ] **Error handling** - proper try-catch blocks
- [ ] **Loading states** - user feedback during async operations
- [ ] **Accessibility** - ARIA labels and keyboard navigation
- [ ] **Performance** - no unnecessary re-renders
- [ ] **Security** - input validation and sanitization
- [ ] **Testing** - adequate test coverage
- [ ] **Documentation** - clear comments for complex logic

## Dependencies

### Approved Libraries

- **UI**: Chakra UI, Framer Motion, React Icons
- **Routing**: React Router DOM
- **HTTP**: Fetch API (built-in)
- **State**: React hooks (built-in)
- **Build**: Vite, TypeScript
- **AWS**: AWS SDK for S3 integration

### Before Adding New Dependencies

1. Check if functionality exists in current stack
2. Evaluate bundle size impact
3. Consider maintenance and security implications
4. Discuss with team if significant

## Git Workflow

- Use **descriptive commit messages**
- Create **feature branches** for new work
- Keep **PRs focused** and reviewable
- Update **documentation** with code changes
- Test **thoroughly** before requesting review

## AI Assistant Guidelines

When working on this project:

1. **Understand the context** - this is a screen recording + AI ticket generation app
2. **Maintain consistency** with existing patterns and styles
3. **Focus on user experience** - smooth, intuitive interactions
4. **Handle edge cases** - network failures, permission denials, etc.
5. **Write production-ready code** - proper error handling, TypeScript, tests
6. **Consider performance** - video handling can be memory-intensive
7. **Follow security best practices** - validate inputs, sanitize outputs
8. **Document complex logic** - especially recording and AI integration code
