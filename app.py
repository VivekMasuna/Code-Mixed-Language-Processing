from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
import os
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY is not set. Please create a .env file with GEMINI_API_KEY=<your_key> or set it in the environment.")
client = genai.Client(api_key=GEMINI_API_KEY)

def process_with_gemini(text):
    """Single Gemini call to handle Hinglish and Marathlish"""
    
    prompt = f"""
    You are a code-mixed language expert. Process code-mixed text for both Hinglish (Hindi+English) and Marathlish (Marathi+English):

    "{text}"

    Follow these steps:

    1. **Language Detection**: Determine the main language (Hindi, Marathi, or English) based on which language has more words and provides the sentence structure.

    2. **Word Analysis**: Identify individual Hindi, Marathi, and English words in the text.

    3. **Translation**: Convert the entire text to the main language while:
       - Keeping the sentence structure natural and grammatical
       - Only translating words from the non-main languages
       - Preserving the original meaning and context

    4. **Return JSON** with this exact structure:
    {{
        "main_language": "Hindi" or "Marathi" or "English",
        "hindi_words": ["list", "of", "hindi", "words"],
        "marathi_words": ["list", "of", "marathi", "words"],
        "english_words": ["list", "of", "english", "words"], 
        "converted_text": "the fully converted meaningful sentence",
        "word_count": total_word_count,
        "hindi_count": number_of_hindi_words,
        "marathi_count": number_of_marathi_words,
        "english_count": number_of_english_words
    }}

    Examples:
    
    Input: "Mera friend aaj party de raha hai"
    Output: {{
        "main_language": "Hindi",
        "hindi_words": ["mera", "aaj", "de", "raha", "hai"],
        "english_words": ["friend", "party"],
        "marathi_words": [],
        "converted_text": "Mera dost aaj party de raha hai",
        "word_count": 7,
        "hindi_count": 5,
        "marathi_count": 0,
        "english_count": 2
    }}

    Input: "Tum kahan ho? I am waiting for you"
    Output: {{
        "main_language": "English", 
        "hindi_words": ["tum", "kahan", "ho"],
        "english_words": ["i", "am", "waiting", "for", "you"],
        "marathi_words": [],
        "converted_text": "Where are you? I am waiting for you",
        "word_count": 8,
        "hindi_count": 3,
        "marathi_count": 0,
        "english_count": 5
    }}

    Input: "Aaj office la meeting aahe, please time var ya"
    Output: {{
        "main_language": "Marathi",
        "hindi_words": [],
        "marathi_words": ["aaj", "la", "aahe", "var", "ya"],
        "english_words": ["office", "meeting", "please", "time"],
        "converted_text": "Aaj office la meeting aahe, krupaya time var ya",
        "word_count": 9,
        "hindi_count": 0,
        "marathi_count": 5,
        "english_count": 4
    }}

    Input: "Kal function la food khup tasty hota, great service"
    Output: {{
        "main_language": "Marathi",
        "hindi_words": [],
        "marathi_words": ["kal", "la", "khup", "hota"],
        "english_words": ["function", "food", "tasty", "great", "service"],
        "converted_text": "Kal function la jevan khup chaan hota, uttam sewa",
        "word_count": 9,
        "hindi_count": 0,
        "marathi_count": 4,
        "english_count": 5
    }}

    Now process this text and return ONLY valid JSON:
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt + text
        )
        
        # Extract JSON from response
        import json
        result_text = response.text.strip()
        
        # Remove any markdown code blocks
        result_text = result_text.replace('```json', '').replace('```', '').strip()
        
        # Parse JSON
        result = json.loads(result_text)
        return result
        
    except Exception as e:
        print(f"Gemini processing error: {e}")
        return None

@app.route('/')
def index():
    return jsonify({
        "message": "Simplified Gemini Code-Mixed Language Processor",
        "status": "running", 
        "version": "1.0"
    })

@app.route('/api/process', methods=['POST'])
def process_text():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
            
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        if len(text) > 500:
            return jsonify({'error': 'Text too long. Maximum 500 characters allowed.'}), 400
        
        result = process_with_gemini(text)
        
        if result:
            return jsonify({
                'original_text': text,
                'converted_text': result.get('converted_text', text),
                'main_language': result.get('main_language', 'Unknown'),
                'language_stats': {
                    'hindi': result.get('hindi_count', 0),
                    'marathi': result.get('marathi_count', 0),
                    'english': result.get('english_count', 0)
                },
                'word_count': result.get('word_count', 0),
                'hindi_words': result.get('hindi_words', []),
                'marathi_words': result.get('marathi_words', []),
                'english_words': result.get('english_words', [])
            })
        else:
            return jsonify({'error': 'Failed to process text with AI'}), 500
    
    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test the API with example cases"""
    test_cases = [
        "Mera friend aaj party de raha hai",
        "Yeh movie bahut amazing thi!",
        "Tum kahan ho? I am waiting for you", 
        "Aaj weather bahut beautiful hai",
        "Mera naam John hai aur main engineer hun",
        "Why are you late? Mujhe wait kar raha tha",
        "Woh restaurant mein delicious khana milta hai",
        "Aaj office la meeting aahe, please time var ya",
        "Kal function la food khup tasty hota, great service"
    ]
    
    results = []
    for test in test_cases:
        result = process_with_gemini(test)
        if result:
            results.append({
                'input': test,
                'output': result.get('converted_text'),
                'main_language': result.get('main_language')
            })
    
    return jsonify({'test_results': results})

if __name__ == '__main__':
    print("Starting Simplified Gemini Code-Mixed Processor...")
    app.run(debug=True, port=5000)