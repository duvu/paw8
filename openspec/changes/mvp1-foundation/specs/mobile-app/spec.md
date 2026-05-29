## ADDED Requirements

### Requirement: Mobile login
The Flutter app SHALL allow staff to log in with email and password and persist the JWT securely.

#### Scenario: Successful mobile login
- **WHEN** staff enters valid credentials on the login screen
- **THEN** the app stores the JWT in secure storage and navigates to the home screen

#### Scenario: Invalid credentials on mobile
- **WHEN** staff enters wrong password
- **THEN** the app displays an error message without crashing

### Requirement: Customer and contract search on mobile
The Flutter app SHALL allow staff to search customers and contracts by name, phone, CCCD, or contract code.

#### Scenario: Search customer by phone
- **WHEN** staff types a phone number in the search bar
- **THEN** the app displays matching customers fetched from the API

### Requirement: Due-soon and overdue lists
The Flutter app SHALL display lists of contracts near due date and overdue contracts for the staff's assigned store.

#### Scenario: View overdue list
- **WHEN** staff navigates to the overdue screen
- **THEN** the app shows all overdue contracts for their store with days overdue and estimated balance

### Requirement: Photo capture and upload
The Flutter app SHALL allow staff to capture photos with the device camera and upload them to the server via presigned URL.

#### Scenario: Upload customer ID photo
- **WHEN** staff taps "Capture CCCD front" on the customer screen
- **THEN** the camera opens, the photo is captured, and uploaded to the presigned URL; the file metadata is confirmed to the API

#### Scenario: Upload asset photo
- **WHEN** staff taps "Add photo" on the asset screen
- **THEN** the camera opens and the photo is uploaded and linked to the asset

### Requirement: View asset and contract details on mobile
The Flutter app SHALL display read-only asset and contract detail screens.

#### Scenario: View contract detail
- **WHEN** staff taps a contract in the list
- **THEN** the app displays contract info, asset info, customer info, and current status
