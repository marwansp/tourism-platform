# Implementation Plan - Dynamic Multi-Language System

## Overview
This implementation plan breaks down the dynamic multi-language system into incremental, testable tasks. Each task builds on previous work and can be validated independently.

---

## Phase 1: Database & Backend Foundation

- [x] 1. Create database schema for languages table





  - Create migration file `tours-service/migrations/add_languages_table.sql`
  - Define languages table with all required columns (id, code, name, native_name, flag_emoji, is_active, is_default, created_at)
  - Add indexes on code and is_active columns
  - Add unique constraint on code column
  - _Requirements: 9.1, 9.2_

- [x] 2. Seed default languages (EN and FR)





  - Create migration file `tours-service/migrations/seed_default_languages.sql`
  - Insert English (en, 🇺🇸) with is_default=true
  - Insert French (fr, 🇫🇷) with is_active=true
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Migrate tour_translations table schema





  - Create migration file `tours-service/migrations/migrate_tour_translations.sql`
  - Add language_code column to tour_translations
  - Migrate existing 'en' and 'fr' data to language_code
  - Add foreign key constraint to languages.code
  - Drop old language column
  - Add composite unique constraint (tour_id, language_code)
  - Add index on (tour_id, language_code)
  - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 4. Create Language model in backend





  - Add Language class to `tours-service/models.py`
  - Define all columns matching database schema
  - Add relationship to TourTranslation
  - Add validation for code format (2 lowercase letters)
  - _Requirements: 9.1_

- [x] 5. Update TourTranslation model





  - Modify TourTranslation class in `tours-service/models.py`
  - Replace language column with language_code foreign key
  - Add relationship to Language model
  - Update __table_args__ with composite unique constraint
  - _Requirements: 9.2, 9.3_

---

## Phase 2: Language Management API

- [x] 6. Implement GET /api/languages endpoint





  - Add route in `tours-service/main.py`
  - Create CRUD function to fetch all languages
  - Support active_only query parameter
  - Return languages sorted by is_default desc, name asc
  - _Requirements: 5.1_

- [x] 7. Implement POST /api/languages endpoint





  - Add route in `tours-service/main.py` with admin authentication
  - Create CRUD function to insert new language
  - Validate code is exactly 2 lowercase letters
  - Validate code is unique
  - Validate required fields (name, native_name, flag_emoji)
  - Return 201 Created with language object
  - _Requirements: 5.2, 10.3_

- [x] 8. Implement PUT /api/languages/:id endpoint





  - Add route in `tours-service/main.py` with admin authentication
  - Create CRUD function to update language
  - Prevent changing code after creation
  - Prevent deactivating default language
  - Validate is_default constraint (only one default)
  - Return 200 OK with updated language
  - _Requirements: 5.3_

- [x] 9. Implement DELETE /api/languages/:id endpoint





  - Add route in `tours-service/main.py` with admin authentication
  - Create CRUD function to delete language
  - Check if language is default (return 400 if true)
  - Check if tours have translations in this language (return 409 if true)
  - Return 204 No Content on success
  - _Requirements: 5.4, 1.5_

- [x] 10. Implement GET /api/tours/:id/available-languages endpoint





  - Add route in `tours-service/main.py`
  - Query tour_translations for distinct language_code where tour_id matches
  - Return array of language codes
  - _Requirements: 5.5_

---

## Phase 3: Update Tour APIs for Dynamic Languages

- [x] 11. Modify GET /api/tours endpoint for dynamic languages





  - Update tours CRUD function in `tours-service/crud.py`
  - Accept any valid language code in lang query parameter
  - Join with languages table to validate language exists
  - Fallback to default language if translation missing
  - Add available_languages array to response
  - Add is_fallback boolean to response
  - _Requirements: 6.1, 6.2, 6.4_

- [x] 12. Modify GET /api/tours/:id endpoint for dynamic languages





  - Update get_tour CRUD function in `tours-service/crud.py`
  - Accept any valid language code in lang query parameter
  - Join with languages table to validate language exists
  - Fallback to default language if translation missing
  - Add available_languages array to response
  - Add current_language and is_fallback to response
  - _Requirements: 6.3, 6.4_

