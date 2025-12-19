# Checkpoint API Documentation

## Update Checkpoint Endpoint

**Endpoint**: `PATCH /api/users/:userId/checkpoint`

**Authentication**: Required (JWT)

**Description**: Updates user's learning checkpoint. Supports both new UserProgress-based system and legacy checkpoint format for backward compatibility.

---

### Request Parameters

#### Path Parameters
- `userId` (string, required): The user's MongoDB ObjectId

#### Body Parameters

**Option 1: New UserProgress-based System (Recommended)**
```json
{
  "progressType": "main",  // "main" or "sub" (default: "main")
  "level": "N5",           // "N5", "N4", "N3", "N2", or "N1"
  "steps": {
    "start": 1,            // positive integer, minimum 1 (default: 1)
    "end": 3               // positive integer, start <= end (default: 3)
  },
  "currentIndex": 0        // optional, current word index in deck
}
```

**Option 2: Legacy Checkpoint Format (Backward Compatibility)**
```json
{
  "checkpoint": {
    "level": "N5",
    "step": {
      "min": 1,
      "max": 3
    }
  }
}
```

---

### Response Format

#### Success Response (New System)

**Status Code**: 200 OK

```json
{
  "success": true,
  "message": "Checkpoint updated successfully",
  "data": {
    "userProgress": {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j0",
      "user_id": "64f5a1b2c3d4e5f6g7h8i9j1",
      "progress_type": "main",
      "current_level": "N5",
      "steps": {
        "start": 1,
        "end": 3
      },
      "shuffled_order": ["word_id_1", "word_id_2", ...],
      "current_index": 5,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T11:30:00.000Z"
    },
    "user": {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j1",
      "email": "user@example.com",
      "name": "User Name",
      "learningCheckpoint": {
        "level": "N5",
        "step": {
          "start": 1,
          "end": 3
        }
      }
    }
  }
}
```

#### Success Response (Legacy System)

**Status Code**: 200 OK

```json
{
  "success": true,
  "message": "Legacy checkpoint updated successfully",
  "data": {
    "user": {
      "_id": "64f5a1b2c3d4e5f6g7h8i9j1",
      "email": "user@example.com",
      "name": "User Name",
      "type": "google",
      "learningCheckpoint": {
        "level": "N5",
        "step": {
          "min": 1,
          "max": 3
        }
      }
    }
  }
}
```

---

### Error Responses

#### 400 Bad Request - Missing Required Data
```json
{
  "success": false,
  "message": "Either (level + steps) or checkpoint data is required"
}
```

#### 400 Bad Request - Invalid Progress Type
```json
{
  "success": false,
  "message": "Invalid progress type. Must be 'main' or 'sub'"
}
```

#### 400 Bad Request - Invalid Level
```json
{
  "success": false,
  "message": "Invalid level. Must be N5, N4, N3, N2, or N1"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "You can only update your own checkpoint"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to update checkpoint"
}
```

---

### Behavior Details

#### New System (with level + steps)

1. **Creates or Updates UserProgress**:
   - If no UserProgress exists for the user/progressType combination, creates a new session
   - Generates a new deck based on the sliding window (level + steps)
   - Filters out completed words and optionally prioritizes bookmarked words
   - Saves checkpoint data for session recovery

2. **Updates User's Legacy Checkpoint**:
   - Maintains backward compatibility by updating `learningCheckpoint` field in User model

3. **Automatic Checkpoint Creation**:
   - Creates checkpoint in Checkpoint collection for session recovery
   - Checkpoints include window metadata, word order, and progress position

#### Legacy System (with checkpoint)

1. **Direct Update**:
   - Updates only the `learningCheckpoint` field in User model
   - Does not create UserProgress or Checkpoint records
   - Maintains compatibility with old client versions

---

### Usage Examples

#### Example 1: Start New Main Session at N5 Steps 1-3

**Request**:
```bash
curl -X PATCH http://localhost:8000/api/users/64f5a1b2c3d4e5f6g7h8i9j1/checkpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progressType": "main",
    "level": "N5",
    "steps": {
      "start": 1,
      "end": 3
    }
  }'
```

**Response**: Creates new UserProgress session with deck generated from N5 steps 1-3

---

#### Example 2: Update Current Index in Existing Session

**Request**:
```bash
curl -X PATCH http://localhost:8000/api/users/64f5a1b2c3d4e5f6g7h8i9j1/checkpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progressType": "main",
    "level": "N5",
    "steps": {
      "start": 1,
      "end": 3
    },
    "currentIndex": 15
  }'
```

**Response**: Updates existing UserProgress and saves checkpoint

---

#### Example 3: Start Sub Session (Bookmark-focused)

**Request**:
```bash
curl -X PATCH http://localhost:8000/api/users/64f5a1b2c3d4e5f6g7h8i9j1/checkpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progressType": "sub",
    "level": "N4",
    "steps": {
      "start": 5,
      "end": 7
    }
  }'
```

**Response**: Creates separate sub-session UserProgress for bookmark review

---

#### Example 4: Legacy Format Update

**Request**:
```bash
curl -X PATCH http://localhost:8000/api/users/64f5a1b2c3d4e5f6g7h8i9j1/checkpoint \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "checkpoint": {
      "level": "N3",
      "step": {
        "min": 4,
        "max": 6
      }
    }
  }'
```

**Response**: Updates only User.learningCheckpoint (legacy mode)

---

### Migration Notes

- **Dual System Support**: The endpoint supports both new (UserProgress-based) and legacy (User.learningCheckpoint) systems
- **Automatic Migration**: When using new format, legacy field is automatically updated for backward compatibility
- **Session Independence**: Main and Sub sessions are completely independent (tracked separately in UserProgress)
- **Checkpoint Auto-save**: Every update creates a checkpoint for session recovery

---

### Related Endpoints

- `GET /api/progress/:progressType` - Get current UserProgress
- `GET /api/progress/:progressType/deck` - Get current deck
- `POST /api/progress/:progressType/checkpoint/restore` - Restore from checkpoint
- `GET /api/users/:userId` - Get user profile (includes legacy checkpoint)

---

### Security Notes

- JWT authentication required
- Users can only update their own checkpoints (enforced by user ID validation)
- Progress type, level, and step range are validated
- Checkpoint integrity is maintained through transactional updates
