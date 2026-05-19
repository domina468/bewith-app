# BeWith - Share Time Together

A complete cross-platform mobile application that allows users to share time together through audio or video calls while performing various daily activities.

## 🎯 Features Implemented

### ✅ User Experience
- **Onboarding & Authentication**
  - Welcome screen with animated logo
  - Google, Apple, and Email sign-up options
  - Smooth animations and transitions

- **Home Dashboard**
  - List of themed rooms (Study, Work, Cleaning, Morning Routine, Chill & Music)
  - Search functionality
  - Category filtering
  - Favorite rooms section
  - Real-time room status (Active/Quiet)
  - User count display
  - Daily streak tracker

- **Room Experience**
  - Video grid layout with participant tiles
  - Three modes: Video, Audio, Silent
  - Real-time controls (mute/unmute, video on/off)
  - Leave room functionality
  - Participants sidebar
  - Mood indicators (focused, chill, energetic, sleepy)
  - Optional shared music player for Relax rooms

- **Chat System**
  - Real-time messaging overlay
  - Emoji reactions
  - Quick emoji picker
  - Message timestamps

- **User Profile**
  - Avatar with gradient background
  - Streak tracking with flame icon
  - Stats dashboard (Total Hours, Rooms Joined, Friends, Badges)
  - Favorite rooms list
  - Badge system with progress tracking
  - Earned vs. In-Progress badges

- **Create Room**
  - Custom room creation
  - 8 category options
  - Public/Private privacy settings
  - Max participants slider
  - Optional features (shared music)

- **Notifications**
  - Friend activity alerts
  - Badge unlock notifications
  - Favorite room activity updates
  - Relative timestamps

- **Settings**
  - Notification preferences
  - Video & Audio settings
  - Appearance options
  - Language selection
  - Privacy & Safety
  - Support & Help
  - Account management

## 🎨 Design System

### Color Palette
- **Primary Green**: #81C784 (buttons, accents)
- **Pastel Background**: Linear gradient from #E8F5E9 (green) → #F5F5DC (beige) → #E3F2FD (blue)
- **White**: #FFFFFF (cards, panels)
- **Typography**: Inter font family

### UI Components
- Rounded corners (12px - 24px)
- Smooth shadows for elevation
- Glass morphism effects (backdrop blur)
- Gradient avatars
- Emoji-based mood indicators

## 📱 Screens

1. **Onboarding Screen** - `/src/app/components/onboarding.tsx`
2. **Home Screen** - `/src/app/components/home-screen.tsx`
3. **Room Detail** - `/src/app/components/room-detail.tsx`
4. **Chat Overlay** - `/src/app/components/chat-overlay.tsx`
5. **Profile Screen** - `/src/app/components/profile-screen.tsx`
6. **Create Room Modal** - `/src/app/components/create-room.tsx`
7. **Notifications Screen** - `/src/app/components/notifications-screen.tsx`
8. **Settings Modal** - `/src/app/components/settings-modal.tsx`

## 🔧 Technology Stack

- **Framework**: React 18.3.1
- **Styling**: Tailwind CSS v4
- **Animations**: Motion (Framer Motion) 12.23.24
- **Icons**: Lucide React 0.487.0
- **Notifications**: Sonner 2.0.3
- **UI Components**: Radix UI primitives
- **Build Tool**: Vite 6.3.5

## 🎮 User Flow

1. **Sign Up** → Choose authentication method
2. **Home** → Browse rooms, search, filter by category
3. **Join Room** → Select mode (Video/Audio/Silent)
4. **In Room** → Interact with participants, toggle controls, chat
5. **Profile** → View stats, badges, favorite rooms
6. **Create Room** → Customize and launch new room

## 🏆 Gamification

- **Daily Streaks**: Track consecutive days of usage
- **Badges**: 6 achievement badges
  - First Steps (earned)
  - Consistency King (7-day streak)
  - Social Butterfly (earned)
  - Early Bird (earned)
  - Night Owl
  - Study Champion (50 hours)
- **Progress Tracking**: Visual progress bars for in-progress badges

## 📊 Mock Data

The app uses mock data to demonstrate functionality:
- 5 pre-configured rooms with different themes
- Sample participants with various moods
- Badge achievements and progress
- Notification history
- User statistics

## 🚀 Next Steps for Production

To convert this into a production app, you would need:

1. **Backend Infrastructure**
   - Database (Supabase, Firebase, or custom)
   - User authentication system
   - Real-time WebRTC implementation (Agora, Twilio, or Daily.co)
   - Room management API

2. **Real-time Features**
   - WebSocket connections for chat
   - Presence tracking
   - Notification push system

3. **Media Streaming**
   - Video/Audio codec optimization
   - Bandwidth adaptation
   - Background blur/virtual backgrounds
   - Spotify/YouTube API integration

4. **Security & Privacy**
   - End-to-end encryption
   - GDPR compliance
   - Content moderation
   - Report/block functionality

5. **Mobile Apps**
   - React Native conversion
   - iOS/Android native builds
   - Push notification setup
   - App store deployment

## 💡 Notes

- This is a **frontend demo** with simulated backend functionality
- All data is stored in local component state
- WebRTC calls are mocked with visual UI only
- No actual video/audio streaming is implemented
- OAuth sign-in is simulated

## 🎯 Key Features Not Implemented (Would Require Backend)

- Real user authentication
- Persistent user profiles
- Actual video/audio calls
- Real-time data synchronization
- Cloud storage for media
- Push notifications
- Friend system
- Payment processing for premium features

---

**Built with ❤️ using Figma Make**
