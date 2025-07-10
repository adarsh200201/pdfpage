export const sampleHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample HTML Document</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        
        h1 {
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        
        h2 {
            color: #e74c3c;
            margin-top: 30px;
            font-size: 1.8em;
        }
        
        .highlight {
            background: #f39c12;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .feature-item {
            background: #ecf0f1;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #3498db;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 30px 0;
            text-align: center;
        }
        
        .stat {
            flex: 1;
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #e74c3c;
        }
        
        .footer {
            margin-top: 40px;
            text-align: center;
            padding: 20px;
            background: #34495e;
            color: white;
            border-radius: 5px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        
        th {
            background: #3498db;
            color: white;
        }
        
        tr:nth-child(even) {
            background: #f9f9f9;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 HTML to PDF Conversion Demo</h1>
        
        <div class="highlight">
            <strong>✨ This is a sample HTML document</strong> demonstrating how our HTML to PDF converter works with complex layouts, styles, and content.
        </div>
        
        <h2>🌟 Key Features</h2>
        <div class="feature-list">
            <div class="feature-item">
                <h3>📱 Responsive Design</h3>
                <p>Works with responsive layouts and mobile-friendly designs</p>
            </div>
            <div class="feature-item">
                <h3>🎨 CSS Styling</h3>
                <p>Preserves all CSS styles, gradients, and animations</p>
            </div>
            <div class="feature-item">
                <h3>⚡ Fast Processing</h3>
                <p>Quick conversion powered by Chromium engine</p>
            </div>
            <div class="feature-item">
                <h3>🔧 Customizable</h3>
                <p>Multiple format options and settings available</p>
            </div>
        </div>
        
        <h2>📊 Conversion Statistics</h2>
        <div class="stats">
            <div class="stat">
                <div class="stat-number">99.9%</div>
                <div>Accuracy</div>
            </div>
            <div class="stat">
                <div class="stat-number">< 3s</div>
                <div>Processing Time</div>
            </div>
            <div class="stat">
                <div class="stat-number">100+</div>
                <div>Formats Supported</div>
            </div>
        </div>
        
        <h2>📋 Supported Features</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Supported</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>CSS Layouts</td>
                    <td>✅ Yes</td>
                    <td>Flexbox, Grid, Floats</td>
                </tr>
                <tr>
                    <td>Background Images</td>
                    <td>✅ Yes</td>
                    <td>Configurable option</td>
                </tr>
                <tr>
                    <td>Web Fonts</td>
                    <td>✅ Yes</td>
                    <td>Google Fonts, Custom Fonts</td>
                </tr>
                <tr>
                    <td>JavaScript</td>
                    <td>⚠️ Limited</td>
                    <td>Static rendering only</td>
                </tr>
                <tr>
                    <td>Vector Graphics</td>
                    <td>✅ Yes</td>
                    <td>SVG, CSS shapes</td>
                </tr>
            </tbody>
        </table>
        
        <h2>🛠️ How It Works</h2>
        <ol>
            <li><strong>HTML Input:</strong> Upload your HTML file, paste content, or provide a URL</li>
            <li><strong>Processing:</strong> Our Chromium-based engine renders your content</li>
            <li><strong>PDF Generation:</strong> The rendered page is converted to PDF format</li>
            <li><strong>Download:</strong> Your professional PDF is ready for download</li>
        </ol>
        
        <div class="highlight">
            <strong>💡 Pro Tip:</strong> For best results, use modern CSS and avoid complex JavaScript animations. Our converter works best with static content and CSS animations.
        </div>
        
        <div class="footer">
            <h3>🎯 Ready to Convert?</h3>
            <p>Experience the power of our HTML to PDF converter today!</p>
            <p><strong>PdfPage</strong> - Your Ultimate PDF Toolkit</p>
        </div>
    </div>
</body>
</html>`;

export const sampleUrls = [
  {
    name: "Example.com",
    url: "https://example.com",
    description: "Simple demonstration page",
  },
  {
    name: "GitHub",
    url: "https://github.com",
    description: "Popular development platform",
  },
  {
    name: "Stack Overflow",
    url: "https://stackoverflow.com",
    description: "Developer Q&A community",
  },
  {
    name: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    description: "Web development documentation",
  },
];
