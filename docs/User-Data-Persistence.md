# User Data Persistence

**What data persists for authenticated users vs anonymous users**

---

## 📊 Database (PostgreSQL) - Authenticated Users Only

When a user is **logged in**, the following data is stored in the database:

### 1. **Conversations** (`Conversation` table)
- All conversation sessions
- Problem text, messages, timestamps
- Completion status, XP earned
- Problem type and difficulty
- **Synced across devices** ✅

### 2. **XP State** (`XPState` table)
- Total XP points
- Current level
- All XP transactions (history of awards)
- **Synced across devices** ✅

### 3. **User Account** (`User` table)
- Name, email
- Password hash (for email/password auth)
- Account creation/update timestamps

---

## 💾 localStorage - All Users (Authenticated + Anonymous)

The following data is stored in **localStorage only** (browser-specific, not synced):

### 1. **Voice Settings**
- **TTS Settings** (`math-tutor-tts-settings`):
  - Voice enabled/disabled
  - Voice rate, pitch, volume
  - Voice selection
- **STT Settings** (`math-tutor-stt-settings`):
  - Speech recognition enabled/disabled
  - Language settings

### 2. **Intro Screen Status**
- **`math-tutor-intro-shown`**: Whether the intro screen has been shown
- Prevents showing intro on every page load

### 3. **Attempt Tracking**
- **`attempts_{problemSignature}`**: Per-problem attempt counts
- Used for XP calculation (first try bonus, persistence bonus)
- Format: `attempts_2x+5=13` → `"3"` (3 attempts)

### 4. **Test Results** (Admin/Testing Only)
- **`math-tutor-test-results`**: Results from the `/test` page
- Used for dialogue quality assessment

### 5. **Legacy Conversation Format**
- **`math-tutor-conversation`**: Old format conversation (for backward compatibility)
- Being phased out in favor of `math-tutor-conversation-history`

---

## 🔄 Hybrid Storage Strategy

### **For Authenticated Users:**

1. **Conversations & XP:**
   - Saved to **both** localStorage AND database
   - Database is source of truth
   - localStorage acts as cache for fast UI updates
   - On login: localStorage → database (sync), then database → localStorage (load)

2. **Other Data (Voice, Intro, Attempts):**
   - localStorage only (browser-specific)
   - Not synced across devices
   - Reason: User preferences and session-specific data

### **For Anonymous Users:**

- All data stored in localStorage only
- No database persistence
- Data persists across page refreshes but not across devices/browsers

---

## 📋 Summary Table

| Data Type | Anonymous Users | Authenticated Users | Synced Across Devices? |
|-----------|----------------|---------------------|------------------------|
| **Conversations** | localStorage only | localStorage + Database | ✅ Yes (via database) |
| **XP State** | localStorage only | localStorage + Database | ✅ Yes (via database) |
| **Voice Settings** | localStorage only | localStorage only | ❌ No (browser-specific) |
| **Intro Screen Status** | localStorage only | localStorage only | ❌ No (browser-specific) |
| **Attempt Tracking** | localStorage only | localStorage only | ❌ No (session-specific) |
| **Test Results** | localStorage only | localStorage only | ❌ No (admin/testing) |

---

## 🔍 What Gets Synced on Login?

When a user logs in:

1. **Sync Phase:**
   - localStorage conversations → database
   - localStorage XP → database
   - Merges any local data with existing database data

2. **Clear Phase:**
   - Clears localStorage conversations and XP
   - (Keeps voice settings, intro status, attempts - these stay local)

3. **Load Phase:**
   - Loads conversations from database → localStorage
   - Loads XP from database → localStorage
   - UI components read from localStorage (for performance)

---

## 🗑️ What Gets Cleared?

### **"Reset Data" Button (Developer Mode):**
- Clears ALL localStorage data:
  - Conversations (both old and new format)
  - XP state
  - Voice settings
  - Intro screen status
  - All attempt tracking keys
  - Test results
- **Does NOT clear database** (only localStorage)

### **"Clear All" in Conversation History:**
- Clears conversations from:
  - localStorage
  - Database (if authenticated)
- **Does NOT clear XP or other data**

---

## 🚀 Future Considerations

**Potential additions to database:**
- Voice preferences (if users want settings synced)
- User preferences/settings
- Problem attempt history (for analytics)
- Learning progress tracking

**Current design philosophy:**
- Core learning data (conversations, XP) → Database (synced)
- UI preferences/session data → localStorage (browser-specific)

---

## 📝 Technical Details

### Database Models:
- `User`: Account information
- `Conversation`: All conversation sessions
- `XPState`: XP points and level
- `Account`: OAuth account links (for future OAuth support)
- `Session`: NextAuth.js session tokens

### localStorage Keys:
- `math-tutor-conversation-history`: Structured conversation history
- `math-tutor-conversation`: Legacy format (backward compatibility)
- `math-tutor-xp`: XP state
- `math-tutor-tts-settings`: TTS preferences
- `math-tutor-stt-settings`: STT preferences
- `math-tutor-intro-shown`: Intro screen status
- `attempts_{problemSignature}`: Per-problem attempt counts
- `math-tutor-test-results`: Test results (admin)

---

## ✅ Quick Reference

**For authenticated users:**
- ✅ Conversations persist across devices (database)
- ✅ XP persists across devices (database)
- ❌ Voice settings are browser-specific (localStorage)
- ❌ Attempt tracking is session-specific (localStorage)

**For anonymous users:**
- ✅ All data persists in browser (localStorage)
- ❌ No cross-device sync
- ❌ Data lost if browser data is cleared

