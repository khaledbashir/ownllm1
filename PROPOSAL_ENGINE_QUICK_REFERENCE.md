# ⚡ ANC Proposal Engine - Quick Reference Card

## 🎯 The 4-Tab Workflow

| Tab | Purpose | Key Features | Auto-Calc |
|-----|---------|--------------|-----------|
| **PROJECT** | Client metadata | Name, address, date, estimator | None |
| **SPECS** | Display specs | Dimensions, pixel pitch, environment | Screen area = W × H |
| **COSTS** | Pricing breakdown | Margin slider, line items, profit | All costs & final price |
| **OUTPUT** | Download files | PDF button, Excel button, status | None |

---

## 🔥 Hot Keys & Quick Actions

| Action | Location | Result |
|--------|----------|--------|
| Type width/height | Specs tab | Screen area updates instantly |
| Drag margin slider | Costs tab | Final price updates in real-time |
| Select product | Specs tab | All costs recalculate instantly |
| Click Download PDF | Output tab | Professional PDF file downloads |
| Click Generate Excel | Output tab | Audit spreadsheet downloads |

---

## 💡 Three Ways to Trigger Calculations

### 1. Type in a Field ✅
```
Width input: 20 ft → Press Enter or Tab
→ All costs update instantly
→ No button needed
```

### 2. Drag a Slider ✅
```
Margin slider: 30% → 50%
→ Price updates while dragging
→ Release slider to confirm
```

### 3. Select from Dropdown ✅
```
Product Class: Scoreboard → Ribbon Board
→ All costs recalculate
→ New price shown instantly
```

---

## 🚫 What Does NOT Update Automatically

- **PDF/Excel files** - Require clicking "Download" or "Generate" button
- **Project metadata** - Doesn't affect calculations (name, date, etc.)
- **Other user's quotes** - Only your current quote updates

---

## ✅ Green Lights (Ready to Export)

```
✅ All required fields filled
✅ "Ready to Export" message shown
✅ Download buttons are ENABLED (colored)
✅ You can click to download PDF/Excel
```

## ❌ Red Lights (Cannot Export Yet)

```
❌ Missing client name or dimensions
❌ "Incomplete Quote" warning shown
❌ Download buttons are DISABLED (gray)
❌ You cannot click buttons
```

---

## 📊 Numbers Reference

| Field | Min | Max | Typical |
|-------|-----|-----|---------|
| Width | 1 ft | 500 ft | 20-40 ft |
| Height | 1 ft | 500 ft | 10-30 ft |
| Pixel Pitch | 1.5mm | 10mm | 4mm |
| Margin | 10% | 60% | 30% |

---

## 💾 File Names Generated

```
PDF:   ANC_Proposal_ClientName_1234567890.pdf
Excel: ANC_Audit_ClientName_1234567890.xlsx
```

---

## 🎨 Tab Colors & Icons

| Tab | Icon | Color | Click When |
|-----|------|-------|-----------|
| PROJECT | 📄 | Blue | Setting up new quote |
| SPECS | 📐 | Blue | Defining dimensions |
| COSTS | 📊 | Blue | Adjusting pricing |
| OUTPUT | ⬇️ | Blue | Ready to download |

---

## ⚙️ Settings That Affect Price

### High Impact (Changes Final Price Most)
1. **Margin %** (most direct impact)
2. **Width × Height** (screen area effect)
3. **Steel Type** (New vs Existing)

### Medium Impact (Noticeable Change)
1. **Pixel Pitch** (finer = more expensive)
2. **Labor Type** (Union = more expensive)
3. **Environment** (Outdoor = more expensive)

### Low Impact (Small Change)
1. **Service Access** (Rear = slightly more)
2. **Product Class** (varies)

---

## 🐛 If Something Goes Wrong

| Problem | Solution |
|---------|----------|
| Costs not updating | Refresh page, re-enter dimensions |
| PDF button disabled | Fill all Specs fields first |
| Excel button disabled | Fill all Specs fields first |
| Download didn't start | Check browser Downloads folder, try again |
| Numbers don't match | Close and reopen slider |

---

## 📱 Mobile vs Desktop

| Feature | Mobile | Desktop |
|---------|--------|---------|
| Slider width | Full screen | 450px (right side) |
| Tabs | Icons only | Icons + labels |
| Calculations | Same ✅ | Same ✅ |
| Downloads | Works ✅ | Works ✅ |

---

## 🔢 Price Components (What Goes Into Final Price)

```
HARDWARE (base cost per sq ft)
  + STRUCTURAL (% of hardware)
  + LABOR (% of hardware + structural)
  + EXPENSES (% of hardware, mainly shipping)
  + CONTINGENCY (if New Steel + Outdoor)
────────────────────────
= SUBTOTAL (Cost Basis)
  × (1 / (1 - Margin%))
────────────────────────
= FINAL PRICE (what customer pays)
```

**Example (24 ft × 10 ft, 32% margin, Indoor):**
```
Hardware:      $360,000
Structural:    $ 72,000  (20% of hardware)
Labor:         $ 36,000  (15% of HW+Struct)
Expenses:      $ 18,000  (5% of hardware)
─────────────────────
Subtotal:      $486,000
─────────────────────
Final Price @ 32% margin: $717,647
Gross Profit: $231,647
```

---

## 🎓 Five Key Concepts

1. **Live Calculation**
   - No delays between input and output
   - What you see is what you get

2. **Margin Control**
   - Higher margin = higher profit but maybe lose sale
   - Lower margin = win more sales but less profit
   - Slider lets you find the sweet spot

3. **Cost Transparency**
   - Excel export shows ALL calculations
   - Estimators can verify every number

4. **Professional Output**
   - PDF for clients (clean, branded)
   - Excel for estimators (detailed, formulas)

5. **Workflow Logic**
   - Project → Specs → Costs → Output
   - Each step builds on previous

---

## 🚀 Pro Tips

1. **Save Time:** Copy-paste client name from email
2. **Bulk Create:** Open 5 sliders at once, fill in background
3. **Quick Quotes:** Use same specs multiple times, adjust margin
4. **Version Control:** Download both PDF and Excel, keep for records
5. **Compare Quotes:** Download two proposals side-by-side in Excel

---

## ❓ FAQ

**Q: Can I edit downloaded PDF?**
A: Yes, with PDF editor software (Adobe, etc.)

**Q: Can I edit downloaded Excel?**
A: Yes, formulas are included so changes recalculate

**Q: How long does download take?**
A: Usually 5-15 seconds, depends on server load

**Q: Can I share the PDF with client?**
A: Yes! That's exactly what it's for

**Q: Can I share the Excel with client?**
A: Not recommended (shows our costs), use PDF instead

---

## 🔐 Data Security

- ✅ Numbers stay on server (not exposed in URL)
- ✅ Files saved to secure storage
- ✅ Auto-delete old files (see IT policy)
- ✅ No data transmitted in clear text

---

## 📞 Support

**For Issues:**
1. Refresh page (solves 80% of problems)
2. Check browser console (F12 → Console tab)
3. Try different browser
4. Contact IT support with screenshots

**For Feature Requests:**
1. Document what you want
2. Show example
3. Email to product team
4. Include: how often you'd use it, time saved

---

**Quick Reference Card v1.0**  
**Last Updated: January 21, 2026**  
**Print this page for quick reference!**
