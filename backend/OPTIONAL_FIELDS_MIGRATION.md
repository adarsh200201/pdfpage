# Optional Fields Migration

This document describes the migration process for handling missing optional fields in the PdfPage database.

## Overview

Some users and usages documents are missing optional fields. This migration script ensures data consistency by populating missing fields with appropriate default values.

## Fields Handled

### Users Collection

| Field               | Default Value   | Description                                                   |
| ------------------- | --------------- | ------------------------------------------------------------- |
| `preferredLanguage` | `"en"`          | User's preferred language for the interface                   |
| `country`           | `"unknown"`     | User's country (can be derived from IP geolocation in future) |
| `ipAddress`         | `"not_fetched"` | User's IP address (logged on next login if missing)           |

### Usages Collection

| Field             | Default Value                          | Description                             |
| ----------------- | -------------------------------------- | --------------------------------------- |
| `screenTimeInSec` | `0`                                    | Time spent on tool page in seconds      |
| `ipAddress`       | `"not_fetched"`                        | IP address when the tool was used       |
| `deviceType`      | `"unknown"` or parsed from `userAgent` | Device type: mobile, tablet, or desktop |
| `referrerURL`     | `"direct"`                             | Referring URL or "direct" if none       |

## Usage

### 1. Check Current Status

Before running the migration, verify which documents need updates:

```bash
# Navigate to backend directory
cd backend

# Check current status of optional fields
npm run verify:optional-fields
```

This will show you:

- How many documents are missing each field
- Current distribution of field values
- Migration readiness assessment

### 2. Run Migration

Execute the migration to populate missing fields:

```bash
# Run the optional fields migration
npm run migrate:optional-fields
```

The migration script will:

- Only target documents where fields are `null`, `undefined`, or entirely missing
- Use bulk operations for efficiency
- Log detailed progress and results
- Provide audit information about affected documents

### 3. Verify Results

After migration, verify that all fields have been populated:

```bash
# Verify the migration results
npm run verify:optional-fields
```

## Migration Details

### Safety Features

- **Idempotent**: Can be run multiple times safely
- **Selective**: Only updates documents with missing fields
- **Non-destructive**: Never overwrites existing valid data
- **Atomic**: Uses MongoDB bulk operations for consistency
- **Auditable**: Provides detailed logging of all changes

### Device Type Detection

For the `deviceType` field in usages:

- If `userAgent` is available, the script attempts to parse device type
- Uses the existing `deviceUtils.detectDeviceType()` function
- Falls back to `"unknown"` if parsing fails or no user agent

### Performance

- Uses MongoDB bulk write operations for optimal performance
- Processes documents in batches to handle large datasets
- Provides progress feedback during execution

## Examples

### Before Migration

```json
// User document with missing fields
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "preferredLanguage": null,
  "country": undefined,
  // ipAddress field doesn't exist
}

// Usage document with missing fields
{
  "_id": "...",
  "toolUsed": "merge",
  "screenTimeInSec": null,
  "deviceType": undefined,
  "referrerURL": null,
  // ipAddress field doesn't exist
}
```

### After Migration

```json
// User document with populated defaults
{
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "preferredLanguage": "en",
  "country": "unknown",
  "ipAddress": "not_fetched"
}

// Usage document with populated defaults
{
  "_id": "...",
  "toolUsed": "merge",
  "screenTimeInSec": 0,
  "deviceType": "desktop", // or parsed from userAgent
  "referrerURL": "direct",
  "ipAddress": "not_fetched"
}
```

## Rollback

If you need to rollback the migration:

1. **Backup**: Ensure you have a database backup before migration
2. **Identify**: Use the audit logs to identify which documents were modified
3. **Restore**: Use MongoDB operations to restore specific field values

Example rollback for users:

```javascript
// Remove the populated default values
db.users.updateMany(
  { preferredLanguage: "en", country: "unknown", ipAddress: "not_fetched" },
  { $unset: { preferredLanguage: "", country: "", ipAddress: "" } },
);
```

## Future Enhancements

- **IP Geolocation**: Enhance country detection using IP geolocation services
- **Smart Defaults**: Use historical data to set more intelligent defaults
- **Batch Processing**: Add support for processing very large datasets in smaller batches
- **Progress Tracking**: Add progress indicators for long-running migrations

## Troubleshooting

### Common Issues

1. **Connection Errors**: Ensure MongoDB is running and `MONGODB_URI` is set
2. **Permission Errors**: Verify database user has read/write permissions
3. **Memory Issues**: For very large datasets, consider increasing Node.js memory limit

### Debug Mode

Set `NODE_ENV=development` to enable detailed logging:

```bash
NODE_ENV=development npm run migrate:optional-fields
```

## Script Locations

- **Migration Script**: `backend/migrate-optional-fields.js`
- **Verification Script**: `backend/verify-optional-fields.js`
- **Models**: `backend/models/User.js`, `backend/models/Usage.js`
- **Utilities**: `backend/utils/deviceUtils.js`
