# Dynamic Multi-Language System - Requirements

## Introduction

This feature transforms the tourism platform from a hardcoded 2-language system (EN/FR) to a fully dynamic multi-language system where administrators can add, manage, and configure any number of languages. Tour content can be translated into any active language, while UI elements use i18n JSON files.

## Glossary

- **Language System**: The backend service and database tables that manage available languages
- **Tour Translation**: Content-specific translations (title, description, itinerary) for tours
- **UI Translation**: Interface text (buttons, labels, navigation) stored in i18n JSON files
- **Language Switcher**: Frontend component displaying available languages with flag emojis
- **Admin Language Panel**: Administrative interface for managing system languages
- **Default Language**: The fallback language (English) used when a translation is unavailable
- **Active Language**: A language that is enabled and visible to users
- **Language Code**: ISO 639-1 two-letter code (en, fr, es, de, ar, zh, etc.)

## Requirements

### Requirement 1: Language Management System

**User Story:** As an administrator, I want to manage available languages in the system, so that I can add support for new markets and customer bases.

#### Acceptance Criteria

1. WHEN the administrator accesses the admin panel, THE Language System SHALL display a "Languages" management section
2. WHEN the administrator views the languages list, THE Language System SHALL display all configured languages with their code, name, flag emoji, and active status
3. WHEN the administrator creates a new language, THE Language System SHALL require language code, English name, native name, and flag emoji
4. WHEN the administrator enables or disables a language, THE Language System SHALL update the language's active status and reflect changes in the frontend immediately
5. WHEN the administrator attempts to delete a language, THE Language System SHALL warn if any tours have translations in that language

### Requirement 2: Pre-installed Default Languages

**User Story:** As a system, I want English and French pre-installed as default languages, so that existing content continues to work without migration.

#### Acceptance Criteria

1. WHEN the Language System initializes for the first time, THE Language System SHALL create English (en, 🇺🇸) as the default language
2. WHEN the Language System initializes for the first time, THE Language System SHALL create French (fr, 🇫🇷) as an active language
3. WHEN the Language System sets default language, THE Language System SHALL mark English as is_default=true
4. WHEN existing tour translations are migrated, THE Language System SHALL map current EN/FR translations to the new language codes
5. WHEN the default language is queried, THE Language System SHALL return English for fallback scenarios

### Requirement 3: Dynamic Tour Translation Management

**User Story:** As an administrator, I want to add tour translations in any active language, so that I can reach customers in their preferred language.

#### Acceptance Criteria

1. WHEN the administrator creates or edits a tour, THE Tour Translation SHALL display all active languages with flag emojis as translation options
2. WHEN the administrator selects a language for translation, THE Tour Translation SHALL provide input fields for title, description, and itinerary in that language
3. WHEN the administrator saves tour translations, THE Tour Translation SHALL store each translation with the corresponding language code
4. WHEN the administrator removes a language translation, THE Tour Translation SHALL delete that specific translation while preserving others
5. WHEN a tour is displayed, THE Tour Translation SHALL show which languages have available translations

### Requirement 4: Dynamic Language Switcher

**User Story:** As a website visitor, I want to see all available languages with their flags in the navigation bar, so that I can view content in my preferred language.

#### Acceptance Criteria

1. WHEN the Language Switcher loads, THE Language Switcher SHALL fetch all active languages from the backend
2. WHEN the Language Switcher displays languages, THE Language Switcher SHALL show flag emoji and language code for each language
3. WHEN the user clicks a language flag, THE Language Switcher SHALL switch the interface to that language
4. WHEN the user switches language, THE Language Switcher SHALL reload tour content in the selected language
5. WHEN a tour lacks translation in the selected language, THE Language Switcher SHALL display content in the default language with a visual indicator

### Requirement 5: API Endpoints for Language Management

**User Story:** As the frontend application, I want RESTful API endpoints for language operations, so that I can manage and display languages dynamically.

#### Acceptance Criteria

1. WHEN GET /api/languages is called, THE Language System SHALL return all active languages with code, name, native_name, flag_emoji, is_default
2. WHEN POST /api/languages is called with valid data, THE Language System SHALL create a new language and return the created resource
3. WHEN PUT /api/languages/:id is called, THE Language System SHALL update the specified language and return the updated resource
4. WHEN DELETE /api/languages/:id is called, THE Language System SHALL delete the language if no tours reference it
5. WHEN GET /api/tours/:id/available-languages is called, THE Language System SHALL return an array of language codes that have translations for that tour

