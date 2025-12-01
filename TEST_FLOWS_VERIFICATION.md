# Test Flows Verification

## Flow 1: Guest User (Not Logged In)

### Expected Behavior:
1. ✅ **Can create CV through all steps** - No authentication required
2. ✅ **Can see live preview** - Preview updates as they type
3. ❌ **Cannot save draft** - Auth modal appears when clicking "Save Draft"
4. ❌ **Cannot download** - Auth modal appears (redirects to dashboard after auth)
5. ✅ **Can click Finish** - But must authenticate first

### Test Steps:

#### Test 1.1: Create CV as Guest
1. Navigate to `/create-cv` without logging in
2. Fill in CV information (all steps)
3. **Expected**: Can complete all steps, see live preview
4. **Result**: ✅ PASS / ❌ FAIL

#### Test 1.2: Try to Save Draft as Guest
1. As guest, click "Save Draft" button
2. **Expected**: Auth modal appears with message "Sign in to save your CV"
3. **Result**: ✅ PASS / ❌ FAIL

#### Test 1.3: Try to Download as Guest
1. As guest, try to access download (if button exists)
2. **Expected**: Auth modal appears, redirects to dashboard after auth
3. **Result**: ✅ PASS / ❌ FAIL

#### Test 1.4: Click Finish as Guest
1. As guest, complete CV and click "Finish"
2. **Expected**: 
   - Auth modal appears
   - After authentication, CV is saved to Firestore
   - User is redirected to dashboard
3. **Result**: ✅ PASS / ❌ FAIL

---

## Flow 2: Authenticated User

### Expected Behavior:
1. ✅ **Can create CV through all steps**
2. ✅ **Can save draft to Firestore** - Saves to `/drafts/{userId}/cvs/{cvId}`
3. ✅ **Can download CV** - Watermark depends on plan:
   - Free plan: ✅ Download with watermark
   - Paid plans (one_time, flex_pack, annual_pass): ✅ Download without watermark
4. ✅ **Can access dashboard** - See all saved CVs

### Test Steps:

#### Test 2.1: Create and Save CV (Authenticated)
1. Log in with test account
2. Navigate to `/create-cv`
3. Fill in CV information
4. Click "Save Draft"
5. **Expected**: 
   - Draft saved successfully message
   - CV saved to Firestore
   - Can see "Last saved" timestamp
6. **Result**: ✅ PASS / ❌ FAIL

#### Test 2.2: Download CV (Free User - With Watermark)
1. As free user, go to dashboard
2. Click download on a CV
3. **Expected**: 
   - PDF downloads with watermark
   - Filename includes "_Watermarked" or "_مع_علامة_مائية"
4. **Result**: ✅ PASS / ❌ FAIL

#### Test 2.3: Download CV (Paid User - Without Watermark)
1. As paid user (one_time, flex_pack, or annual_pass), go to dashboard
2. Click download on a CV
3. **Expected**: 
   - PDF downloads without watermark
   - Filename does NOT include watermark suffix
4. **Result**: ✅ PASS / ❌ FAIL

#### Test 2.4: Finish Button (Authenticated)
1. As authenticated user, complete CV and click "Finish"
2. **Expected**: 
   - CV is saved to Firestore
   - User is redirected to dashboard
   - CV appears in dashboard
3. **Result**: ✅ PASS / ❌ FAIL

---

## Code Verification Checklist

### Guest User Restrictions:
- [x] `handleSaveDraft()` checks `if (!user)` and shows auth modal
- [x] `exportPdf()` checks `if (!user)` and shows auth modal
- [x] Finish button handles guest users by showing auth modal
- [x] Guest users can still proceed through all CV creation steps

### Authenticated User Features:
- [x] `handleSaveDraft()` saves to Firestore when `user` exists
- [x] Dashboard `downloadCv()` function exists and works
- [x] Watermark logic: `requiresWatermark = !plan || plan.planType === "free"`
- [x] Free users get watermarked downloads
- [x] Paid users get clean downloads

### Auth Modal Integration:
- [x] `AuthRequiredModal` component exists and works
- [x] `pendingProtectedAction` is set correctly
- [x] Post-auth callback executes pending actions
- [x] Guest draft migration works after authentication

---

## Potential Issues to Check:

1. **Finish Button Logic**:
   - When guest clicks Finish, does it show auth modal?
   - After auth, does it save AND navigate to dashboard?
   - Does it handle the case where save fails?

2. **Save Draft Logic**:
   - When guest clicks Save, does it show auth modal?
   - After auth, does it retry saving?
   - Does it show success message after save?

3. **Download Logic**:
   - Is download button visible in create-cv page? (Should be removed/hidden)
   - Does dashboard download work correctly?
   - Does watermark appear for free users?

4. **Auth Flow**:
   - Does `pendingProtectedAction` execute after authentication?
   - Does guest draft migrate to Firestore after auth?
   - Does sessionStorage cleanup work correctly?

---

## Test Results Summary:

| Test | Status | Notes |
|------|--------|-------|
| Guest: Create CV | ⏳ PENDING | |
| Guest: Save Draft | ⏳ PENDING | |
| Guest: Download | ⏳ PENDING | |
| Guest: Finish | ⏳ PENDING | |
| Auth: Save Draft | ⏳ PENDING | |
| Auth: Download (Free) | ⏳ PENDING | |
| Auth: Download (Paid) | ⏳ PENDING | |
| Auth: Finish | ⏳ PENDING | |

---

**Last Updated**: 2025-01-XX
**Tested By**: _______________

