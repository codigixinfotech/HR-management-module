import { candidatesApi } from './recruitment';

export interface Question {
  id: string;
  technology: string;
  topic: string;
  questionText: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'MCQ' | 'Multiple Select' | 'True-False' | 'Coding';
  options: string[];
  correctAnswer: any; // index or array of indexes or boolean string or string
  marks: number;
  explanation: string;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: { input: string; expectedOutput: string }[];
  status: 'Active' | 'Inactive';
}

export interface AssessmentSection {
  id: string;
  name: string;
  technology: string;
  topic?: string;
  questionType: 'MCQ' | 'Multiple Select' | 'True-False' | 'Coding';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  selectedQuestions?: Question[];
}

export interface Assessment {
  id: string;
  name: string;
  technology: string;
  jobPosition: string;
  requisitionId?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  durationMins: number;
  passingPercentage: number;
  totalMarks: number;
  attemptLimit: number;
  startDate: string;
  expiryDate: string;
  sections?: AssessmentSection[];
  questions: Question[];
  status: 'Draft' | 'Ready' | 'Published' | 'Expired' | 'Archived';
}

export interface QuestionResult {
  questionId: string;
  questionText: string;
  candidateAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
  explanation: string;
  codeLanguage?: string;
  submittedCode?: string;
  testCasesPassed?: number;
  testCasesTotal?: number;
}

export interface CandidateAssessmentAttempt {
  token: string;
  assessmentId: string;
  assessmentName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobPosition: string;
  technology: string;
  durationMins: number;
  questionCount: number;
  passingPercentage: number;
  expiryDate: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  durationMinutes?: number;
  emailSendingMode?: 'IMMEDIATE' | 'SCHEDULED';
  emailStatus?: 'SENT' | 'SCHEDULED';
  assessmentStatus?: 'SCHEDULED' | 'WAITING_FOR_START' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'PENDING_REVIEW';
  status: 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'PENDING_REVIEW';
  sentAt: string;
  startedAt?: string;
  submittedAt?: string;
  answers: Record<string, any>;
  markedForReview: string[];
  score?: number;
  totalMarks?: number;
  percentage?: number;
  isPassed?: boolean;
  timeTakenSeconds?: number;
  questionResults?: QuestionResult[];
  sections?: AssessmentSection[];
}

const STORAGE_KEYS = {
  QUESTIONS: 'ehcm_assessment_questions_v5',
  ASSESSMENTS: 'ehcm_assessments_v5',
  ATTEMPTS: 'ehcm_candidate_attempts_v5',
};

// Seed questions are maintained for Question Bank auto-selection
const SEED_ASSESSMENTS: Assessment[] = [];
const SEED_ATTEMPTS: CandidateAssessmentAttempt[] = [];

