from flask import Flask, request, jsonify
from flask_cors import CORS
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.errors import SessionPasswordNeededError, PeerIdInvalidError, UserPrivacyRestrictedError, FloodWaitError
from telethon.errors.rpcerrorlist import UserAlreadyParticipantError, InviteHashExpiredError, ChannelPrivateError
from telethon.tl.functions.contacts import ResolveUsernameRequest
from telethon.tl.functions.users import GetFullUserRequest
from telethon.tl.functions.messages import ImportChatInviteRequest
from telethon.tl.functions.channels import InviteToChannelRequest, JoinChannelRequest
from telethon.tl.types import PeerUser, InputPeerUser, InputPeerChannel
import asyncio
import threading
import os
import json
from dotenv import load_dotenv
import logging
from difflib import get_close_matches

load_dotenv()
X_API_KEY = os.getenv("X_API_KEY")
FLASK_HOST = os.getenv("FLASK_HOST", "127.0.0.1") 
FLASK_PORT = os.getenv("FLASK_PORT", "8000") 
TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID", 123456)
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH", 'abc123def456ghi789')
HISTORY_FILE = 'history.json'


if not X_API_KEY:
    raise RuntimeError("X_API_KEY is required")


logging.basicConfig(filename='telegram_agent_error.log', level=logging.ERROR,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

clients = {}


_loop = asyncio.new_event_loop()
def _start_background_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()

_loop_thread = threading.Thread(target=_start_background_loop, args=(_loop,), daemon=True)
_loop_thread.start()

def run_async(coro):
    future = asyncio.run_coroutine_threadsafe(coro, _loop)
    return future.result()


def validate_json(data, required_fields, optional_fields=None):
    try:
        if not data:
            return False, "JSON formatting is incorrect: No data provided"
        if not isinstance(data, dict):
            return False, "JSON formatting is incorrect: Expected a JSON object"
        
        valid_fields = set(required_fields)
        if optional_fields:
            valid_fields.update(optional_fields)
        
        provided_fields = set(data.keys())
        for key in provided_fields:
            if key not in valid_fields:
                close_match = get_close_matches(key, valid_fields, n=1, cutoff=0.6)
                correct_field = close_match[0] if close_match else "unknown"
                error_msg = f"Invalid Parameter: '{key}' should be '{correct_field}'"
                logger.error(error_msg)
                return False, error_msg
        
        for field in required_fields:
            if field not in data or data.get(field) is None or (isinstance(data[field], str) and not data[field].strip()):
                error_msg = f"Invalid parameter: '{field}' is required or empty"
                logger.error(error_msg)
                return False, error_msg
        return True, ""
    except (TypeError, ValueError):
        error_msg = "JSON formatting is incorrect: Invalid JSON structure"
        logger.error(error_msg)
        return False, error_msg


@app.before_request
def verify_authentication_key():
    if request.method == 'OPTIONS':
        return
    if request.endpoint in [
        'start_login',
        'verify_otp',
        'send_message',
        'send_media',
        'fetch_members',
        'get_group_chats',
        'join_group',
        'save_history',
        'get_history'
    ]:
        auth_key = request.headers.get("AUTHENTICATION-KEY")
        if not auth_key:
            logger.error("Unauthorized access attempt: Missing AUTHENTICATION-KEY")
            return jsonify({"status": False, "message": "Missing AUTHENTICATION-KEY in headers"}), 401
        if auth_key != X_API_KEY:
            logger.error("Unauthorized access attempt: Invalid AUTHENTICATION-KEY")
            return jsonify({"status": False, "message": "Invalid AUTHENTICATION-KEY"}), 403

async def send_code_async(api_id, api_hash, phone_number):
    try:
        if not isinstance(api_id, int):
            raise ValueError("Invalid parameter: apiId must be an integer")
        if not isinstance(api_hash, str) or not api_hash.strip():
            raise ValueError("Invalid parameter: apiHash must be a non-empty string")
        client = TelegramClient(StringSession(""), int(api_id), api_hash, loop=_loop)
        await client.connect()
        if not await client.is_user_authorized():
            await client.send_code_request(phone_number)
            clients[phone_number] = client
            return {"status": "success", "message": f"OTP sent successfully to {phone_number}"}
        return {"status": "error", "message": "User already authorized"}
    except Exception as e:
        logger.error(f"Failed to send code: {str(e)}")
        return {"status": "error", "message": str(e)}

async def verify_otp_async(phone_number, otp_code, password=None):
    try:
        temp_client = clients.get(phone_number)
        if not temp_client:
            raise ValueError("Invalid OTP: No session found for phone number")
        await temp_client.sign_in(phone_number, otp_code)
        if await temp_client.is_user_authorized():
            string_session = StringSession.save(temp_client.session)
            return {"status": "success", "sessionString": string_session, "message": "Login successful"}
        raise ValueError("Login failed: Invalid OTP code")
    except SessionPasswordNeededError:
        if password:
            try:
                await temp_client.sign_in(password=password)
                if await temp_client.is_user_authorized():
                    string_session = StringSession.save(temp_client.session)
                    return {"status": "success", "sessionString": string_session, "message": "Login successful with 2FA"}
                raise ValueError("Login failed: Invalid 2FA password")
            except Exception as e:
                logger.error(f"2FA verification failed: {str(e)}")
                return {"status": "error", "message": f"2FA verification failed: {str(e)}"}
        return {"status": "error", "message": "2FA password required"}
    except Exception as e:
        logger.error(f"Failed to verify OTP: {str(e)}")
        return {"status": "error", "message": str(e)}

async def send_message_async(session_string, chat_ids, message_text):
    try:
        client = TelegramClient(StringSession(session_string), int(TELEGRAM_API_ID), TELEGRAM_API_HASH, loop=_loop)
        await client.connect()
        results = []
        for chat_id in chat_ids:
            try:
                await client.send_message(int(chat_id), message_text)
                results.append({"id": chat_id, "status": "success", "message": "Sent successfully"})
            except Exception as e:
                logger.error(f"Failed to send message to chat_id {chat_id}: {str(e)}")
                results.append({"id": chat_id, "status": "error", "message": str(e)})
        return results
    except Exception as e:
        logger.error(f"Failed to send messages: {str(e)}")
        return [{"status": "error", "message": str(e)}]

async def send_media_async(session_string, chat_ids, file_path, caption):
    try:
        client = TelegramClient(StringSession(session_string), int(TELEGRAM_API_ID), TELEGRAM_API_HASH, loop=_loop)
        await client.connect()
        results = []
        for chat_id in chat_ids:
            try:
                await client.send_file(int(chat_id), file_path, caption=caption)
                results.append({"id": chat_id, "status": "success", "message": "Media sent successfully"})
            except Exception as e:
                logger.error(f"Failed to send media to chat_id {chat_id}: {str(e)}")
                results.append({"id": chat_id, "status": "error", "message": str(e)})
        return results
    except Exception as e:
        logger.error(f"Failed to send media: {str(e)}")
        return [{"status": "error", "message": str(e)}]

async def fetch_members_async(session_string, group_id, limit=100):
    try:
        client = TelegramClient(StringSession(session_string), int(TELEGRAM_API_ID), TELEGRAM_API_HASH, loop=_loop)
        await client.connect()
        
        # Robust entity lookup
        try:
            target_id = int(group_id)
        except ValueError:
            target_id = group_id
            
        entity = None
        # First attempt: get_entity
        try:
            entity = await client.get_entity(target_id)
            logger.info(f"Entity found via get_entity for {target_id}")
        except Exception as e:
            logger.warning(f"get_entity failed for {target_id}: {str(e)}. Searching dialogs...")
            
            # Second attempt: Search dialogs
            dialogs = await client.get_dialogs()
            for d in dialogs:
                # Log IDs for debugging if it's the right one but format differs
                if str(d.id) == str(target_id) or str(d.id).endswith(str(target_id).replace("-100", "")):
                    entity = d.entity
                    logger.info(f"Entity found in dialogs: {d.name} (ID: {d.id})")
                    break
                if (getattr(d.entity, 'username', None) and str(target_id).replace('@', '') == d.entity.username):
                    entity = d.entity
                    logger.info(f"Entity found in dialogs by username: {d.name}")
                    break
        
        if not entity:
            raise ValueError(f"Cannot find any group/channel corresponding to \"{group_id}\". "
                             "Please ensure you have joined the group and the ID is correct.")

        participants = await client.get_participants(entity, limit=limit)
        members = []
        for p in participants:
            first_name = p.first_name if p.first_name else "Not Available"
            last_name = p.last_name if p.last_name else "Not Available"
            username = p.username if p.username else "Not Available"
            members.append({
                "id": p.id,
                "firstName": first_name,
                "lastName": last_name,
                "username": username
            })
        return {"status": "success", "members": members}
    except Exception as e:
        logger.error(f"Failed to fetch members: {str(e)}")
        return {"status": "error", "message": str(e)}

async def get_group_chats_async(session_string):
    try:
        client = TelegramClient(StringSession(session_string), int(TELEGRAM_API_ID), TELEGRAM_API_HASH, loop=_loop)
        await client.connect()
        dialogs = await client.get_dialogs()
        chats = []
        for dialog in dialogs:
            entity = dialog.entity
            chat_type = None
            if getattr(entity, 'megagroup', False):
                chat_type = "supergroup"
            elif getattr(entity, 'broadcast', False):
                chat_type = "channel"
            elif entity.__class__.__name__ == "Chat":
                chat_type = "group"
            elif entity.__class__.__name__ == "User":
                chat_type = "private"
            
            full_id = entity.id
            if chat_type in ["supergroup", "channel"]:
                # Bot API format for supergroups/channels
                full_id = int(f"-100{entity.id}")
            elif chat_type == "group":
                # Bot API format for standard groups
                full_id = -entity.id

            chats.append({
                "id": full_id,
                "title": dialog.name,
                "username": getattr(entity, 'username', None),
                "accessHash": getattr(entity, 'access_hash', None),
                "type": chat_type
            })
        return {"status": "success", "chats": chats}
    except Exception as e:
        logger.error(f"Failed to fetch group chats: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.route('/startLogin', methods=['POST'])
def start_login():
    try:
        data = request.get_json()
        is_valid, error_msg = validate_json(data, ['phoneNumber', 'apiId', 'apiHash'])
        if not is_valid:
            logger.error(f"Validation error: {error_msg}")
            return jsonify({"status": False, "message": error_msg}), 400
        
        phone_number = data.get('phoneNumber')
        api_id = data.get('apiId')
        api_hash = data.get('apiHash')

        try:
            api_id = int(api_id)
        except (ValueError, TypeError):
            logger.error("Validation error: apiId must be an integer")
            return jsonify({"status": False, "message": "Invalid parameter: apiId must be an integer"}), 400
        if not isinstance(api_hash, str) or not api_hash.strip():
            logger.error("Validation error: apiHash must be a non-empty string")
            return jsonify({"status": False, "message": "Invalid parameter: apiHash must be a non-empty string"}), 400

        message = run_async(send_code_async(api_id, api_hash, phone_number))
        return jsonify(message), 200 if message["status"] == "success" else 400
    except json.JSONDecodeError:
        logger.error("JSON formatting is incorrect: Unable to parse JSON")
        return jsonify({"status": False, "message": "JSON formatting is incorrect"}), 400
    except (ValueError, TypeError, KeyError) as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"status": False, "message": f"Invalid parameters: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Unexpected server error in startLogin: {str(e)}")
        return jsonify({"status": False, "message": f"Unexpected server error: {str(e)}"}), 500

@app.route('/verifyOtp', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json()
        is_valid, error_msg = validate_json(data, ['phoneNumber', 'otpCode'], optional_fields=['password'])
        if not is_valid:
            logger.error(f"Validation error: {error_msg}")
            return jsonify({"status": False, "message": error_msg}), 400
        
        phone_number = data.get('phoneNumber')
        otp_code = data.get('otpCode')
        password = data.get('password')

        result = run_async(verify_otp_async(phone_number, otp_code, password))
        return jsonify(result), 200 if result["status"] == "success" else 400
    except json.JSONDecodeError:
        logger.error("JSON formatting is incorrect: Unable to parse JSON")
        return jsonify({"status": False, "message": "JSON formatting is incorrect"}), 400
    except (ValueError, TypeError, KeyError) as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"status": False, "message": f"Invalid parameters: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Unexpected server error in verifyOtp: {str(e)}")
        return jsonify({"status": False, "message": f"Unexpected server error in verifyOtp: {str(e)}"}), 500

@app.route('/sendMessage', methods=['POST'])
def send_message():
    try:
        data = request.get_json()
        is_valid, error_msg = validate_json(data, ['sessionString', 'chatIds', 'messageText'])
        if not is_valid:
            logger.error(f"Validation error: {error_msg}")
            return jsonify({"status": False, "message": error_msg}), 400
        
        session_string = data.get('sessionString')
        chat_ids = data.get('chatIds')
        message_text = data.get('messageText')

        if not isinstance(chat_ids, list):
            logger.error("Invalid parameter: chatIds must be a list")
            return jsonify({"status": False, "message": "Invalid parameter: chatIds must be a list"}), 400
        if not chat_ids:
            logger.error("Invalid parameter: chatIds can't be empty")
            return jsonify({"status": False, "message": "Invalid parameter: chatIds can't be empty"}), 400

        result = run_async(send_message_async(session_string, chat_ids, message_text))
        return jsonify({"results": result}), 200
    except json.JSONDecodeError:
        logger.error("JSON formatting is incorrect: Unable to parse JSON")
        return jsonify({"status": False, "message": "JSON formatting is incorrect"}), 400
    except (ValueError, TypeError, KeyError) as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"status": False, "message": f"Invalid parameters: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Unexpected server error in sendMessage: {str(e)}")
        return jsonify({"status": False, "message": f"Unexpected server error in sendMessage: {str(e)}"}), 500

