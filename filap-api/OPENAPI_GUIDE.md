# OpenAPI Documentation Guide

## Setup Complete

Flasgger is configured and working! The OpenAPI spec is automatically generated from route docstrings.

## Access Points

- **API Documentation UI**: http://localhost:5000/api/docs/
- **JSON Spec**: http://localhost:5000/api/spec.json
- **Generated Files**: `api_spec.json` and `api_spec.yml`

## Auto-Generation

The OpenAPI spec is regenerated automatically when you run:

```bash
python run_tests.py
```

## Adding Documentation to Routes

To add an endpoint to the OpenAPI spec, update the docstring with YAML format:

### Template

```python
@bp.route('/api/endpoint', methods=['POST'])
def my_endpoint():
    """Brief description
    ---
    tags:
      - TagName
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            field_name:
              type: string
              description: Field description
    responses:
      200:
        description: Success response
        schema:
          type: object
          properties:
            result:
              type: string
    """
```

### Example (Already Implemented)

See `routes/queues.py` - `create_queue()` function for a complete example.

## Current Status

- **Flasgger Setup**: Complete
- **Auto-generation**: Working
- **Test Integration**: Added to test suite
- **Sample Endpoint**: `/api/queues` POST documented

## Next Steps for Full Documentation

To document all endpoints, add similar YAML docstrings to:

1. **Queue Endpoints**:

   - DONE: `POST /api/queues`
   - DONE: `GET /api/queues/{queue_id}`
   - DONE: `PATCH /api/queues/{queue_id}`
   - TODO: `GET /api/system/stats`
   - TODO: `POST /api/system/cleanup`

2. **Message Endpoints**:

   - DONE: `POST /api/queues/{queue_id}/messages`
   - DONE: `GET /api/queues/{queue_id}/messages`
   - DONE: `PATCH /api/queues/{queue_id}/messages/{message_id}`
   - DONE: `DELETE /api/queues/{queue_id}/messages/{message_id}`

3. **Other Endpoints**:
   - DONE: `POST /api/messages/{message_id}/upvote`
   - DONE: `POST /api/queues/{queue_id}/user-token`
   - DONE: `GET /api/queues/{queue_id}/events`

## Benefits

- **Frontend Integration**: Use generated `api_spec.yml` with code generators
- **Always Updated**: Spec updates automatically when routes change
- **Documentation**: Interactive API docs for testing
- **Type Safety**: Clear request/response schemas
