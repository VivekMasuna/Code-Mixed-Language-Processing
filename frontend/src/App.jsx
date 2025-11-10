import React, { useMemo, useState } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exampleSet, setExampleSet] = useState('all'); // 'hinglish' | 'marathlish' | 'all'

  const processText = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }
      
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setText('');
    setResult(null);
    setError('');
  };

  const hinglishExamples = [
    "Mera friend aaj party de raha hai",
    "Yeh movie bahut amazing thi!",
    "Tum kahan ho? I am waiting for you",
    "Aaj weather bahut beautiful hai",
    "Mera naam John hai aur main engineer hun",
    "Why are you late? Mujhe wait kar raha tha",
    "Woh restaurant mein delicious khana milta hai"
  ];

  const marathlishExamples = [
    "Aaj office la meeting aahe, please time var ya",
    "Kal function la food khup tasty hota, great service",
    "Tu kuthe ahes? I am waiting outside",
    "Apan plan udya karu, meeting schedule tight aahe",
    "Mala coffee pahije, strong one please",
  ];

  const examples = useMemo(() => {
    if (exampleSet === 'hinglish') return hinglishExamples;
    if (exampleSet === 'marathlish') return marathlishExamples;
    return [...hinglishExamples.slice(0, 3), ...marathlishExamples.slice(0, 3)];
  }, [exampleSet]);

  const loadExample = (exampleText) => {
    setText(exampleText);
    setResult(null);
    setError('');
  };

  return (
    <div className="App">
      <div className="container" role="region" aria-label="Code-Mixed Language Processor">
        <header className="header">
          <h1>Code-Mixed Language Studio</h1>
          <p>Smart detection and conversion for Hinglish and Marathlish</p>
        </header>

        <main>
        <div className="examples-section" aria-labelledby="examples-heading">
          <div className="examples-top">
            <h3 id="examples-heading">Try these examples</h3>
            <div className="segmented">
              <button
                className={`seg-btn ${exampleSet === 'all' ? 'active' : ''}`}
                onClick={() => setExampleSet('all')}
                aria-pressed={exampleSet === 'all'}
              >
                All
              </button>
              <button
                className={`seg-btn ${exampleSet === 'hinglish' ? 'active' : ''}`}
                onClick={() => setExampleSet('hinglish')}
                aria-pressed={exampleSet === 'hinglish'}
              >
                Hinglish
              </button>
              <button
                className={`seg-btn ${exampleSet === 'marathlish' ? 'active' : ''}`}
                onClick={() => setExampleSet('marathlish')}
                aria-pressed={exampleSet === 'marathlish'}
              >
                Marathlish
              </button>
            </div>
          </div>
          <div className="examples-grid">
            {examples.map((example, index) => (
              <button
                key={index}
                className="example-btn"
                onClick={() => loadExample(example)}
                aria-label={`Use example ${index + 1}`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="input-section">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter Hinglish or Marathlish (e.g., 'Aaj office la meeting aahe')"
            rows="4"
            className="text-input"
            aria-label="Input text"
          />
          
          <div className="button-group">
            <button 
              onClick={processText} 
              disabled={loading || !text.trim()}
              className="process-btn"
              aria-busy={loading}
            >
              {loading ? '🔄 Processing...' : '🚀 Process Text'}
            </button>
            <button onClick={clearAll} className="clear-btn">
              ❌ Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {result && (
          <div className="result-section">
            <div className="result-card">
              <h3>📊 Advanced Analysis Results</h3>
              
              <div className="result-grid">
                <div className="result-item">
                  <label>Main Language Detected:</label>
                  <span className={`language-badge ${result.main_language.toLowerCase()}`}>
                    {result.main_language}
                  </span>
                </div>
                
                <div className="result-item">
                  <label>Total Words Analyzed:</label>
                  <span className="word-count">{result.word_count}</span>
                </div>
              </div>

              <div className="language-stats">
                <h4>🔍 Language Distribution:</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="lang-name hindi">Hindi Words:</span>
                    <span className="lang-count">{result.language_stats.hindi} words</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill hindi"
                        style={{
                          width: `${(result.language_stats.hindi / result.word_count) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="lang-name marathi">Marathi Words:</span>
                    <span className="lang-count">{result.language_stats.marathi} words</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill marathi"
                        style={{
                          width: `${(result.language_stats.marathi / result.word_count) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="stat-item">
                    <span className="lang-name english">English Words:</span>
                    <span className="lang-count">{result.language_stats.english} words</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill english"
                        style={{
                          width: `${(result.language_stats.english / result.word_count) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {result.hindi_words && result.hindi_words.length > 0 && (
                <div className="word-lists">
                  <div className="word-list">
                    <h4>🇮🇳 Hindi Words Found:</h4>
                    <div className="word-tags">
                      {result.hindi_words.map((word, index) => (
                        <span key={index} className="word-tag hindi-tag">{word}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result.marathi_words && result.marathi_words.length > 0 && (
                <div className="word-lists">
                  <div className="word-list">
                    <h4>🟧 Marathi Words Found:</h4>
                    <div className="word-tags">
                      {result.marathi_words.map((word, index) => (
                        <span key={index} className="word-tag marathi-tag">{word}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result.english_words && result.english_words.length > 0 && (
                <div className="word-lists">
                  <div className="word-list">
                    <h4>🇺🇸 English Words Found:</h4>
                    <div className="word-tags">
                      {result.english_words.map((word, index) => (
                        <span key={index} className="word-tag english-tag">{word}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="conversion-result">
                <div className="original-text">
                  <h4>📝 Original Text:</h4>
                  <div className="text-box">
                    "{result.original_text}"
                  </div>
                </div>
                
                <div className="converted-text">
                  <h4>🔄 Converted Text ({result.main_language}):</h4>
                  <div className="text-box converted">
                    "{result.converted_text}"
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </main>

        <footer className="footer" role="contentinfo">
          <small>
            Built with ❤ for code-mixed text • Hinglish + Marathlish • Auto light/dark
          </small>
        </footer>
      </div>
    </div>
  );
}

export default App;