@app.route('/sendMedia', methods=['POST'])
def send_media():
    try:
        session_string = request.form.get('sessionString')
        chat_ids_raw = request.form.get('chatIds')
        caption = request.form.get('caption')
        media = request.files.get('media')
        
        if not (session_string and chat_ids_raw and media):
            logger.error("Invalid parameters: sessionString, chatIds, and media are required")
            return jsonify({"status": False, "message": "Invalid parameters: sessionString, chatIds, and media are required"}), 400
        
        try:
            chat_ids = json.loads(chat_ids_raw)
            if not isinstance(chat_ids, list):
                raise ValueError("chatIds must be a JSON array")
            if not chat_ids:
                logger.error("Invalid parameter: chatIds can't be empty")
                return jsonify({"status": False, "message": "Invalid parameter: chatIds can't be empty"}), 400
        except json.JSONDecodeError:
            logger.error("JSON formatting is incorrect: chatIds must be a valid JSON array")
            return jsonify({"status": False, "message": "JSON formatting is incorrect: chatIds must be a valid JSON array"}), 400
        
        file_path = f"temp_{media.filename}"
        media.save(file_path)
        result = run_async(send_media_async(session_string, chat_ids, file_path, caption))
        os.remove(file_path)
        return jsonify({"results": result}), 200
    except (ValueError, TypeError, KeyError) as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"status": False, "message": f"Invalid parameters: {str(e)}"}), 400
    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Unexpected server error in sendMedia: {str(e)}")
        return jsonify({"status": False, "message": f"Unexpected server error in sendMedia: {str(e)}"}), 500

