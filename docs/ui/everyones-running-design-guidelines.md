# Design Guidelines: Everyone's Running (모두의 러닝)

## Overview
'Everyone's Running' is a platform designed to provide comprehensive information about running competitions, tailored for both web and mobile experiences. The design focuses on clarity, modern aesthetics, and ease of use, ensuring that runners can find, plan, and track their competition schedules effortlessly.

## Visual Identity

### Color Palette
- **Primary Color:** #FF6B54 (Coral/Salmon) - Used for primary actions, highlights, and status indicators like 'Recruiting'.
- **Secondary Color:** #2C3E50 (Dark Blue/Navy) - Used for hero sections, important background areas, and deep contrast elements.
- **Accent Color:** #FFD3C4 (Light Coral) - Used for secondary buttons, tags, or subtle backgrounds.
- **Success/Positive:** #4CAF50 (Green) - For active status or positive indicators.
- **Warning/Pending:** #FFB74D (Orange) - For 'Deadline Approaching' or 'Pending' status.
- **Negative/Closed:** #9E9E9E (Gray) - For 'Closed' or 'Finished' status.
- **Backgrounds:**
    - Main Background: #F8F9FA (Very Light Gray/White)
    - Surface Background: #FFFFFF (Pure White) for cards and sections.

### Typography
- **Primary Font Family:** 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', sans-serif.
- **Headings:**
    - H1 (Hero): 32px - 40px, Bold, Navy or Black.
    - H2 (Section Title): 24px - 28px, Bold, Navy or Black.
    - H3 (Card Title): 18px - 20px, Bold, Black.
- **Body Text:**
    - Main Body: 14px - 16px, Regular/Medium, Dark Gray (#333333).
    - Secondary/Support: 12px - 13px, Regular, Medium Gray (#666666).

## Component Guidelines

### Cards
- **Border Radius:** 16px - 24px for a soft, modern feel.
- **Box Shadow:** Subtle shadow (e.g., `0 4px 12px rgba(0,0,0,0.05)`) to create depth without clutter.
- **Padding:** Consistent padding of 20px - 24px within cards.

### Buttons
- **Primary Button:** Filled with #FF6B54, White text, 8px - 12px border radius.
- **Secondary Button:** Outlined or light background (#FFD3C4) with Coral text.
- **Ghost Button:** Transparent with Coral or Navy text for less critical actions.

### Layout & Spacing
- **Grid:** Use a flexible grid system (e.g., 12-column for desktop, 1-column for mobile).
- **Margins:** Standard outer margins of 20px on mobile and 80px+ on desktop.
- **Spacing:** Use a consistent 8px/4px base unit for margins and padding (e.g., 8, 16, 24, 32, 48px).

## Platform Specifics

### Web (Desktop)
- Focus on information density and side-by-side layouts (e.g., filter sidebar + competition list).
- Clear navigation bar at the top.

### Mobile
- Use 1-column layouts for competition lists.
- Important actions (like 'Apply Now') should be in a sticky footer bar.
- Use bottom sheets for complex filters to save screen space.
- Tab bar at the bottom for main navigation.

## Design Principles
1. **Cleanliness over Complexity:** Hide complex filters and options until needed.
2. **Visual Hierarchy:** Use size and color to guide the user's eye to the most important actions (CTA).
3. **Consistency:** Maintain the same color and typography rules across all pages and platforms.