- [x] 13. Update tour creation/update to support dynamic languages





  - Modify create_tour and update_tour in `tours-service/crud.py`
  - Accept translations as array of {language_code, title, description, itinerary}
  - Validate each language_code exists in languages table
  - Insert/update tour_translations for each provided language
  - Delete removed language translations on update
  - _Requirements: 6.5, 3.3, 3.4_

---

## Phase 4: Frontend API Service Layer

- [x] 14. Create languages API service





  - Create file `frontend/src/api/languages.ts`
  - Define Language, LanguageCreate, LanguageUpdate interfaces
  - Implement getActiveLanguages() function
  - Implement getAllLanguages() function
  - Implement createLanguage() function
  - Implement updateLanguage() function
  - Implement deleteLanguage() function
  - Implement getTourLanguages(tourId) function
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 15. Update tours API service for dynamic languages





  - Modify `frontend/src/api/tours.ts`
  - Update Tour interface to include available_languages array
  - Update Tour interface to include current_language and is_fallback
  - Ensure all tour API calls pass current language parameter
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

---

## Phase 5: Admin Language Management UI

- [x] 16. Create LanguageManager component





  - Create file `frontend/src/components/LanguageManager.tsx`
  - Display table of all languages with columns: flag, code, name, native_name, active status, actions
  - Add "Add Language" button that opens form modal
  - Implement edit icon per language row
  - Implement delete icon with confirmation dialog
  - Implement toggle switch for is_active status
  - Show loading states and error messages
  - _Requirements: 10.1, 10.2, 10.4, 1.1, 1.2_

- [x] 17. Create LanguageForm component





  - Create file `frontend/src/components/LanguageForm.tsx`
  - Add input fields for code, name, native_name, flag_emoji
  - Add validation for code (exactly 2 lowercase letters)
  - Add flag emoji picker or input with emoji suggestions
  - Add is_active checkbox
  - Handle both create and edit modes
  - Show validation errors
  - _Requirements: 10.3, 10.5, 1.3_

- [x] 18. Integrate LanguageManager into AdminPage




  - Modify `frontend/src/pages/AdminPage.tsx`
  - Add "Languages" tab/section to admin navigation
  - Render LanguageManager component in Languages section
  - Ensure admin authentication is required
  - _Requirements: 1.1_

---

## Phase 6: Dynamic Language Switcher

- [x] 19. Update Navbar language switcher to be dynamic





  - Modify `frontend/src/components/Navbar.tsx`
  - Remove hardcoded EN/FR language array
  - Fetch active languages from API on component mount
  - Store languages in state
  - Render language buttons dynamically with flag emoji and code
  - Update dropdown to show all active languages
  - Handle language switching for any language code
  - Cache languages list (refresh every 5 minutes)
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 20. Add language availability indicators to tour cards





  - Modify `frontend/src/components/TourCard.tsx`
  - Display small language flags for available_languages
  - Show "Translated from English" badge if is_fallback is true
  - _Requirements: 4.5, 8.2_

---

## Phase 7: Dynamic Tour Translation Form

- [x] 21. Update TourForm with dynamic language selection





  - Modify `frontend/src/components/TourForm.tsx`
  - Fetch all active languages on component mount
  - Display checkboxes for each active language with flag emoji
  - Allow admin to select which languages to provide translations for
  - Default to English selected
  - _Requirements: 3.1, 3.2_



- [x] 22. Implement dynamic translation tabs in TourForm



  - Modify `frontend/src/components/TourForm.tsx`
  - Replace hardcoded EN/FR tabs with dynamic tabs
  - Create tab for each selected language
  - Show flag emoji and language name in tab label
  - Provide title, description, itinerary inputs per language
  - Load existing translations when editing tour
  - _Requirements: 3.2, 3.5_

- [x] 23. Update tour save logic for multiple languages





  - Modify tour submission in `frontend/src/components/TourForm.tsx`
  - Collect translations from all selected language tabs
  - Format as array of {language_code, title, description, itinerary}
  - Send to backend API
  - Handle validation errors per language
  - _Requirements: 3.3, 3.4_