@app.route('/fetchMembers', methods=['POST'])
def fetch_members():
    try:
        data = request.get_json()
        is_valid, error_msg = validate_json(data, ['sessionString', 'groupId'], optional_fields=['limit'])
        if not is_valid:
            logger.error(f"Validation error: {error_msg}")
            return jsonify({"status": False, "message": error_msg}), 400
        
        session_string = data.get('sessionString')
        group_id = data.get('groupId')
        limit = data.get('limit', 200)

        if not group_id:
            logger.error("Invalid parameter: groupId can't be empty")
            return jsonify({"status": False, "message": "Invalid parameter: groupId can't be empty"}), 400

        members = run_async(fetch_members_async(session_string, group_id, limit=limit))
        return jsonify(members), 200 if members["status"] == "success" else 400
    except json.JSONDecodeError:
        logger.error("JSON formatting is incorrect: Unable to parse JSON")
        return jsonify({"status": False, "message": "JSON formatting is incorrect"}), 400
    except (ValueError, TypeError, KeyError) as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"status": False, "message": f"Invalid parameters: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Unexpected server error in fetchMembers: {str(e)}")
        return jsonify({"status": False, "message": f"Unexpected server error in fetchMembers: {str(e)}"}), 500

@app.route('/getGroupChats', methods=['POST'])
def get_group_chats():
    try:
        data = request.get_json()
        is_valid, error_msg = validate_json(data, ['sessionString'])
        if not is_valid:
            logger.error(f"Validation error: {error_msg}")
            return jsonify({"status": False, "message": error_msg}), 400
        
        session_string = data.get('sessionString')
        result = run_async(get_group_chats_async(session_string))
        return jsonify(result), 200 if result["status"] == "success" else 400
    except json.JSONDecodeError:
        logger.error("JSON formatting is incorrect: Unable to parse JSON")
        return jsonify({"status": False, "message": "JSON formatting is incorrect"}), 400
    except (ValueError, TypeError, KeyError) as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({"status": False, "message": f"Invalid parameters: {str(e)}"}), 400
    except Exception as e:
        logger.error(f"Unexpected server error in getGroupChats: {str(e)}")
        return jsonify({"status": False, "message": f"Unexpected server error in getGroupChats: {str(e)}"}), 500

