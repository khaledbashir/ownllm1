# Demo Project Discovery Questions

Copy these questions into your RAG notebook and answer them based on the demo project (/root/natalia or /root/natalie):

## 1. THE CHAT INTERFACE

**Q1.1:** When a user starts a conversation in the demo, what does the chat UI look like?
- Is it a standard chat window?
- Does the AI respond in chat with text?
- Are there buttons IN the chat messages, or BELOW the chat?

**Q1.2:** After the AI generates the proposal preview (with all the specs and cost breakdown), where exactly does the [Generate Excel Audit] button appear?
- In the same chat message?
- Below the chat?
- In a sidebar?
- Somewhere else?

## 2. THE EXCEL GENERATION FLOW

**Q2.1:** When the user clicks the [Generate Excel Audit] button, what happens?
- Does Excel download immediately?
- Does a modal/popup appear?
- Does the button turn into "Generating..."?
- How does the user know it's done?

**Q2.2:** After the Excel downloads, what does the AI say next?
- Does it automatically tell them "Now paste the proposal text into BlockSuite"?
- Does it wait for them to ask?
- Is there a next button/action?

## 3. THE BLOCKSUITE INSERTION

**Q3.1:** How does the proposal preview text get into BlockSuite?
- Does the user manually copy/paste it?
- Is there an "Insert to BlockSuite" button that does it automatically?
- Does the system do it automatically?

**Q3.2:** When the proposal text is in BlockSuite, can it be edited?
- Is it locked/read-only?
- Can Natalia modify the costs before downloading PDF?
- Or is it just for reference?

## 4. THE PDF DOWNLOAD

**Q4.1:** Where is the PDF download button/action?
- IN the BlockSuite editor (as a button when text is selected)?
- Outside BlockSuite (in a separate panel)?
- In the chat interface?
- Somewhere else?

**Q4.2:** When they click the PDF download, what happens?
- PDF downloads immediately?
- Does it use the branding template?
- Is it formatted as a client-facing proposal (simplified)?

## 5. THE COMPLETE WORKFLOW (STEP BY STEP)

**Q5.1:** Give me the EXACT sequence from start to finish:
```
Step 1: User types in chat: [WHAT DO THEY TYPE?]
Step 2: AI responds: [WHAT DOES AI SAY?]
Step 3: User sees: [WHAT'S VISIBLE?]
Step 4: User clicks: [WHAT BUTTON/ACTION?]
Step 5: System does: [WHAT HAPPENS?]
Step 6: User sees: [WHAT'S VISIBLE?]
Step 7: User clicks: [WHAT BUTTON/ACTION?]
Step 8: System does: [WHAT HAPPENS?]
Step 9: User clicks: [WHAT BUTTON/ACTION?]
Step 10: Final result: [WHAT DO THEY GET?]
```

## 6. THE DATA FLOW

**Q6.1:** Where does the chat AI get the pricing data?
- From AncPricingEngine.js?
- From a database?
- From the proposal endpoint?
- Directly hardcoded?

**Q6.2:** When Excel is generated, does it:
- Call a backend endpoint?
- Run JavaScript in the browser?
- Use an agent skill?
- Something else?

**Q6.3:** When PDF is generated, does it:
- Happen immediately?
- Render HTML to PDF?
- Use a headless browser?
- Call a service?

## 7. THE UI BUTTONS

**Q7.1:** List all the buttons/clickable elements the user sees in order:
```
Button 1: [NAME] - Located in [LOCATION] - Does [ACTION]
Button 2: [NAME] - Located in [LOCATION] - Does [ACTION]
Button 3: [NAME] - Located in [LOCATION] - Does [ACTION]
...
```

## 8. THE FILES/OUTPUTS

**Q8.1:** What files/outputs are created during the workflow?
- Excel file name format: [EXAMPLE]
- PDF file name format: [EXAMPLE]
- Where are they saved/downloaded from?

## 9. THE AGENT/AI CONFIGURATION

**Q9.1:** What system prompt or instructions does the demo AI agent use?
- Is it the batched question approach?
- Is it one question at a time?
- How is it configured?

**Q9.2:** Does the demo use @agent command or just regular chat?
- How does user trigger the AI?
- Can they chat with regular AI too?

## 10. BLOCKSUITE DETAILS

**Q10.1:** In BlockSuite editor, when proposal text is inserted:
- Is it a special block type?
- Is it plain markdown?
- Can it be converted to PDF from BlockSuite itself?
- How is the PDF download triggered?

**Q10.2:** What's the exact menu/button path to download PDF from BlockSuite?
- Is there a BlockSuite extension?
- A plugin?
- A button in the toolbar?

---

**ANSWER INSTRUCTIONS:**
1. Copy each question number above
2. Go to your demo project and find the answer
3. Paste your answer after the question
4. Send me ALL the answers back

Example response format:
```
Q1.1: The chat is a standard Slack-like interface. Buttons appear IN the chat messages themselves.
Q1.2: The [Generate Excel] button appears below the proposal preview text, in the same chat message.
Q2.1: When clicked, Excel downloads immediately with a toast notification saying "Audit Excel ready!"
...
```
