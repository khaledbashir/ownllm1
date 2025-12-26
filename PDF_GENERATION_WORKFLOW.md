# 🚀 Beautiful PDF Generation Workflow with MCP Servers

This guide shows you how to generate beautiful PDFs using the enabled MCP servers.

## Enabled Servers

✅ **playwright-mcp-server** - Browser automation & PDF generation  
✅ **markdownify** - Convert documents to/from Markdown  
✅ **n8n** - Workflow automation (543 nodes)  
✅ **vizro** - Charts & dashboards  

---

## 📋 Quick Start

### 1. Run the MCP Gateway
```bash
docker mcp gateway run
```

### 2. Connect Your Client
```bash
# For Claude Code
docker mcp client connect claude-code

# For Cursor
docker mcp client connect cursor
```

### 3. Use the Tools

Your AI assistant can now access all enabled servers' tools!

---

## 🎨 PDF Generation Workflow

### Method 1: HTML → PDF (Recommended for Beautiful PDFs)

**Best for:** Custom layouts, branding, precise styling

#### Step 1: Create Styled HTML
Create an HTML file with your preferred CSS framework:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Beautiful Document</title>
    <!-- Use Tailwind CDN for easy styling -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @page {
            size: A4;
            margin: 2cm;
        }
        body {
            font-family: 'Inter', system-ui, sans-serif;
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
        <!-- Your content here -->
    </div>
</body>
</html>
```

#### Step 2: Convert to PDF
Ask your AI to use:
```
playwright_navigate("file:///path/to/your/document.html")
playwright_save_as_pdf({
    outputPath: "/path/to/output/",
    filename: "beautiful-document.pdf",
    format: "A4",
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
    printBackground: true
})
```

---

### Method 2: Document → Markdown → PDF

**Best for:** Converting existing documents

#### Step 1: Convert to Markdown
Use **markdownify** to convert any document:
```
pdf-to-markdown("/path/to/input.pdf")      # PDF → Markdown
docx-to-markdown("/path/to/input.docx")    # DOCX → Markdown
pptx-to-markdown("/path/to/input.pptx")    # PPTX → Markdown
xlsx-to-markdown("/path/to/input.xlsx")    # XLSX → Markdown
webpage-to-markdown("https://example.com") # URL → Markdown
```

#### Step 2: Convert Markdown to PDF
Use **playwright-mcp-server** with a markdown-to-HTML converter, or create a styled HTML template and render.

---

### Method 3: Data → Chart/Report → PDF

**Best for:** Reports, dashboards, analytics

#### Step 1: Create Charts with Vizro
Use **vizro** server to generate interactive charts:
```
# Vizro tools for creating charts and dashboards
# Can export as images for PDF inclusion
```

#### Step 2: Generate PDF Report
Combine charts with text content in HTML, then convert to PDF.

---

## 🎯 PDF Generation Examples

### Example 1: Invoice PDF
```html
<!DOCTYPE html>
<html>
<head>
    <title>Invoice #001</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @page { margin: 1cm; }
    </style>
</head>
<body class="p-8 max-w-3xl mx-auto bg-white">
    <div class="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 class="text-3xl font-bold">Invoice #001</h1>
        <p class="text-gray-600">December 26, 2025</p>
    </div>
    
    <table class="w-full border-collapse border border-gray-300 mb-6">
        <thead class="bg-gray-100">
            <tr>
                <th class="border border-gray-300 p-2 text-left">Item</th>
                <th class="border border-gray-300 p-2 text-left">Qty</th>
                <th class="border border-gray-300 p-2 text-right">Price</th>
                <th class="border border-gray-300 p-2 text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="border border-gray-300 p-2">Web Development</td>
                <td class="border border-gray-300 p-2">1</td>
                <td class="border border-gray-300 p-2 text-right">$1,000</td>
                <td class="border border-gray-300 p-2 text-right">$1,000</td>
            </tr>
        </tbody>
    </table>
    
    <div class="text-right text-2xl font-bold mt-6">
        Total: $1,000
    </div>
</body>
</html>
```

Then convert:
```
playwright_navigate("file:///path/to/invoice.html")
playwright_save_as_pdf({
    outputPath: "./output/",
    filename: "invoice-001.pdf",
    format: "A4",
    printBackground: true
})
```

### Example 2: Resume/CV PDF
```html
<!DOCTYPE html>
<html>
<head>
    <title>John Doe - Resume</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @page { margin: 0.8cm; }
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="p-6 max-w-4xl mx-auto bg-white">
    <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900">John Doe</h1>
        <p class="text-lg text-gray-600">Senior Software Engineer</p>
        <p class="text-gray-500">john@example.com | +1 234 567 890</p>
    </div>
    
    <div class="mb-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Experience</h2>
        <div class="mb-4">
            <h3 class="font-semibold text-gray-700">Senior Developer at Tech Corp</h3>
            <p class="text-gray-600">2020 - Present</p>
            <p class="text-gray-600 mt-2">Led development of scalable web applications...</p>
        </div>
    </div>
    
    <div>
        <h2 class="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Skills</h2>
        <div class="flex flex-wrap gap-2">
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">JavaScript</span>
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Python</span>
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Docker</span>
        </div>
    </div>
</body>
</html>
```

---

## 🔧 Advanced PDF Features

### Page Formats
```
format: "A4"        // 210 × 297 mm
format: "Letter"     // 8.5 × 11 in
format: "Legal"      // 8.5 × 14 in
format: "Tabloid"     // 11 × 17 in
```

### Custom Margins
```
margin: {
    top: "20px",
    bottom: "20px", 
    left: "20px",
    right: "20px"
}
```

### Headers and Footers
Add to your HTML:
```html
<div style="position: fixed; top: 10px; left: 10px;">
    <small>Confidential Document</small>
</div>

<div style="position: fixed; bottom: 10px; width: 100%; text-align: center;">
    <small>Page <span class="page-number"></span></small>
</div>
```

---

## 🚀 Automation with n8n

### Sample n8n Workflow

1. **Webhook Trigger** - Receive PDF generation request
2. **AI Agent Node** - Generate HTML content
3. **HTTP Request** - Send to Playwright MCP
4. **File Output** - Save PDF result

### Example n8n Workflow JSON
```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "generate-pdf" }
    },
    {
      "name": "AI Content",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { 
        "method": "POST",
        "url": "your-ai-api/endpoint"
      }
    },
    {
      "name": "Save PDF",
      "type": "n8n-nodes-base.writeFile",
      "parameters": {
        "fileName": "output.pdf"
      }
    }
  ]
}
```

---

## 📊 Using Vizro for Data Visualization

### Create Charts for Reports
```python
# Through Vizro MCP server
import vizro