@app.route('/saveHistory', methods=['POST'])
def save_history():
    try:
        data = request.get_json()
        is_valid, error_msg = validate_json(data, ['name', 'type', 'recipients', 'rate', 'status', 'ratio', 'color', 'icon'])
        if not is_valid:
            return jsonify({"status": False, "message": error_msg}), 400
        
        history = []
        if os.path.exists(HISTORY_FILE):
            with open(HISTORY_FILE, 'r') as f:
                try:
                    history = json.load(f)
                except:
                    history = []
        
        # Add timestamp
        from datetime import datetime
        data['timestamp'] = datetime.now().strftime("%b %d, %Y")
        data['time'] = datetime.now().strftime("%H:%M %p")
        
        history.insert(0, data)
        # Limit to 500 records
        history = history[:500]
        
        with open(HISTORY_FILE, 'w') as f:
            json.dump(history, f, indent=4)
            
        return jsonify({"status": "success"}), 200
    except Exception as e:
        logger.error(f"Failed to save history: {str(e)}")
        return jsonify({"status": False, "message": str(e)}), 500

@app.route('/getHistory', methods=['GET'])
def get_history():
    try:
        if not os.path.exists(HISTORY_FILE):
            return jsonify([]), 200
        with open(HISTORY_FILE, 'r') as f:
            history = json.load(f)
        return jsonify(history), 200
    except Exception as e:
        logger.error(f"Failed to fetch history: {str(e)}")
        return jsonify([]), 200


if __name__ == '__main__':
    try:
        print(f"Starting server on {FLASK_HOST}:{FLASK_PORT}")
        app.run(debug=False, host=FLASK_HOST, port=int(FLASK_PORT))
    except Exception as e:
        logger.error(f"Server startup error: {str(e)}")
        raise