from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq
import json
import uuid

app = Flask(__name__)
CORS(app)

# Initialize Groq client
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "your-groq-api-key-here")
client = Groq(api_key=GROQ_API_KEY)

# Session storage
sessions = {}

# Required fields
REQUIRED_FIELDS = [
    "fullName", "age", "gender", "contactNumber", "email",
    "address", "chiefComplaint", "medicalHistory", "allergies",
    "currentMedications", "emergencyContactName",
    "emergencyContactRelationship", "emergencyContactPhone"
]

OPTIONAL_FIELDS = ["email", "medicalHistory", "allergies", "currentMedications"]


def check_if_all_fields_collected(form_data):
    """Check if all required fields are collected"""
    if not form_data:
        return False
    
    for field in REQUIRED_FIELDS:
        if field not in form_data:
            return False
        # Optional fields can be empty string
        if field in OPTIONAL_FIELDS:
            continue
        # Required fields must have values
        if not form_data[field] or form_data[field] == "":
            return False
    
    return True


def get_conversation_prompt(conversation):
    """Generate system prompt with current progress"""
    
    return f"""You are a friendly medical receptionist helping a patient register at MediCare Clinic.

REQUIRED INFORMATION TO COLLECT (13 items):
1. Full name (REQUIRED)
2. Age (REQUIRED)
3. Gender - Male/Female/Other (REQUIRED)
4. Phone number (REQUIRED)
5. Email address (OPTIONAL - can skip)
6. Complete residential address (REQUIRED)
7. Chief complaint - reason for visit (REQUIRED)
8. Past medical history (OPTIONAL - say none if none)
9. Allergies (OPTIONAL - say none if none)
10. Current medications (OPTIONAL - say none if none)
11. Emergency contact person's name (REQUIRED)
12. Emergency contact relationship (REQUIRED)
13. Emergency contact phone number (REQUIRED)

CONVERSATION SO FAR:
{format_conversation_for_context(conversation)}

YOUR TASK:
- Review the conversation carefully and identify what information has ALREADY been collected
- Ask for the NEXT MISSING piece of information
- DO NOT repeat questions for information already provided
- If patient changes previous info, acknowledge: "I'll update that" and move to next missing item
- Keep responses SHORT (1-2 sentences max)
- For optional fields (email, medical history, allergies, medications), if they say "none"/"no"/"skip", accept it and move on
- Continue until ALL 13 items are discussed
- When ALL items are collected, say: "Perfect! I have all your information. Let me prepare it for review."

Generate your next question:"""


def format_conversation_for_context(conversation):
    """Format conversation for AI to review"""
    formatted = []
    for i, msg in enumerate(conversation, 1):
        role = "AI" if msg['role'] == 'assistant' else "PATIENT"
        formatted.append(f"{i}. {role}: {msg['content']}")
    return "\n".join(formatted)


