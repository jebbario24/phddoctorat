# Design Guidelines: PhD Thesis Management SaaS

## Design Approach

**Selected Approach:** Design System + Reference Hybrid

**Primary References:**
- **Notion** - Writing workspace, document organization, clean editor interface
- **Linear** - Task management, minimal aesthetic, efficient workflows
- **Google Docs** - Collaborative editing patterns, commenting systems

**Justification:** This is a utility-focused productivity tool where clarity, efficiency, and focused work matter most. Students need distraction-free writing combined with robust project management. The design must feel professional, academic, and trustworthy.

---

## Typography

**Font Stack:**
- **Primary (Interface):** Inter via Google Fonts - modern, highly legible, professional
- **Secondary (Editor/Content):** Crimson Pro or Lora - serif font optimized for long-form academic reading
- **Monospace (Code/References):** JetBrains Mono for citation codes and technical content

**Hierarchy:**
- Hero headings: `text-5xl lg:text-6xl font-bold` (landing only)
- Page titles: `text-3xl font-semibold`
- Section headers: `text-2xl font-semibold`
- Card/component titles: `text-lg font-medium`
- Body text: `text-base` (16px)
- Secondary text: `text-sm` (metadata, captions)
- Tiny text: `text-xs` (timestamps, labels)

**Editor Typography:**
- Content area: `text-lg leading-relaxed` using serif font
- Optimal reading width: `max-w-3xl` (approximately 65-75 characters per line)

---

## Layout System

**Spacing Units:** Tailwind units of **2, 4, 6, 8, 12, 16, 20, 24**
- Tight spacing: `gap-2`, `p-2` (dense UI elements)
- Standard spacing: `gap-4`, `p-4` (cards, buttons)
- Section padding: `p-6` (mobile), `p-8` (desktop)
- Large sections: `py-12` to `py-20` (landing page sections)
- Component margins: `mb-6`, `mb-8`, `mb-12`

**Container Strategy:**
- Dashboard/App: `max-w-7xl mx-auto px-4 lg:px-8` - full workspace width
- Editor/Writing: `max-w-4xl mx-auto` - comfortable reading width
- Landing page: `max-w-6xl mx-auto` for content sections

**Grid Patterns:**
- Dashboard cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Task boards: `grid grid-cols-1 lg:grid-cols-4 gap-4` (kanban columns)
- Stats/metrics: `grid grid-cols-2 lg:grid-cols-4 gap-4`

---

## Component Library

### Navigation
- **Main App Navigation:** Fixed left sidebar (260px wide on desktop, collapsible on mobile)
  - Logo/branding at top
  - Navigation items with icons (My Thesis, Planner, Editor, References, Settings)
  - User profile/account at bottom
  - Progress indicator showing overall thesis completion
  
- **Landing Page Header:** Sticky header with transparent-to-solid background on scroll
  - Logo left, navigation center, CTA buttons right
  - Mobile: Hamburger menu

### Dashboard Components
- **Thesis Overview Card:** Large card showing thesis title, progress bar, deadline countdown, quick stats (total words, chapters completed)
- **Chapter Cards:** Grid of cards, each showing chapter name, status badge (Draft/Review/Revised/Final), word count, last edited timestamp
- **Milestone Timeline:** Horizontal timeline with nodes for major milestones, completed states visually distinct
- **Task Cards (Kanban):** Draggable cards with title, description snippet, due date, priority indicator
- **Activity Feed:** List of recent actions (comments, edits, status changes) with timestamps and user avatars

### Writing Interface
- **Editor Toolbar:** Sticky toolbar with formatting options (bold, italic, headings, lists, quotes), AI assistance button prominent
- **AI Sidebar:** Collapsible right panel (300px) with AI suggestions, word count tracker, outline navigator
- **Comment Threads:** Inline comment markers with expandable threads, similar to Google Docs
- **Chapter Navigator:** Left panel showing chapter structure, collapsible sections, click to jump