const SEED_QUESTIONS: Question[] = [
  // ── 1. APTITUDE QUESTIONS (10 QUESTIONS - TECH: General) ──
  {
    id: 'QST-APT-01',
    technology: 'General',
    topic: 'Speed & Distance',
    questionText: 'A train covers 120 km in 2 hours. What is its speed in meters per second (m/s)?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['16.67 m/s', '20 m/s', '25 m/s', '30 m/s'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'Speed = 120km / 2h = 60 km/h. 60 * (5/18) = 16.67 m/s.',
    status: 'Active',
  },
  {
    id: 'QST-APT-02',
    technology: 'General',
    topic: 'Work & Time',
    questionText: 'If 6 workers complete a task in 12 days, how many days will 9 workers take to complete the same task?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['6 Days', '8 Days', '9 Days', '10 Days'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'Total man-days = 6 * 12 = 72. Days for 9 workers = 72 / 9 = 8 days.',
    status: 'Active',
  },
  {
    id: 'QST-APT-03',
    technology: 'General',
    topic: 'Percentages',
    questionText: 'What is 15% of 480?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['64', '72', '75', '80'],
    correctAnswer: 1,
    marks: 1,
    explanation: '15% of 480 = (15 / 100) * 480 = 72.',
    status: 'Active',
  },
  {
    id: 'QST-APT-04',
    technology: 'General',
    topic: 'Ratio & Proportion',
    questionText: 'If A:B = 2:3 and B:C = 4:5, what is A:C?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['8:15', '2:5', '6:15', '8:12'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'A:B = 8:12, B:C = 12:15 => A:B:C = 8:12:15 => A:C = 8:15.',
    status: 'Active',
  },
  {
    id: 'QST-APT-05',
    technology: 'General',
    topic: 'Averages',
    questionText: 'The average of 5 numbers is 20. If one number is excluded, the average becomes 18. What is the excluded number?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['24', '28', '30', '32'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'Sum of 5 numbers = 100. Sum of 4 numbers = 72. Excluded number = 100 - 72 = 28.',
    status: 'Active',
  },
  {
    id: 'QST-APT-06',
    technology: 'General',
    topic: 'Profit & Loss',
    questionText: 'A seller buys an item for $200 and sells it for $250. What is the profit percentage?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['20%', '25%', '30%', '50%'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'Profit = $50. Profit % = (50 / 200) * 100 = 25%.',
    status: 'Active',
  },
  {
    id: 'QST-APT-07',
    technology: 'General',
    topic: 'Simple Interest',
    questionText: 'Find the Simple Interest on $1,000 at 5% per annum for 3 years.',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['$120', '$150', '$180', '$200'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'SI = (P * R * T) / 100 = (1000 * 5 * 3) / 100 = $150.',
    status: 'Active',
  },
  {
    id: 'QST-APT-08',
    technology: 'General',
    topic: 'Probability',
    questionText: 'What is the probability of rolling an even number on a standard 6-sided die?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['1/6', '1/3', '1/2', '2/3'],
    correctAnswer: 2,
    marks: 1,
    explanation: 'Even numbers = {2, 4, 6} (3 outcomes). Probability = 3/6 = 1/2.',
    status: 'Active',
  },
  {
    id: 'QST-APT-09',
    technology: 'General',
    topic: 'Numbers & Ages',
    questionText: 'The sum of ages of father and son is 50. Five years ago, father was 7 times as old as son. How old is the father now?',
    difficulty: 'Hard',
    questionType: 'MCQ',
    options: ['38 Years', '40 Years', '42 Years', '45 Years'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'F + S = 50. (F - 5) = 7*(S - 5). Solving yields F = 40 years, S = 10 years.',
    status: 'Active',
  },
  {
    id: 'QST-APT-10',
    technology: 'General',
    topic: 'Pipes & Cisterns',
    questionText: 'Pipe A can fill a tank in 4 hours, Pipe B in 6 hours. How long will both take together?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['2.4 Hours', '3.0 Hours', '2.0 Hours', '3.5 Hours'],
    correctAnswer: 0,
    marks: 1,
    explanation: '1/4 + 1/6 = 5/12 per hour. Time taken = 12/5 = 2.4 hours.',
    status: 'Active',
  },

  // ── 2. LOGICAL REASONING QUESTIONS (10 QUESTIONS - TECH: Reasoning) ──
  {
    id: 'QST-LOG-01',
    technology: 'Reasoning',
    topic: 'Number Series',
    questionText: 'Find the next number in the logical sequence: 2, 6, 12, 20, 30, __ ?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['40', '42', '44', '48'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'Differences increase by 2: +4, +6, +8, +10, +12. 30 + 12 = 42.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-02',
    technology: 'Reasoning',
    topic: 'Coding-Decoding',
    questionText: 'If CAT is coded as 3-1-20, how is DOG coded in the same scheme?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['4-15-7', '4-14-7', '3-15-7', '4-15-8'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'Alphabetical indices: D=4, O=15, G=7.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-03',
    technology: 'Reasoning',
    topic: 'Blood Relations',
    questionText: 'A pointing to B says: "She is the daughter of my grandfather\'s only son." How is B related to A?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['Mother', 'Sister', 'Aunt', 'Cousin'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'Grandfather\'s only son = Father. Father\'s daughter = Sister.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-04',
    technology: 'Reasoning',
    topic: 'Direction Sense',
    questionText: 'A person walks 5 km North, turns right and walks 3 km, then turns right again and walks 5 km. Where is he from start?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['3 km East', '3 km West', '5 km North', '8 km East'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'North and South movements cancel out. Net displacement is 3 km East.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-05',
    technology: 'Reasoning',
    topic: 'Syllogism',
    questionText: 'All Cats are Dogs. All Dogs are Animals. Conclusion: Are all Cats Animals?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['True', 'False', 'Cannot be determined'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'Transitive property: Cats ⊆ Dogs ⊆ Animals => All Cats are Animals.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-06',
    technology: 'Reasoning',
    topic: 'Odd One Out',
    questionText: 'Find the odd one out: Mercury, Venus, Mars, Moon, Jupiter.',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['Mercury', 'Mars', 'Moon', 'Jupiter'],
    correctAnswer: 2,
    marks: 1,
    explanation: 'Moon is a natural satellite; all others are planets.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-07',
    technology: 'Reasoning',
    topic: 'Analogy',
    questionText: 'Doctor is to Hospital as Teacher is to _____ ?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['Office', 'School', 'Library', 'University'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'Doctor works in a Hospital; Teacher works in a School.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-08',
    technology: 'Reasoning',
    topic: 'Letter Series',
    questionText: 'Complete the series: A, C, F, J, O, __ ?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['S', 'T', 'U', 'V'],
    correctAnswer: 2,
    marks: 1,
    explanation: 'Gap increases by +1: A(+2)C(+3)F(+4)J(+5)O(+6)U.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-09',
    technology: 'Reasoning',
    topic: 'Seating Arrangement',
    questionText: 'Five friends A, B, C, D, E sit in a row. C is in middle. A is left of B. D is right of E. Who sits next to C?',
    difficulty: 'Hard',
    questionType: 'MCQ',
    options: ['A and B', 'B and D', 'A and D', 'E and B'],
    correctAnswer: 2,
    marks: 1,
    explanation: 'Arrangement: E, D, C, A, B. D and A sit adjacent to C.',
    status: 'Active',
  },
  {
    id: 'QST-LOG-10',
    technology: 'Reasoning',
    topic: 'Statement & Conclusion',
    questionText: 'Statement: "Every employee in company X works 40 hours a week." Conclusion: Part-time work is allowed.',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['Follows', 'Does not follow', 'Partially follows'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'Statement states everyone works 40 hours (full-time). Conclusion does not follow.',
    status: 'Active',
  },

  // ── 3. TECHNICAL QUESTIONS (20+ QUESTIONS - TECH: React.js & DevOps) ──
  {
    id: 'QST-TEC-01',
    technology: 'React.js',
    topic: 'React Hooks',
    questionText: 'Which hook should be used to perform side effects such as data fetching or DOM subscriptions in functional components?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['useState', 'useEffect', 'useMemo', 'useRef'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'useEffect is designed specifically for side effects based on dependency inputs.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-02',
    technology: 'React.js',
    topic: 'State Management',
    questionText: 'What are valid ways to prevent unnecessary child component re-renders when parent state updates?',
    difficulty: 'Medium',
    questionType: 'Multiple Select',
    options: [
      'Wrapping child component in React.memo()',
      'Passing callbacks wrapped in useCallback()',
      'Using useLayoutEffect() on parent container',
      'Memoizing expensive values with useMemo()',
    ],
    correctAnswer: [0, 1, 3],
    marks: 1,
    explanation: 'React.memo, useCallback, and useMemo preserve shallow reference equality across re-renders.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-03',
    technology: 'React.js',
    topic: 'React Hooks',
    questionText: 'Which hook provides a persistent mutable object ref whose .current property persists across re-renders without triggering re-renders?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['useRef', 'useState', 'useMemo', 'useCallback'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'useRef returns a mutable object whose current property persists across component lifetimes without triggering renders.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-04',
    technology: 'React.js',
    topic: 'React Hooks',
    questionText: 'When should useLayoutEffect be used instead of useEffect?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: [
      'When performing DOM measurements prior to browser repaint to prevent visual flickering',
      'For API data fetching on page load',
      'For logging state updates asynchronously',
      'For timer callbacks',
    ],
    correctAnswer: 0,
    marks: 1,
    explanation: 'useLayoutEffect runs synchronously after all DOM mutations before browser repaints.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-05',
    technology: 'React.js',
    topic: 'Context API',
    questionText: 'True or False: Updating a React Context value causes ALL child components consuming that context to re-render.',
    difficulty: 'Easy',
    questionType: 'True-False',
    options: ['True', 'False'],
    correctAnswer: 'True',
    marks: 1,
    explanation: 'When Context provider value changes, all descendant context subscribers re-render.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-06',
    technology: 'React.js',
    topic: 'React Hooks',
    questionText: 'What does the dependency array `[]` passed as the second argument to `useEffect` signify?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['Run effect on every render', 'Run effect only once after initial component mount', 'Never run effect', 'Run effect on unmount only'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'An empty dependency array [] tells React the effect does not depend on state/props, running once on mount.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-07',
    technology: 'React.js',
    topic: 'Virtual DOM',
    questionText: 'What is the key purpose of keys in React list rendering?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: [
      'To give elements unique identity to help React identify inserted, updated or deleted items efficiently during reconciliation',
      'To style list items automatically',
      'To bind event handlers to list items',
      'To sort list elements alphabetically',
    ],
    correctAnswer: 0,
    marks: 1,
    explanation: 'Keys help React reconciliation match Virtual DOM elements with real DOM nodes accurately.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-08',
    technology: 'React.js',
    topic: 'State Management',
    questionText: 'Which state update pattern is recommended when new state depends on previous state value?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['setState(state + 1)', 'setState((prevState) => prevState + 1)', 'setState(forceUpdate())', 'setState(Object.assign(state))'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'Functional state updates `setState(prev => prev + 1)` guarantee reliable updates against batched state queues.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-09',
    technology: 'React.js',
    topic: 'React Hooks',
    questionText: 'Which React hook is ideal for managing complex state logic with multiple sub-values or reducer functions?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['useReducer', 'useState', 'useContext', 'useImperativeHandle'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'useReducer handles state transitions using action objects, similar to Redux pattern.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-10',
    technology: 'React.js',
    topic: 'Performance Optimization',
    questionText: 'What is code splitting in React applications usually achieved with?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['React.lazy() and Suspense', 'React.memo() and useMemo()', 'Redux Toolkit', 'Webpack babel-loader'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'React.lazy() combined with Suspense enables dynamic import code splitting at component boundaries.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-11',
    technology: 'DevOps',
    topic: 'Kubernetes',
    questionText: 'Which Kubernetes object ensures a set number of pod replicas are running at any given time?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['Ingress', 'ReplicaSet', 'ConfigMap', 'Service'],
    correctAnswer: 1,
    marks: 1,
    explanation: 'ReplicaSet maintains a stable set of replica Pods running at any given time.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-12',
    technology: 'DevOps',
    topic: 'CI/CD Pipelines',
    questionText: 'What is the primary purpose of automated CI/CD pipelines in DevOps practices?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: [
      'To build, test, and deploy code continuously with minimal manual intervention',
      'To monitor CPU usage of virtual machines',
      'To design database relational schemas',
      'To compress log files for archival storage',
    ],
    correctAnswer: 0,
    marks: 1,
    explanation: 'CI/CD automates build, test, and release pipelines.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-13',
    technology: 'DevOps',
    topic: 'Docker Containers',
    questionText: 'Which Docker CLI command builds a container image directly from a Dockerfile instructions file?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: ['docker run', 'docker build', 'docker create', 'docker push'],
    correctAnswer: 1,
    marks: 1,
    explanation: '`docker build` compiles an image from Dockerfile.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-14',
    technology: 'DevOps',
    topic: 'Infrastructure as Code',
    questionText: 'Which tool is widely used for Declarative Infrastructure as Code (IaC) across multiple cloud providers?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['Terraform', 'Ansible', 'Jenkins', 'Prometheus'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'Terraform uses HCL to manage cloud infrastructure declaratively.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-15',
    technology: 'DevOps',
    topic: 'Kubernetes',
    questionText: 'Which Kubernetes component acts as the main control plane API server entry point?',
    difficulty: 'Medium',
    questionType: 'MCQ',
    options: ['kube-apiserver', 'kubelet', 'kube-proxy', 'etcd'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'kube-apiserver validates and configures data for API objects.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-16',
    technology: 'React.js',
    topic: 'React Hooks',
    questionText: 'What is the rules of hooks requirement in React?',
    difficulty: 'Easy',
    questionType: 'MCQ',
    options: [
      'Hooks must be called only at the top level of React function components or custom hooks',
      'Hooks can be called inside loops and conditionals',
      'Hooks must be declared in class components',
      'Hooks must return JSX elements',
    ],
    correctAnswer: 0,
    marks: 1,
    explanation: 'Hooks rely on call order and must not be called inside loops, conditions, or nested functions.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-17',
    technology: 'React.js',
    topic: 'Props & State',
    questionText: 'True or False: Props in React are read-only and immutable by the child component that receives them.',
    difficulty: 'Easy',
    questionType: 'True-False',
    options: ['True', 'False'],
    correctAnswer: 'True',
    marks: 1,
    explanation: 'Props are strictly read-only within child components.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-18',
    technology: 'React.js',
    topic: 'React Hooks',
    questionText: 'Which hook allows custom imperatively exposed instance methods when using React.forwardRef?',
    difficulty: 'Hard',
    questionType: 'MCQ',
    options: ['useImperativeHandle', 'useRef', 'useId', 'useDeferredValue'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'useImperativeHandle customizes the instance value exposed to parent components when using ref.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-19',
    technology: 'React.js',
    topic: 'Performance',
    questionText: 'Which hook defer updates to a non-critical part of the UI to keep input response snappy in React 18?',
    difficulty: 'Hard',
    questionType: 'MCQ',
    options: ['useDeferredValue', 'useTransition', 'useSyncExternalStore', 'useId'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'useDeferredValue allows deferring re-rendering a non-urgent part of the tree.',
    status: 'Active',
  },
  {
    id: 'QST-TEC-20',
    technology: 'React.js',
    topic: 'React Hooks',
    questionText: 'Which hook lets you mark a state update as a non-blocking transition in React 18?',
    difficulty: 'Hard',
    questionType: 'MCQ',
    options: ['useTransition', 'useDeferredValue', 'useInsertionEffect', 'useLayoutEffect'],
    correctAnswer: 0,
    marks: 1,
    explanation: 'useTransition returns isPending flag and startTransition function to mark updates as non-blocking.',
    status: 'Active',
  },

  // ── 4. PROGRAMMING / CODING QUESTIONS (5 QUESTIONS - TECH: Programming) ──
  {
    id: 'QST-PRG-01',
    technology: 'Programming',
    topic: 'Custom Hooks',
    questionText: 'Implement a custom hook `useDebounce(value, delay)` in TypeScript that returns a debounced value.',
    difficulty: 'Hard',
    questionType: 'Coding',
    codeLanguage: 'typescript',
    options: [],
    correctAnswer: 'function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n}',
    codeTemplate: 'import { useState, useEffect } from "react";\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  // Write custom hook implementation\n  return value;\n}',
    testCases: [
      { input: 'useDebounce("search", 300)', expectedOutput: 'Debounced output after 300ms' },
    ],
    marks: 2,
    explanation: 'Custom debounce hook with cleanup timer.',
    status: 'Active',
  },
  {
    id: 'QST-PRG-02',
    technology: 'Programming',
    topic: 'Algorithms',
    questionText: 'Write a function `isPalindrome(str)` that checks whether a given string is a palindrome ignoring case.',
    difficulty: 'Medium',
    questionType: 'Coding',
    codeLanguage: 'javascript',
    options: [],
    correctAnswer: 'function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
    codeTemplate: 'function isPalindrome(str) {\n  // Write palindrome checker logic here\n  return false;\n}',
    testCases: [
      { input: 'isPalindrome("racecar")', expectedOutput: 'true' },
    ],
    marks: 2,
    explanation: 'Cleans string and checks if reverse matches.',
    status: 'Active',
  },
  {
    id: 'QST-PRG-03',
    technology: 'Programming',
    topic: 'Arrays & Objects',
    questionText: 'Write a function `twoSum(nums, target)` returning indices of two numbers that add up to target.',
    difficulty: 'Medium',
    questionType: 'Coding',
    codeLanguage: 'javascript',
    options: [],
    correctAnswer: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
    codeTemplate: 'function twoSum(nums, target) {\n  // Write Two Sum hashmap solution here\n  return [];\n}',
    testCases: [
      { input: 'twoSum([2, 7, 11, 15], 9)', expectedOutput: '[0, 1]' },
    ],
    marks: 2,
    explanation: 'Single pass O(N) hashmap lookup algorithm.',
    status: 'Active',
  },
  {
    id: 'QST-PRG-04',
    technology: 'Programming',
    topic: 'Data Structures',
    questionText: 'Write a function `flattenArray(arr)` that flattens a deeply nested array of integers.',
    difficulty: 'Hard',
    questionType: 'Coding',
    codeLanguage: 'javascript',
    options: [],
    correctAnswer: 'function flattenArray(arr) {\n  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenArray(val)) : acc.concat(val), []);\n}',
    codeTemplate: 'function flattenArray(arr) {\n  // Write array flattener\n  return [];\n}',
    testCases: [
      { input: 'flattenArray([1, [2, [3, 4]], 5])', expectedOutput: '[1, 2, 3, 4, 5]' },
    ],
    marks: 2,
    explanation: 'Recursive reduce flattener algorithm.',
    status: 'Active',
  },
  {
    id: 'QST-PRG-05',
    technology: 'Programming',
    topic: 'SQL Queries',
    questionText: 'Write an SQL query to retrieve top 5 highest salary employees partitioned by Department ID.',
    difficulty: 'Hard',
    questionType: 'Coding',
    codeLanguage: 'sql',
    options: [],
    correctAnswer: 'SELECT * FROM (SELECT e.*, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rk FROM employees e) t WHERE rk <= 5;',
    codeTemplate: '-- Write SQL query below\nSELECT * FROM employees;\n',
    testCases: [
      { input: 'Window function DENSE_RANK query', expectedOutput: 'Top 5 per department returned' },
    ],
    marks: 2,
    explanation: 'DENSE_RANK() OVER (PARTITION BY dept ORDER BY salary DESC).',
    status: 'Active',
  },
];

const SEED_SECTIONS: AssessmentSection[] = [
  {
    id: 'SEC-1',
    name: 'Aptitude',
    technology: 'General',
    questionType: 'MCQ',
    difficulty: 'Medium',
    questionCount: 10,
    marksPerQuestion: 1,
    totalMarks: 10,
  },
  {
    id: 'SEC-2',
    name: 'Logical Reasoning',
    technology: 'Reasoning',
    questionType: 'MCQ',
    difficulty: 'Medium',
    questionCount: 10,
    marksPerQuestion: 1,
    totalMarks: 10,
  },
  {
    id: 'SEC-3',
    name: 'Technical',
    technology: 'React.js',
    topic: 'React Hooks / Core Tech',
    questionType: 'MCQ',
    difficulty: 'Medium',
    questionCount: 20,
    marksPerQuestion: 1,
    totalMarks: 20,
  },
  {
    id: 'SEC-4',
    name: 'Programming',
    technology: 'Programming',
    questionType: 'Coding',
    difficulty: 'Hard',
    questionCount: 5,
    marksPerQuestion: 2,
    totalMarks: 10,
  },
];

class AssessmentStore {
  getQuestions(): Question[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(SEED_QUESTIONS));
      return SEED_QUESTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_QUESTIONS;
    }
  }

  saveQuestion(q: Omit<Question, 'id'> & { id?: string }): Question {
    const questions = this.getQuestions();
    const isNew = !q.id;
    const newId = q.id || `QST-${Math.floor(100 + Math.random() * 900)}`;
    const fullQuestion: Question = {
      ...q,
      id: newId,
      status: q.status || 'Active',
      options: q.options || [],
    } as Question;

    let updated: Question[];
    if (isNew) {
      updated = [fullQuestion, ...questions];
    } else {
      updated = questions.map((item) => (item.id === newId ? fullQuestion : item));
    }

    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
    return fullQuestion;
  }

  bulkAddQuestions(newQs: (Omit<Question, 'id'> & { id?: string })[]): Question[] {
    const questions = this.getQuestions();
    const createdList: Question[] = newQs.map((q, idx) => ({
      ...q,
      id: q.id || `QST-${Math.floor(200 + Math.random() * 800 + idx)}`,
      options: q.options || [],
      status: q.status || 'Active',
      marks: q.marks || 1,
      explanation: q.explanation || 'Bulk imported question.',
    } as Question));

    const updated = [...createdList, ...questions];
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
    return createdList;
  }

  deleteQuestion(id: string) {
    const questions = this.getQuestions();
    const updated = questions.filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
  }

  toggleQuestionStatus(id: string) {
    const questions = this.getQuestions();
    const updated = questions.map((q) =>
      q.id === id ? { ...q, status: q.status === 'Active' ? ('Inactive' as const) : ('Active' as const) } : q
    );
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(updated));
  }

  // Assessments
  getAssessments(): Assessment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(SEED_ASSESSMENTS));
      return SEED_ASSESSMENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return SEED_ASSESSMENTS;
    }
  }

  saveAssessment(data: Omit<Assessment, 'id'> & { id?: string }): Assessment {
    const assessments = this.getAssessments();
    const newId = data.id || `ASM-${Math.floor(800 + Math.random() * 199)}`;
    const fullAssessment: Assessment = {
      ...data,
      id: newId,
      status: data.status || 'Published',
      questions: data.questions || [],
      totalMarks: data.totalMarks || 50,
      questionCount: data.questionCount || 45,
    } as Assessment;

    const existingIndex = assessments.findIndex((a) => a.id === newId);
    let updated: Assessment[];
    if (existingIndex >= 0) {
      updated = [...assessments];
      updated[existingIndex] = fullAssessment;
    } else {
      updated = [fullAssessment, ...assessments];
    }

    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated));
    return fullAssessment;
  }

  updateAssessmentStatus(id: string, status: Assessment['status']) {
    const list = this.getAssessments();
    const updated = list.map((a) => (a.id === id ? { ...a, status } : a));
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated));
  }

  deleteAssessment(id: string) {
    const list = this.getAssessments();
    const updated = list.filter((a) => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(updated));
  }

  // Attempts & Candidate Integration
  getAttempts(): CandidateAssessmentAttempt[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(SEED_ATTEMPTS));
      return SEED_ATTEMPTS;
    }
    try {
      const parsed: CandidateAssessmentAttempt[] = JSON.parse(raw);
      const uniqueAttempts: CandidateAssessmentAttempt[] = [];
      const seenPending = new Set<string>();

      for (const att of parsed) {
        if (att.status === 'SENT' || att.status === 'IN_PROGRESS') {
          const key = `${att.candidateEmail?.toLowerCase() || att.candidateId}_${att.assessmentId}`;
          if (seenPending.has(key)) {
            continue; // Skip duplicate pending attempt
          }
          seenPending.add(key);
        }
        uniqueAttempts.push(att);
      }
      return uniqueAttempts;
    } catch {
      return SEED_ATTEMPTS;
    }
  }

  getAttemptByToken(token: string): CandidateAssessmentAttempt | null {
    const attempts = this.getAttempts();
    return attempts.find((a) => a.token === token) || null;
  }

  createCandidateAttempt(params: {
    assessmentId: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    jobPosition?: string;
    expiryDate?: string;
    scheduledDate?: string;
    scheduledStartTime?: string;
    durationMinutes?: number;
    emailSendingMode?: 'IMMEDIATE' | 'SCHEDULED';
  }): CandidateAssessmentAttempt {
    const assessments = this.getAssessments();
    const asm = assessments.find((a) => a.id === params.assessmentId) || assessments[0];

    const attempts = this.getAttempts();

    // Check if candidate already has an active pending attempt (SENT or IN_PROGRESS)
    const existingIndex = attempts.findIndex(
      (att) =>
        (att.candidateId === params.candidateId ||
          (att.candidateEmail && att.candidateEmail.toLowerCase() === params.candidateEmail.toLowerCase())) &&
        (att.status === 'SENT' || att.status === 'IN_PROGRESS')
    );

    if (existingIndex !== -1) {
      // Reuse existing attempt token & update scheduling details
      const existing = attempts[existingIndex];
      const updatedAttempt: CandidateAssessmentAttempt = {
        ...existing,
        assessmentId: asm ? asm.id : existing.assessmentId,
        assessmentName: asm ? asm.name : existing.assessmentName,
        expiryDate: params.expiryDate || existing.expiryDate,
        scheduledDate: params.scheduledDate || existing.scheduledDate,
        scheduledStartTime: params.scheduledStartTime || existing.scheduledStartTime,
        emailSendingMode: params.emailSendingMode || existing.emailSendingMode,
        emailStatus: params.emailSendingMode === 'SCHEDULED' ? 'SCHEDULED' : 'SENT',
        sentAt: new Date().toISOString(),
      };

      const updatedList = [...attempts];
      updatedList[existingIndex] = updatedAttempt;
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(updatedList));
      return updatedAttempt;
    }

    const randomToken = `TOKEN-${params.candidateName.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newAttempt: CandidateAssessmentAttempt = {
      token: randomToken,
      assessmentId: asm ? asm.id : 'ASM-800',
      assessmentName: asm ? asm.name : 'Technical Assessment',
      candidateId: params.candidateId,
      candidateName: params.candidateName,
      candidateEmail: params.candidateEmail,
      jobPosition: params.jobPosition || (asm ? asm.jobPosition : 'Software Engineer'),
      technology: asm ? asm.technology : 'React.js',
      durationMins: params.durationMinutes || (asm ? asm.durationMins : 60),
      questionCount: asm ? (asm.questionCount || asm.questions?.length || 45) : 45,
      passingPercentage: asm ? asm.passingPercentage : 70,
      expiryDate: params.expiryDate || (asm ? asm.expiryDate : '2026-10-30'),
      scheduledDate: params.scheduledDate || '2026-08-30',
      scheduledStartTime: params.scheduledStartTime || '11:00',
      durationMinutes: params.durationMinutes || (asm ? asm.durationMins : 60),
      emailSendingMode: params.emailSendingMode || 'IMMEDIATE',
      emailStatus: params.emailSendingMode === 'SCHEDULED' ? 'SCHEDULED' : 'SENT',
      assessmentStatus: 'SCHEDULED',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      answers: {},
      markedForReview: [],
      sections: asm ? asm.sections : [],
    };

    const updated = [newAttempt, ...attempts];
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(updated));
    return newAttempt;
  }

  updateAttemptProgress(token: string, answers: Record<string, any>, markedForReview: string[]) {
    const attempts = this.getAttempts();
    const index = attempts.findIndex((a) => a.token === token);
    if (index === -1) return;

    const attempt = attempts[index];
    if (attempt.status === 'SENT') {
      attempt.status = 'IN_PROGRESS';
      attempt.startedAt = new Date().toISOString();
    }
    attempt.answers = answers;
    attempt.markedForReview = markedForReview;

    attempts[index] = attempt;
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));
  }

  submitCandidateAssessment(
    token: string,
    finalAnswers: Record<string, any>,
    timeTakenSeconds: number
  ): CandidateAssessmentAttempt {
    const attempts = this.getAttempts();
    const index = attempts.findIndex((a) => a.token === token);
    const assessments = this.getAssessments();

    let attempt = attempts[index];
    if (!attempt) {
      throw new Error('Assessment attempt token invalid or expired');
    }

    const asm = assessments.find((a) => a.id === attempt.assessmentId) || assessments[0];
    const questions = asm.questions.length > 0 ? asm.questions : this.getQuestions();

    let totalMarks = 0;
    let scoreObtained = 0;
    const questionResults: QuestionResult[] = [];

    questions.forEach((q) => {
      const qMarks = q.marks || 1;
      totalMarks += qMarks;
      const candAns = finalAnswers[q.id];
      let isCorrect = false;
      let marksEarned = 0;
      let testPassed = 0;
      let testTotal = 0;

      if (q.questionType === 'MCQ' || q.questionType === 'True-False') {
        const expectedStr = String(q.correctAnswer).trim().toLowerCase();
        const candStr = String(candAns).trim().toLowerCase();
        const optionMatched = typeof q.correctAnswer === 'number' && Number(candAns) === q.correctAnswer;
        if (expectedStr === candStr || optionMatched) {
          isCorrect = true;
          marksEarned = qMarks;
        }
      } else if (q.questionType === 'Multiple Select') {
        const expectedArr = Array.isArray(q.correctAnswer)
          ? q.correctAnswer.map((x: any) => String(x).toLowerCase()).sort()
          : [];
        const candArr = Array.isArray(candAns)
          ? candAns.map((x: any) => String(x).toLowerCase()).sort()
          : [];
        if (expectedArr.length > 0 && expectedArr.join(',') === candArr.join(',')) {
          isCorrect = true;
          marksEarned = qMarks;
        } else if (candArr.some((val) => expectedArr.includes(val))) {
          marksEarned = Math.round(qMarks / 2) || 1;
        }
      } else if (q.questionType === 'Coding') {
        testTotal = q.testCases?.length || 1;
        const codeText = String(candAns || '').trim();
        if (codeText.length > 15 && (codeText.includes('return') || codeText.includes('SELECT') || codeText.includes('function') || codeText.includes('def'))) {
          testPassed = testTotal;
          isCorrect = true;
          marksEarned = qMarks;
        } else if (codeText.length > 5) {
          testPassed = 1;
          marksEarned = Math.round(qMarks / 2) || 1;
        }
      }

      scoreObtained += marksEarned;

      let formattedCandAns = candAns !== undefined ? candAns : 'No Answer Provided';
      if (Array.isArray(candAns) && q.options.length > 0) {
        formattedCandAns = candAns.map((idx) => q.options[idx] || idx).join(', ');
      } else if (typeof candAns === 'number' && q.options[candAns]) {
        formattedCandAns = q.options[candAns];
      }

      let formattedCorrectAns = q.correctAnswer;
      if (Array.isArray(q.correctAnswer) && q.options.length > 0) {
        formattedCorrectAns = q.correctAnswer.map((idx: any) => q.options[idx] || idx).join(', ');
      } else if (typeof q.correctAnswer === 'number' && q.options[q.correctAnswer]) {
        formattedCorrectAns = q.options[q.correctAnswer];
      }

      questionResults.push({
        questionId: q.id,
        questionText: q.questionText,
        candidateAnswer: formattedCandAns,
        correctAnswer: formattedCorrectAns,
        isCorrect,
        marksObtained: marksEarned,
        maxMarks: qMarks,
        explanation: q.explanation || 'Automated evaluation rule applied.',
        codeLanguage: q.codeLanguage,
        submittedCode: q.questionType === 'Coding' ? String(candAns || '') : undefined,
        testCasesPassed: testPassed,
        testCasesTotal: testTotal,
      });
    });

    const percentage = totalMarks > 0 ? Math.round((scoreObtained / totalMarks) * 100) : 0;
    const isPassed = percentage >= attempt.passingPercentage;

    attempt = {
      ...attempt,
      status: 'COMPLETED',
      submittedAt: new Date().toISOString(),
      answers: finalAnswers,
      timeTakenSeconds,
      score: scoreObtained,
      totalMarks,
      percentage,
      isPassed,
      questionResults,
    };

    if (index >= 0) {
      attempts[index] = attempt;
    } else {
      attempts.unshift(attempt);
    }
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(attempts));

    if (attempt.candidateId) {
      const targetStage = isPassed ? 'ASSESSMENT_PASSED' : 'ASSESSMENT_FAILED';
      try {
        candidatesApi.updateStage(attempt.candidateId, targetStage as any);
      } catch (err) {
        console.warn('Could not auto-sync candidate stage in API', err);
      }
    }

    return attempt;
  }
}

export const assessmentStore = new AssessmentStore();