### Requirement 6: Tour API Language Support

**User Story:** As the frontend application, I want tour APIs to support any language code, so that I can display tours in any configured language.

#### Acceptance Criteria

1. WHEN GET /api/tours?lang=XX is called, THE Tour Translation SHALL return tours with translations in language code XX
2. WHEN a tour has no translation in the requested language, THE Tour Translation SHALL return the default language translation
3. WHEN GET /api/tours/:id?lang=XX is called, THE Tour Translation SHALL return the tour with translation in language XX or default
4. WHEN tour data is returned, THE Tour Translation SHALL include an available_languages array showing which languages have translations
5. WHEN creating a tour translation, THE Tour Translation SHALL validate that the language code exists in the languages table

### Requirement 7: UI Translation Files

**User Story:** As a developer, I want to add i18n JSON files for new languages, so that UI elements display in the user's selected language.

#### Acceptance Criteria

1. WHEN a new language is added to the system, THE UI Translation SHALL require a corresponding JSON file in frontend/src/i18n/locales/
2. WHEN the language switcher changes language, THE UI Translation SHALL load the corresponding JSON file for UI text
3. WHEN a JSON file is missing for a language, THE UI Translation SHALL fall back to English for UI elements
4. WHEN UI text is displayed, THE UI Translation SHALL use the t() function to retrieve translated strings
5. WHEN adding a new language JSON file, THE UI Translation SHALL follow the same structure as en.json and fr.json

### Requirement 8: Graceful Fallback Handling

**User Story:** As a website visitor, I want to see content even when my preferred language isn't available, so that I can still browse tours.

#### Acceptance Criteria

1. WHEN a tour lacks translation in the selected language, THE Tour Translation SHALL display the default language (English) content
2. WHEN displaying fallback content, THE Tour Translation SHALL show a badge indicating "Translated from English"
3. WHEN the language switcher shows languages, THE Tour Translation SHALL indicate which tours have translations available
4. WHEN all tours lack a specific language, THE Tour Translation SHALL still display the language option in the switcher
5. WHEN switching to a language with no UI translation file, THE Tour Translation SHALL show English UI text while maintaining tour content in the selected language

### Requirement 9: Database Schema for Languages

**User Story:** As the database system, I want a proper schema for storing language configurations, so that the system can scale to support many languages.

#### Acceptance Criteria

1. WHEN the languages table is created, THE Language System SHALL include columns: id, code, name, native_name, flag_emoji, is_active, is_default, created_at
2. WHEN the tour_translations table is modified, THE Language System SHALL replace hardcoded language columns with a language_code foreign key
3. WHEN a language is referenced, THE Language System SHALL enforce foreign key constraints between tour_translations and languages
4. WHEN querying translations, THE Language System SHALL use indexed language_code for performance
5. WHEN a language is set as default, THE Language System SHALL ensure only one language has is_default=true

### Requirement 10: Admin Language Management UI

**User Story:** As an administrator, I want an intuitive interface for managing languages, so that I can easily add and configure new languages.

#### Acceptance Criteria

1. WHEN the admin opens the Languages panel, THE Admin Language Panel SHALL display a table of all languages with edit and delete actions
2. WHEN the admin clicks "Add Language", THE Admin Language Panel SHALL show a form with fields for code, name, native_name, and flag_emoji
3. WHEN the admin submits the language form, THE Admin Language Panel SHALL validate the language code is unique and exactly 2 characters
4. WHEN the admin toggles language active status, THE Admin Language Panel SHALL update immediately without page refresh
5. WHEN the admin views the form, THE Admin Language Panel SHALL provide a flag emoji picker or list of common flags

## Implementation Notes

- Language codes follow ISO 639-1 standard (2-letter codes)
- Flag emojis use Unicode regional indicator symbols
- Default language (English) cannot be deleted or deactivated
- Tour translations are optional - tours can exist with only one language
- UI translation files must be added manually by developers for each new language
- Language switcher appears in both desktop and mobile navigation
- System supports right-to-left (RTL) languages like Arabic with proper text direction