### Forms & Inputs
- **Text Inputs:** Clean borders (`border border-gray-300`), generous padding (`px-4 py-3`), rounded corners (`rounded-lg`)
- **Dropdowns:** Custom-styled selects matching input aesthetic
- **Buttons:** 
  - Primary: Solid fill, medium rounded (`rounded-md`), padding `px-6 py-3`
  - Secondary: Outlined style
  - Tertiary: Text-only with hover background
- **File Upload:** Drag-and-drop zones with dashed borders, upload icon, clear instructions

### Data Display
- **Reference List:** Table-like rows with citation preview, tags, edit/delete actions
- **Progress Indicators:** Linear progress bars showing percentage, color-coded by status
- **Status Badges:** Pill-shaped badges (`rounded-full px-3 py-1 text-sm`) with distinct states
- **Supervisor Comments:** Speech bubble design with user avatar, timestamp, threaded replies

### Overlays
- **Modals:** Centered, max-width 500-600px, backdrop blur, clean close button
- **AI Suggestion Panel:** Slide-in from right, full height, dedicated space for AI interactions
- **Onboarding Wizard:** Multi-step modal with progress dots, clear next/back navigation

---

## Landing Page Structure

**Hero Section (80vh):**
- Large headline communicating core value proposition
- Subheading explaining AI + project management angle
- Primary CTA button ("Start Your Thesis Free") and secondary link ("Watch Demo")
- Hero image: Clean mockup of the thesis dashboard/editor interface showing the product in action
- Trust indicator: "Trusted by students at 100+ universities"

**Problem/Solution (2-column):**
- Left: Pain points students face (scattered files, missed deadlines, isolation)
- Right: How the platform solves each (centralized workspace, timeline management, collaboration)

**Features Grid (3-column):**
- AI Writing Assistant
- Thesis Planner & Timeline
- Reference Management
- Supervisor Collaboration
- Progress Tracking
- Academic Integrity Tools
Each with icon, title, brief description

**Workflow Section:**
- Visual step-by-step showing thesis journey through the platform
- Screenshots/illustrations of key interfaces

**Testimonials (2-column):**
- Student quotes with photos, university affiliations, thesis topics

**Pricing Table (3-column):**
- Free, Pro, Institution tiers
- Feature comparison checkmarks
- Most popular badge on middle tier

**CTA Section:**
- Reinforced call-to-action
- Email signup for early access or demo request

**Footer:**
- Multi-column layout: Product links, Resources, Company, Legal
- Social media icons
- Newsletter signup

---

## Images

**Hero Image:** Dashboard screenshot showing thesis overview with chapters, timeline, and AI sidebar - clean, bright interface emphasizing organization and clarity. Place as full-width background or large centered visual.

**Feature Screenshots:** Interface mockups showing specific features (editor with AI panel, kanban board, reference manager). Use these as supporting visuals in feature sections.

**Testimonial Photos:** Professional headshots of students (diverse, authentic-looking). Place alongside testimonial text.

---

## Animation Guidelines

**Minimal Motion Approach:**
- Hover states: Subtle brightness/scale changes only
- Page transitions: Simple fade-ins, no elaborate effects
- Loading states: Subtle skeleton screens or minimal spinners
- Focus: Editor should be distraction-free - no decorative animations

**Purposeful Animations:**
- Progress bar fills when updating completion status
- Smooth scrolling when navigating chapter structure
- Gentle slide-in for AI suggestion panel

---

## Key Design Principles

1. **Clarity Over Cleverness** - Academic work demands focus; UI should disappear
2. **Hierarchical Information** - Clear visual distinction between primary tasks and supporting features
3. **Reading-Optimized** - Typography and spacing prioritize long-form content consumption
4. **Professional Trust** - Design conveys reliability and academic seriousness
5. **Efficient Workflows** - Common actions require minimal clicks; keyboard shortcuts supported