# Admin Dashboard Enhancements - Requirements Document

## Introduction

This specification defines enhancements to the existing admin dashboard to provide better content management and booking oversight capabilities. The admin will be able to manage the homepage hero image and monitor booking activities through a comprehensive dashboard with real-time notifications and statistics.

## Requirements

### Requirement 1: Homepage Hero Image Management

**User Story:** As an admin, I want to change the main hero background image on the homepage, so that I can keep the website content fresh and seasonal.

#### Acceptance Criteria

1. WHEN the admin accesses the admin dashboard THEN they SHALL see a "Homepage Settings" tab or section
2. WHEN the admin clicks on homepage settings THEN they SHALL see the current hero image displayed
3. WHEN the admin uploads a new hero image THEN the system SHALL validate the image format (JPEG, PNG, WebP)
4. WHEN the admin uploads a new hero image THEN the system SHALL validate the image size (minimum 1920x1080, maximum 10MB)
5. WHEN a valid hero image is uploaded THEN the system SHALL replace the current hero image immediately
6. WHEN the hero image is changed THEN the homepage SHALL display the new image without requiring a page refresh
7. WHEN the admin uploads an invalid image THEN the system SHALL display appropriate error messages
8. WHEN the hero image is successfully updated THEN the system SHALL show a success notification

### Requirement 2: Booking Dashboard and Statistics

**User Story:** As an admin, I want to see all booking submissions and daily statistics, so that I can monitor business activity and respond to customer inquiries promptly.

#### Acceptance Criteria

1. WHEN the admin accesses the dashboard THEN they SHALL see a "Bookings Dashboard" tab or section
2. WHEN the admin views the bookings dashboard THEN they SHALL see a list of all booking submissions
3. WHEN viewing booking submissions THEN each entry SHALL display customer name, email, phone, tour selected, preferred date, number of participants, and submission timestamp
4. WHEN viewing booking submissions THEN they SHALL be sorted by most recent first
5. WHEN the admin clicks on a booking entry THEN they SHALL see full booking details in an expanded view or modal
6. WHEN viewing the dashboard THEN the admin SHALL see today's booking statistics (total bookings today, total participants today)
7. WHEN viewing the dashboard THEN the admin SHALL see weekly booking statistics (bookings this week, revenue estimate)
8. WHEN a new booking is submitted THEN the admin SHALL see a real-time notification badge or counter
9. WHEN the admin marks a booking as "contacted" or "processed" THEN the booking status SHALL be updated
10. WHEN viewing bookings THEN the admin SHALL be able to filter by date range, tour type, or booking status

### Requirement 3: Real-time Notifications System

**User Story:** As an admin, I want to receive immediate notifications when new bookings are submitted, so that I can respond quickly to potential customers.

#### Acceptance Criteria

1. WHEN a new booking is submitted THEN the admin dashboard SHALL display a notification badge with the count of unread bookings
2. WHEN the admin is on the dashboard THEN new booking notifications SHALL appear as toast messages or popup alerts
3. WHEN the admin clicks on a notification THEN they SHALL be taken directly to the booking details
4. WHEN the admin views a booking THEN the notification count SHALL decrease accordingly
5. WHEN there are no unread bookings THEN the notification badge SHALL not be displayed
6. WHEN the admin refreshes the page THEN the notification state SHALL persist
7. WHEN multiple bookings are submitted quickly THEN each SHALL generate a separate notification

### Requirement 4: Booking Management Actions

**User Story:** As an admin, I want to manage booking statuses and add notes, so that I can track my follow-up activities and maintain organized records.

#### Acceptance Criteria

1. WHEN viewing a booking THEN the admin SHALL be able to change its status (New, Contacted, Confirmed, Cancelled)
2. WHEN changing a booking status THEN the system SHALL record the timestamp of the change
3. WHEN viewing a booking THEN the admin SHALL be able to add private notes
4. WHEN adding notes THEN they SHALL be saved automatically and timestamped
5. WHEN viewing booking history THEN the admin SHALL see all status changes and notes chronologically
6. WHEN a booking is marked as "Confirmed" THEN the system SHALL optionally send a confirmation email to the customer
7. WHEN exporting booking data THEN the admin SHALL be able to download bookings as CSV or Excel format
8. WHEN searching bookings THEN the admin SHALL be able to search by customer name, email, or tour name

### Requirement 5: Dashboard Analytics and Insights

**User Story:** As an admin, I want to see booking trends and popular tours, so that I can make informed business decisions about tour offerings and marketing.

#### Acceptance Criteria

1. WHEN viewing the dashboard THEN the admin SHALL see a summary of key metrics (total bookings, conversion rate, popular tours)
2. WHEN viewing analytics THEN the admin SHALL see booking trends over the last 30 days as a chart or graph
3. WHEN viewing tour performance THEN the admin SHALL see which tours receive the most booking requests
4. WHEN viewing customer data THEN the admin SHALL see repeat customer statistics
5. WHEN viewing seasonal data THEN the admin SHALL see booking patterns by month or season
6. WHEN viewing the dashboard THEN metrics SHALL update automatically without page refresh
7. WHEN viewing analytics THEN the admin SHALL be able to select different time ranges (7 days, 30 days, 3 months, 1 year)