chart = vizro.Chart(
    data=sales_data,
    mark="bar",
    x="month",
    y="revenue"
)
```

### Export Chart as Image
```javascript
// Use Playwright to capture chart
playwright_navigate("http://your-chart-url")
playwright_screenshot({
    name: "sales-chart",
    fullPage: true
})
```

---

## 🎨 Pro Tips for Beautiful PDFs

### 1. Use a CSS Framework
- **Tailwind CSS** - Utility-first styling
- **Bootstrap** - Component library
- **Bulma** - Modern, clean

### 2. Typography Matters
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
    body { font-family: 'Inter', sans-serif; }
    h1 { font-weight: 700; letter-spacing: -0.025em; }
</style>
```

### 3. Consistent Colors
Define a color palette:
```css
:root {
    --primary: #1f2937;
    --secondary: #6b7280;
    --accent: #3b82f6;
}
```

### 4. Print-Friendly Styles
```css
@media print {
    .no-print { display: none; }
    .page-break { page-break-before: always; }
}
```

---

## 🛠️ Troubleshooting

### Issue: PDF looks different than HTML
**Solution:** Use `waitUntil: "networkidle0"` in `playwright_navigate`

### Issue: Margins are wrong
**Solution:** Adjust margin object in `playwright_save_as_pdf`

### Issue: Fonts not loading
**Solution:** Use Google Fonts CDN or embed base64 fonts

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/api/class-playwright)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [MCP Gateway Docs](https://www.docker.com/blog/the-model-context-protocol)

---

*Generated with MCP Gateway - Playwright + Markdownify + n8n + Vizro*
