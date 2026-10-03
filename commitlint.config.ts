import type { UserConfig } from '@commitlint/types'

const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow lowercase-first subject (imperative mood)
    'subject-case': [2, 'always', ['lower-case', 'sentence-case']],
    
    // Restrict to project-supported commit types
    'type-enum': [2, 'always', [
      'feat', 'fix', 'refactor', 'perf', 'test',
      'docs', 'chore', 'build', 'ci', 'style'
    ]],
    
    // Allow breaking change syntax with !
    'subject-exclamation-mark': [0],
    
    // Allow breaking change footer
    'footer-max-line-length': [0],
    
    // Ensure subject is not empty
    'subject-empty': [2, 'never'],
    
    // Ensure type is not empty
    'type-empty': [2, 'never'],
    
    // Ensure subject has meaningful content
    'subject-min-length': [2, 'always', 3]
  },
  // Allow optional scope
  prompt: {
    questions: {
      scope: {
        description: 'Denote the scope of this change (optional)'
      }
    }
  }
}

export default Configuration