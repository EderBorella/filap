from flask import Blueprint, request, jsonify
from services.hand_raise_service import HandRaiseService

hand_raises_bp = Blueprint('hand_raises', __name__)

@hand_raises_bp.route('/api/queues/<queue_id>/handraise', methods=['POST'])
def raise_hand(queue_id):
    """Raise or lower a hand for a user in a queue
    ---
    tags:
      - Hand Raises
    consumes:
      - application/json
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - user_token
            - user_name
          properties:
            user_token:
              type: string
              description: User token for identification
            user_name:
              type: string
              minLength: 1
              maxLength: 100
              description: User's display name (1-100 characters)
    responses:
      201:
        description: Hand raised successfully
        schema:
          type: object
          properties:
            id:
              type: string
              format: uuid
            queue_id:
              type: string
              format: uuid
            user_token:
              type: string
            user_name:
              type: string
            raised_at:
              type: string
              format: date-time
            completed:
              type: boolean
            completed_at:
              type: string
              format: date-time
              nullable: true
      200:
        description: Hand lowered successfully (empty response)
      400:
        description: Bad request (invalid input)
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Queue not found or expired
        schema:
          type: object
          properties:
            error:
              type: string
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        user_token = data.get('user_token')
        user_name = data.get('user_name')

        if not user_token or not user_name:
            return jsonify({'error': 'user_token and user_name are required'}), 400

        hand_raise_data = HandRaiseService.raise_hand(queue_id, user_token, user_name)

        if hand_raise_data is None:
            # Hand was lowered (toggle off) or queue not found
            # Check if queue exists to differentiate between these cases
            queue_check = HandRaiseService.get_hand_raises(queue_id, include_completed=False)
            if queue_check is None:
                return jsonify({'error': 'Queue not found or expired'}), 404
            else:
                return '', 200  # Hand was successfully lowered

        return jsonify(hand_raise_data), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@hand_raises_bp.route('/api/queues/<queue_id>/handraises', methods=['GET'])
def get_hand_raises(queue_id):
    """Get all hand raises for a queue
    ---
    tags:
      - Hand Raises
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
      - in: query
        name: include_completed
        type: boolean
        default: false
        description: Whether to include completed hand raises
    responses:
      200:
        description: Hand raises retrieved successfully
        schema:
          type: object
          properties:
            active_hand_raises:
              type: array
              items:
                type: object
                properties:
                  id:
                    type: string
                    format: uuid
                  queue_id:
                    type: string
                    format: uuid
                  user_token:
                    type: string
                  user_name:
                    type: string
                  raised_at:
                    type: string
                    format: date-time
                  completed:
                    type: boolean
                  completed_at:
                    type: string
                    format: date-time
                    nullable: true
            completed_hand_raises:
              type: array
              items:
                type: object
            total_active:
              type: integer
            total_completed:
              type: integer
      404:
        description: Queue not found or expired
        schema:
          type: object
          properties:
            error:
              type: string
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        include_completed = request.args.get('include_completed', 'false').lower() == 'true'

        hand_raises_data = HandRaiseService.get_hand_raises(queue_id, include_completed)

        if hand_raises_data is None:
            return jsonify({'error': 'Queue not found or expired'}), 404

        return jsonify(hand_raises_data), 200

    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@hand_raises_bp.route('/api/queues/<queue_id>/handraises/<hand_raise_id>', methods=['PATCH'])
def update_hand_raise(queue_id, hand_raise_id):
    """Update a hand raise (host only)
    ---
    tags:
      - Hand Raises
    consumes:
      - application/json
    security:
      - HostSecret: []
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
      - in: path
        name: hand_raise_id
        type: string
        format: uuid
        required: true
        description: Hand raise identifier
      - in: header
        name: X-Queue-Secret
        type: string
        format: uuid
        required: true
        description: Host authentication secret
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            completed:
              type: boolean
              description: Mark hand raise as completed/uncompleted
    responses:
      200:
        description: Hand raise updated successfully
        schema:
          type: object
          properties:
            id:
              type: string
              format: uuid
            queue_id:
              type: string
              format: uuid
            user_token:
              type: string
            user_name:
              type: string
            raised_at:
              type: string
              format: date-time
            completed:
              type: boolean
            completed_at:
              type: string
              format: date-time
              nullable: true
      400:
        description: Bad request
        schema:
          type: object
          properties:
            error:
              type: string
      401:
        description: Unauthorized (invalid host secret)
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Queue or hand raise not found
        schema:
          type: object
          properties:
            error:
              type: string
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        host_secret = request.headers.get('X-Queue-Secret')
        if not host_secret:
            return jsonify({'error': 'Host authentication required'}), 401

        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400

        hand_raise_data = HandRaiseService.update_hand_raise(queue_id, hand_raise_id, host_secret, data)

        if hand_raise_data is None:
            return jsonify({'error': 'Unauthorized or hand raise not found'}), 404

        return jsonify(hand_raise_data), 200

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500

@hand_raises_bp.route('/api/queues/<queue_id>/user-position', methods=['GET'])
def get_user_position(queue_id):
    """Get the position of a user in the hand raise queue
    ---
    tags:
      - Hand Raises
    parameters:
      - in: path
        name: queue_id
        type: string
        format: uuid
        required: true
        description: Queue identifier
      - in: query
        name: user_token
        type: string
        required: true
        description: User token for identification
    responses:
      200:
        description: User position retrieved successfully
        schema:
          type: object
          properties:
            position:
              type: integer
              description: User's position in queue (1-based), null if not in queue
            has_raised_hand:
              type: boolean
              description: Whether user has an active hand raise
      400:
        description: Bad request (missing user_token)
        schema:
          type: object
          properties:
            error:
              type: string
      404:
        description: Queue not found
        schema:
          type: object
          properties:
            error:
              type: string
      500:
        description: Internal server error
        schema:
          type: object
          properties:
            error:
              type: string
    """
    try:
        user_token = request.args.get('user_token')
        if not user_token:
            return jsonify({'error': 'user_token parameter is required'}), 400

        position = HandRaiseService.get_user_position(queue_id, user_token)

        # Check if queue exists by trying to get hand raises
        queue_check = HandRaiseService.get_hand_raises(queue_id, include_completed=False)
        if queue_check is None:
            return jsonify({'error': 'Queue not found or expired'}), 404

        return jsonify({
            'position': position,
            'has_raised_hand': position is not None
        }), 200

    except Exception as e:
        return jsonify({'error': 'Internal server error'}), 500