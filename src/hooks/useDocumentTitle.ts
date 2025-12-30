import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const routeTitles: Record<string, string> = {
  // Main pages
  '': 'Dashboard',
  'projects': 'Projects',
  'tickets': 'Tickets',
  'team': 'Team',
  'my-hours': 'My Hours',
  'crm': 'CRM',
  'reports': 'Reports',
  'emails': 'Emails',
  'financials': 'Financials',
  'expenses': 'Expenses',
  'projections': 'Projections',
  'forms': 'Forms',
  'settings': 'Settings',
  'audit-log': 'Audit Log',

  // Ticket sub-pages
  'tickets/features': 'Feature Requests',
  'tickets/quotes': 'Quotes',
  'tickets/feedback': 'Feedback',
  'tickets/issues': 'Issues',

  // Auth pages
  'login': 'Login',
  'signup': 'Sign Up',
  'forgot-password': 'Forgot Password',
  'reset-password': 'Reset Password',
  'welcome': 'Welcome',
};

export function useDocumentTitle(customTitle?: string) {
  const location = useLocation();

  useEffect(() => {
    if (customTitle) {
      document.title = `${customTitle} - Soluly`;
      return;
    }

    // Get the path without the org prefix
    const path = location.pathname;

    // Remove /org/:slug prefix if present
    const pathWithoutOrg = path.replace(/^\/org\/[^/]+\/?/, '');

    // Check for exact match first
    if (routeTitles[pathWithoutOrg]) {
      document.title = `${routeTitles[pathWithoutOrg]} - Soluly`;
      return;
    }

    // Check for partial matches (for detail pages like /projects/:id)
    const segments = pathWithoutOrg.split('/').filter(Boolean);

    if (segments.length >= 2) {
      // Handle detail pages
      const baseRoute = segments[0];

      if (baseRoute === 'projects') {
        document.title = 'Project Details - Soluly';
        return;
      }
      if (baseRoute === 'tickets') {
        document.title = 'Ticket Details - Soluly';
        return;
      }
      if (baseRoute === 'team') {
        document.title = 'Team Member - Soluly';
        return;
      }
      if (baseRoute === 'contacts') {
        document.title = 'Contact Details - Soluly';
        return;
      }
      if (baseRoute === 'clients') {
        document.title = 'Client Details - Soluly';
        return;
      }
      if (baseRoute === 'features') {
        document.title = 'Feature Request - Soluly';
        return;
      }
      if (baseRoute === 'quotes') {
        document.title = 'Quote Details - Soluly';
        return;
      }
      if (baseRoute === 'feedback') {
        document.title = 'Feedback Details - Soluly';
        return;
      }
      if (baseRoute === 'forms') {
        if (segments[2] === 'responses') {
          document.title = 'Form Responses - Soluly';
        } else {
          document.title = 'Form Builder - Soluly';
        }
        return;
      }
    }

    // Check first segment for simple routes
    if (segments.length === 1 && routeTitles[segments[0]]) {
      document.title = `${routeTitles[segments[0]]} - Soluly`;
      return;
    }

    // Default title
    document.title = 'Soluly';
  }, [location.pathname, customTitle]);
}