---

## Phase 8: Update Tour Display Pages

- [x] 24. Update HomePage to use dynamic language





  - Modify `frontend/src/pages/HomePage.tsx`
  - Pass current language from i18n to tour API calls
  - Display tours in selected language
  - Show fallback indicator if needed
  - _Requirements: 4.4, 8.1_

- [x] 25. Update ToursPage to use dynamic language





  - Modify `frontend/src/pages/ToursPage.tsx`
  - Pass current language from i18n to tour API calls
  - Display tours in selected language
  - Show fallback indicator if needed
  - _Requirements: 4.4, 8.1_

- [x] 26. Update TourDetailsPage to use dynamic language





  - Modify `frontend/src/pages/TourDetailsPage.tsx`
  - Pass current language from i18n to tour API call
  - Display tour details in selected language
  - Show available languages for this tour
  - Show "Translated from English" message if fallback
  - _Requirements: 4.4, 4.5, 8.1, 8.2, 8.3_

- [x] 27. Update BookingPage to use dynamic language





  - Modify `frontend/src/pages/BookingPage.tsx`
  - Display tour information in selected language
  - Ensure booking works regardless of language
  - _Requirements: 4.4_

---

## Phase 9: Testing & Validation

- [x] 28. Test database migrations





  - Run migrations on test database
  - Verify languages table created correctly
  - Verify EN and FR seeded
  - Verify tour_translations migrated correctly
  - Verify foreign key constraints work
  - Test rollback if needed
  - _Requirements: 2.4, 9.1, 9.2, 9.3_

- [x] 29. Test language management API endpoints





  - Test GET /api/languages returns all languages
  - Test GET /api/languages?active_only=true filters correctly
  - Test POST /api/languages creates new language
  - Test POST with duplicate code returns 409
  - Test PUT /api/languages/:id updates language
  - Test DELETE /api/languages/:id deletes language
  - Test DELETE with translations returns 409
  - Test DELETE default language returns 400
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 30. Test tour APIs with multiple languages





  - Create test tour with EN, FR, ES translations
  - Test GET /api/tours?lang=es returns Spanish
  - Test GET /api/tours?lang=de returns English (fallback)
  - Test GET /api/tours/:id/available-languages returns correct array
  - Test tour creation with multiple languages
  - Test tour update adds/removes languages
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 31. Test admin language management UI





  - Test language list displays correctly
  - Test add language form validation
  - Test creating new language
  - Test editing existing language
  - Test toggling active status
  - Test deleting language
  - Test error messages display correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4_

- [x] 32. Test dynamic language switcher





  - Test language switcher displays all active languages
  - Test clicking language switches content
  - Test tours display in selected language
  - Test fallback to English when translation missing
  - Test "Translated from English" badge appears
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 8.1, 8.2_

- [x] 33. Test tour form with dynamic languages





  - Test language checkboxes display all active languages
  - Test selecting languages shows translation tabs
  - Test entering translations in multiple languages
  - Test saving tour with multiple languages
  - Test editing tour preserves existing translations
  - Test removing language translation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

---

## Phase 10: Documentation & Deployment

- [ ] 34. Create deployment guide
  - Document database migration steps
  - Document backup procedures before migration
  - Document rollback procedures if needed
  - Document testing checklist for production
  - _Requirements: All_

- [ ] 35. Update API documentation
  - Document all new language endpoints
  - Document changes to tour endpoints
  - Provide example requests and responses
  - Document error codes and messages
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3_

- [ ] 36. Create admin user guide
  - Document how to add new languages
  - Document how to add tour translations
  - Document how to manage active languages
  - Provide screenshots of admin UI
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3_

- [ ] 37. Deploy to production
  - Backup production database
  - Run database migrations
  - Deploy backend changes
  - Deploy frontend changes
  - Verify EN and FR still work
  - Test adding a new language (Spanish)
  - Monitor for errors
  - _Requirements: All_
