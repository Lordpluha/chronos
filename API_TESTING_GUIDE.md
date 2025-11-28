# 📋 Chronos API - CRUD Operations Testing Guide

## 🎯 Overview

This documentation describes how to test the API for **Task Lists** and **Tasks** with CRUD operations.

---

## 🚀 Getting Started

### 1️⃣ **Install Postman**
- Download from [postman.com](https://www.postman.com/downloads/)
- Or use alternative tools: Insomnia, Thunder Client, etc.

### 2️⃣ **Import the Collection**
1. Open Postman
2. Click `Import`
3. Select the file `Chronos_API_Collection.postman_collection.json`
4. The collection will load with all requests

### 3️⃣ **Set Up Variables**
- In Postman, go to `Collections` → `Chronos API`
- Click on the `Variables` tab
- Set values for:
  - `taskListId` - Task list ID (filled after creation)
  - `taskId` - Task ID (filled after creation)

---

## 📊 API Endpoints

### **Task Lists** (`/api/task-lists`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/task-lists` | Create a new task list |
| **GET** | `/api/task-lists` | Get all user's task lists |
| **GET** | `/api/task-lists/:id` | Get a specific task list |
| **GET** | `/api/task-lists/:id/statistics` | Get task list statistics |
| **PATCH** | `/api/task-lists/:id` | Edit task list |
| **DELETE** | `/api/task-lists/:id` | Delete task list |

### **Tasks** (`/api/tasks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| **POST** | `/api/tasks/:taskListId` | Create a task in a task list |
| **GET** | `/api/tasks/:taskListId` | Get all tasks of a task list |
| **GET** | `/api/tasks/:taskListId/:taskId` | Get a specific task |
| **PATCH** | `/api/tasks/:taskListId/:taskId` | Edit task |
| **PATCH** | `/api/tasks/:taskListId/:taskId/toggle` | Toggle completion status |
| **PATCH** | `/api/tasks/:taskListId/:taskId/tags/add` | Add tag |
| **PATCH** | `/api/tasks/:taskListId/:taskId/tags/remove` | Remove tag |
| **DELETE** | `/api/tasks/:taskListId/:taskId` | Delete task |
| **GET** | `/api/tasks/overdue` | Get overdue tasks |
| **GET** | `/api/tasks/today` | Get today's tasks |
| **GET** | `/api/tasks/upcoming?days=7` | Get upcoming tasks |

---

## 🧪 Step-by-Step Testing Scenario

### **Step 1: Create a Task List**

**Request:**
```bash
POST http://localhost:3001/api/task-lists
Content-Type: application/json

{
  "name": "My First Task List",
  "description": "This is my first task list"
}
```

**Expected Response (201):**
```json
{
  "message": "Task list created successfully",
  "data": {
    "_id": "673a1b2c3d4e5f6g7h8i9j0k",
    "name": "My First Task List",
    "description": "This is my first task list",
    "creator": {
      "_id": "...",
      "username": "testuser"
    },
    "tasks": [],
    "created": "2025-11-20T10:30:00.000Z",
    "updated": "2025-11-20T10:30:00.000Z"
  }
}
```

✅ **Save `_id` as `taskListId` for the next requests!**

---

### **Step 2: Get All Task Lists**

**Request:**
```bash
GET http://localhost:3001/api/task-lists?populate=false
```

**Expected Response (200):**
```json
{
  "message": "Task lists retrieved successfully",
  "data": [
    {
      "_id": "673a1b2c3d4e5f6g7h8i9j0k",
      "name": "My First Task List",
      ...
    }
  ],
  "count": 1
}
```

---

### **Step 3: Create a Task**

**Request:**
```bash
POST http://localhost:3001/api/tasks/{{taskListId}}
Content-Type: application/json

{
  "title": "Complete API documentation",
  "description": "Write comprehensive docs",
  "priority": "high",
  "tags": ["documentation", "urgent"],
  "start": "2025-11-20T08:00:00Z",
  "end": "2025-11-25T17:00:00Z",
  "estimated_duration": 480
}
```

**Expected Response (201):**
```json
{
  "message": "Task created successfully",
  "data": {
    "_id": "673a1b2c3d4e5f6g7h8i9j1k",
    "title": "Complete API documentation",
    "description": "Write comprehensive docs",
    "priority": "high",
    "tags": ["documentation", "urgent"],
    "completed": false,
    "start": "2025-11-20T08:00:00.000Z",
    "end": "2025-11-25T17:00:00.000Z",
    "created": "2025-11-20T10:35:00.000Z"
  }
}
```

✅ **Save `_id` as `taskId` for the next requests!**

---

### **Step 4: Get Task List Tasks**

**Request:**
```bash
GET http://localhost:3001/api/tasks/{{taskListId}}?filter=pending&sort=-created
```

**Expected Response (200):**
```json
{
  "message": "Tasks retrieved successfully",
  "data": [
    {
      "_id": "673a1b2c3d4e5f6g7h8i9j1k",
      "title": "Complete API documentation",
      ...
    }
  ],
  "count": 1
}
```

---

### **Step 5: Edit Task**

**Request:**
```bash
PATCH http://localhost:3001/api/tasks/{{taskListId}}/{{taskId}}
Content-Type: application/json

{
  "title": "Updated: Complete API documentation",
  "priority": "urgent",
  "description": "Updated description"
}
```

**Expected Response (200):**
```json
{
  "message": "Task updated successfully",
  "data": {
    "_id": "673a1b2c3d4e5f6g7h8i9j1k",
    "title": "Updated: Complete API documentation",
    "priority": "urgent",
    ...
  }
}
```

---

### **Step 6: Toggle Completion Status**

**Request:**
```bash
PATCH http://localhost:3001/api/tasks/{{taskListId}}/{{taskId}}/toggle
```

**Expected Response (200):**
```json
{
  "message": "Task completion toggled successfully",
  "data": {
    "_id": "673a1b2c3d4e5f6g7h8i9j1k",
    "completed": true,
    ...
  }
}
```

---

### **Step 7: Add Tag**

**Request:**
```bash
PATCH http://localhost:3001/api/tasks/{{taskListId}}/{{taskId}}/tags/add
Content-Type: application/json

{
  "tag": "completed"
}
```

**Expected Response (200):**
```json
{
  "message": "Tag added successfully",
  "data": {
    "tags": ["documentation", "urgent", "completed"],
    ...
  }
}
```

---

### **Step 8: Remove Tag**

**Request:**
```bash
PATCH http://localhost:3001/api/tasks/{{taskListId}}/{{taskId}}/tags/remove
Content-Type: application/json

{
  "tag": "urgent"
}
```

**Expected Response (200):**
```json
{
  "message": "Tag removed successfully",
  "data": {
    "tags": ["documentation", "completed"],
    ...
  }
}
```

---

### **Step 9: Get Task List Statistics**

**Request:**
```bash
GET http://localhost:3001/api/task-lists/{{taskListId}}/statistics
```

**Expected Response (200):**
```json
{
  "message": "Task list statistics retrieved successfully",
  "data": {
    "taskListId": "673a1b2c3d4e5f6g7h8i9j0k",
    "total": 1,
    "completed": 1,
    "pending": 0,
    "overdue": 0
  }
}
```

---

### **Step 10: Delete Task**

**Request:**
```bash
DELETE http://localhost:3001/api/tasks/{{taskListId}}/{{taskId}}
```

**Expected Response (200):**
```json
{
  "message": "Task deleted successfully",
  "data": {
    "id": "673a1b2c3d4e5f6g7h8i9j1k"
  }
}
```

---

### **Step 11: Delete Task List**

**Request:**
```bash
DELETE http://localhost:3001/api/task-lists/{{taskListId}}
```

**Expected Response (200):**
```json
{
  "message": "Task list deleted successfully",
  "data": {
    "id": "673a1b2c3d4e5f6g7h8i9j0k"
  }
}
```

---

## 🔍 Additional Requests

### **Get Overdue Tasks**
```bash
GET http://localhost:3001/api/tasks/overdue
```

### **Get Today's Tasks**
```bash
GET http://localhost:3001/api/tasks/today
```

### **Get Upcoming Tasks (next 7 days)**
```bash
GET http://localhost:3001/api/tasks/upcoming?days=7
```

---

## 🛠️ Useful Query Parameters

### **For GET /api/task-lists**
- `populate=true` - Load tasks for each task list
- `populate=false` - Don't load tasks (default)

### **For GET /api/tasks/:taskListId**
- `filter=completed` - Only completed tasks
- `filter=pending` - Only pending tasks
- `sort=-created` - Sort by date (descending)
- `sort=created` - Sort by date (ascending)

---

## ❌ Error Codes

| Code | Description |
|------|-------------|
| **201** | ✅ Created - Successfully created |
| **200** | ✅ OK - Successfully processed |
| **400** | ❌ Bad Request - Invalid request |
| **401** | ❌ Unauthorized - Authentication required |
| **404** | ❌ Not Found - Resource not found |
| **500** | ❌ Server Error - Server error |

---

## 🔐 Authentication Notes

All requests require:
- A valid JWT token in cookies (set during login)
- Send requests with `credentials: include` (for browser)

---

## 📝 Full Scenario Example in Postman

1. **Create Task List** → Copy `_id` from response to `taskListId` variable
2. **Create Task** → Copy `_id` from response to `taskId` variable
3. **Get Tasks by Task List** → Verify task is in the list
4. **Update Task** → Update task data
5. **Toggle Task Completion** → Toggle status
6. **Add Tag to Task** → Add a tag
7. **Get Task List Statistics** → Check statistics
8. **Delete Task** → Delete task
9. **Delete Task List** → Delete task list

---

## 💡 Tips & Tricks

1. **Use Postman Variables** for ID automation
2. **Set up Environment** for different base URLs (dev, prod)
3. **Use Pre-request Scripts** for automatic date/time filling
4. **Run Collections** for group testing
5. **Export results** for reports

---

## 📞 Contact & Help

If you encounter issues:
1. Check logs in the API Docker container
2. Make sure the user is authenticated
3. Verify JSON format in request bodies
4. Confirm the server is running on port 3001

---

**Created:** November 2025  
**Last Updated:** November 26, 2025