def extract_all_data_from_full_conversation(conversation):
    """Extract all form data from the complete conversation"""
    
    conversation_text = "\n\n".join([
        f"{'PATIENT' if msg['role'] == 'user' else 'RECEPTIONIST'}: {msg['content']}" 
        for msg in conversation
    ])
    
    extraction_prompt = f"""Extract ALL registration information from this conversation between a medical receptionist and a patient.

FULL CONVERSATION:
{conversation_text}

Return a JSON object with these EXACT keys:

{{
  "fullName": "Patient's full name",
  "age": "Age as number only (e.g., 21)",
  "gender": "Male, Female, or Other",
  "contactNumber": "Phone number",
  "email": "Email address or empty string if skipped",
  "address": "Complete residential address",
  "chiefComplaint": "Reason for visit",
  "medicalHistory": "Past medical conditions or empty string if none",
  "allergies": "Allergies or empty string if none",
  "currentMedications": "Current medications or empty string if none",
  "emergencyContactName": "Emergency contact person's name",
  "emergencyContactRelationship": "Relationship to patient",
  "emergencyContactPhone": "Emergency contact phone number"
}}

EXTRACTION RULES:
1. If patient CHANGED any value (e.g., phone number), use the MOST RECENT value
2. For optional fields (email, medicalHistory, allergies, currentMedications):
   - Use empty string "" if patient said "none", "no", "nothing", "skip", "don't have"
   - Use empty string "" if not mentioned
3. For age: extract only the number
4. For gender: standardize to "Male", "Female", or "Other"
5. Extract ALL information even if briefly mentioned
6. ALL 13 fields MUST be in the JSON (use "" for missing values)

Return ONLY the JSON, no other text:"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": extraction_prompt}],
            temperature=0.05,
            max_tokens=700
        )
        
        json_text = response.choices[0].message.content.strip()
        json_text = json_text.replace('```json', '').replace('```', '').strip()
        
        start_idx = json_text.find('{')
        end_idx = json_text.rfind('}') + 1
        
        if start_idx != -1 and end_idx > start_idx:
            json_text = json_text[start_idx:end_idx]
        
        form_data = json.loads(json_text)
        
        # Ensure all keys exist
        for key in REQUIRED_FIELDS:
            if key not in form_data:
                form_data[key] = ""
        
        print(f"✓ Extracted data: {json.dumps(form_data, indent=2)}")
        return form_data
        
    except Exception as e:
        print(f"✗ Extraction error: {e}")
        if 'json_text' in locals():
            print(f"Raw response: {json_text}")
        return None


@app.route('/api/start-session', methods=['POST'])
def start_session():
    """Initialize a new registration session"""
    
    session_id = str(uuid.uuid4())
    
    sessions[session_id] = {
        "conversation": [],
        "questions_asked": 0
    }
    
    greeting = "Hello! Welcome to MediCare Clinic. I'm here to help you complete your registration. Let's start - what's your full name?"
    
    sessions[session_id]["conversation"].append({
        "role": "assistant",
        "content": greeting
    })
    
    print(f"\n{'='*60}")
    print(f"✓ NEW SESSION: {session_id[:8]}...")
    print(f"{'='*60}")
    
    return jsonify({
        "session_id": session_id,
        "message": greeting
    })


@app.route('/api/process-speech', methods=['POST'])
def process_speech():
    """Process user speech and continue conversation"""
    
    data = request.json
    user_input = data.get('user_input', '').strip()
    session_id = data.get('session_id', None)
    
    if not session_id or session_id not in sessions:
        return jsonify({
            "error": "Invalid session",
            "restart": True
        }), 400
    
    session = sessions[session_id]
    
    # Add user message
    session["conversation"].append({
        "role": "user",
        "content": user_input
    })
    
    session["questions_asked"] += 1
    
    print(f"\n[Q{session['questions_asked']}] Patient: {user_input}")
    
    # Try extraction after every response (starting from question 10)
    # This way we check if all fields are collected
    if session["questions_asked"] >= 10:
        print(f"\nChecking if all fields collected...")
        
        # Try to extract data
        form_data = extract_all_data_from_full_conversation(session["conversation"])
        
        if form_data and check_if_all_fields_collected(form_data):
            # All fields successfully collected!
            completion_message = "Perfect! I've collected all your information. Please review it on the screen and make any edits if needed."
            
            session["conversation"].append({
                "role": "assistant",
                "content": completion_message
            })
            
            del sessions[session_id]
            
            print(f"\n{'='*60}")
            print("✓ ALL FIELDS COLLECTED - REGISTRATION COMPLETE!")
            print(f"{'='*60}\n")
            
            return jsonify({
                "message": completion_message,
                "completed": True,
                "form_data": form_data
            })
        else:
            if form_data:
                # Show which fields are still missing
                missing = [f for f in REQUIRED_FIELDS 
                          if f not in OPTIONAL_FIELDS and (f not in form_data or not form_data[f])]
                if missing:
                    print(f"→ Still missing: {', '.join(missing)}")
            print("→ Continuing conversation to collect remaining fields...")
    
    # Continue conversation with full context
    system_prompt = get_conversation_prompt(session["conversation"])
    
    messages = [{"role": "system", "content": system_prompt}]
    messages.append({"role": "user", "content": user_input})
    
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.6,
            max_tokens=120
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        session["conversation"].append({
            "role": "assistant",
            "content": ai_response
        })
        
        print(f"[A{session['questions_asked']}] AI: {ai_response}")
        
        return jsonify({
            "message": ai_response,
            "completed": False,
            "session_id": session_id
        })
        
    except Exception as e:
        print(f"✗ Groq API error: {e}")
        return jsonify({
            "error": "Failed to process request",
            "message": "I apologize, I'm having trouble. Could you please repeat that?"
        }), 500


@app.route('/api/reset-session', methods=['POST'])
def reset_session():
    """Reset/delete a session"""
    data = request.json
    session_id = data.get('session_id', None)
    
    if session_id and session_id in sessions:
        del sessions[session_id]
        print(f"✓ Session {session_id[:8]} deleted")
    
    return jsonify({"message": "Session reset successfully"})


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "Flask server is running",
        "active_sessions": len(sessions)
    })


if __name__ == '__main__':
    print("\n" + "="*60)
    print("🏥 MediCare Voice Registration Server")
    print("="*60)
    print(f"✓ Server: http://localhost:5000")
    print(f"✓ Groq Model: llama-3.3-70b-versatile")
    print(f"✓ API Key: {'Configured' if GROQ_API_KEY else 'MISSING'}")
    print("="*60 + "\n")
    app.run(debug=True, port=5000, host='0.0.0.0')