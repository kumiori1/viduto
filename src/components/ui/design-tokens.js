/**
 * Design tokens for consistent styling across the application
 */
export const designTokens = {
  colors: {
    primary: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316', // Main orange
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
    secondary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6', // Main blue
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    accent: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6', // Purple
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    }
  },
  
  spacing: {
    px: '1px',
    0: '0',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    fontWeight: {
      thin: '100',
      extralight: '200',
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    lineHeight: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    }
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  animation: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
}

/**
 * Utility function to get design token values
 * @param {string} path - Dot notation path to the token (e.g., 'colors.primary.500')
 * @returns {any} Token value
 */
export const getToken = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], designTokens)
}

/**
 * CSS custom properties for design tokens
 */
export const cssVariables = `
  :root {
    /* Colors */
    --color-primary-50: ${designTokens.colors.primary[50]};
    --color-primary-500: ${designTokens.colors.primary[500]};
    --color-primary-600: ${designTokens.colors.primary[600]};
    --color-primary-900: ${designTokens.colors.primary[900]};
    
    --color-secondary-500: ${designTokens.colors.secondary[500]};
    --color-secondary-600: ${designTokens.colors.secondary[600]};
    
    --color-gray-50: ${designTokens.colors.gray[50]};
    --color-gray-100: ${designTokens.colors.gray[100]};
    --color-gray-200: ${designTokens.colors.gray[200]};
    --color-gray-300: ${designTokens.colors.gray[300]};
    --color-gray-400: ${designTokens.colors.gray[400]};
    --color-gray-500: ${designTokens.colors.gray[500]};
    --color-gray-600: ${designTokens.colors.gray[600]};
    --color-gray-700: ${designTokens.colors.gray[700]};
    --color-gray-800: ${designTokens.colors.gray[800]};
    --color-gray-900: ${designTokens.colors.gray[900]};
    
    /* Typography */
    --font-family-sans: ${designTokens.typography.fontFamily.sans.join(', ')};
    --font-family-mono: ${designTokens.typography.fontFamily.mono.join(', ')};
    
    /* Spacing */
    --spacing-1: ${designTokens.spacing[1]};
    --spacing-2: ${designTokens.spacing[2]};
    --spacing-3: ${designTokens.spacing[3]};
    --spacing-4: ${designTokens.spacing[4]};
    --spacing-6: ${designTokens.spacing[6]};
    --spacing-8: ${designTokens.spacing[8]};
    --spacing-12: ${designTokens.spacing[12]};
    --spacing-16: ${designTokens.spacing[16]};
    --spacing-20: ${designTokens.spacing[20]};
    --spacing-24: ${designTokens.spacing[24]};
    
    /* Border Radius */
    --radius-sm: ${designTokens.borderRadius.sm};
    --radius-md: ${designTokens.borderRadius.md};
    --radius-lg: ${designTokens.borderRadius.lg};
    --radius-xl: ${designTokens.borderRadius.xl};
    --radius-2xl: ${designTokens.borderRadius['2xl']};
    --radius-full: ${designTokens.borderRadius.full};
    
    /* Shadows */
    --shadow-sm: ${designTokens.shadows.sm};
    --shadow-md: ${designTokens.shadows.md};
    --shadow-lg: ${designTokens.shadows.lg};
    --shadow-xl: ${designTokens.shadows.xl};
  }
`