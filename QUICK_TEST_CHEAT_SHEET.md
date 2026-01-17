# 🚀 ANC CPQ v2.0 - QUICK TEST GUIDE

## ⚡ 1-MINUTE "MEGA PROMPT" TEST

Use this prompt to instantly verify the **Waterfall Pricing Logic** and **21-Field Schema**.

### 📋 COPY & PASTE THIS INTO CHAT:

```text
I need a formal proposal for a new stadium project.
Details:
- Product: Outdoor Scoreboard
- Size: 40ft wide x 20ft high
- Tech: 10mm Pixel Pitch, Rear Access
- Structure: Curved shape on New Steel structure
- Logistics: Union Labor required, Power is Far (over 100ft)
- Commercials: Bond Required, ANC handles Permits, Gold Service Level
- Financial: Target Margin 35%
```

### ✅ EXPECTED RESULT (In the Slider)

1. **Specs Tab:**
   - [x] Size: 40' x 20' (800 sq ft)
   - [x] Env: Outdoor
   - [x] Shape: Curved (+5% Structural Mod)

2. **Logistics Tab:** (New!)
   - [x] Structure: New (+Cost)
   - [x] Labor: Union (+15% Rate)
   - [x] Bond: Yes (+1.5% Cost)

3. **Pricing Tab:**
   - [x] Hardware: ~$1,280,000 (Based on $1600/sqft base)
   - [x] Labor: Higher due to Union rate
   - [x] Final Price: Should include the 35% margin calculation

---

## 🔍 UNIT TEST PROMPTS (Step-by-Step)

If you want to test the conversational collection flow:

**Step 1: The Hook**
> "I need a quote for a small indoor lobby screen."

**Step 2: Dimensions**
> "It is 12ft wide and 7ft high."

**Step 3: Tech Specs**
> "We want very high resolution, maybe 1.5mm pitch."

**Step 4: Logistics**
> "It's a wall mount on existing drywall. Non-union labor."

**Step 5: Commercials**
> "Standard service level, no bond needed."

Result: The quote slider should update progressively after each turn.
| 2 | 50' x 30' | 6mm | Outdoor | 30% | $20,865,638 |
| 3 | 100' x 3' | 10mm | Outdoor | 35% | $3,803,077 |

---

## 🔧 QUICK TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Server won't start | `lsof -i :3001` then `kill -9 <PID>` |
| Skills not visible | Restart server after enabling |
| Agent ignores tools | Try `@ANC_SYSTEM_INTERNAL_CALCULATOR` directly |
| 404 on download | Check file exists in `/app/server/storage/documents/` |
| Hallucinated links | This should be fixed - report if persists |

---

## 📝 COPY THESE TEST PROMPTS

### Test 1: Simple
```
Calculate a 24ft by 10ft indoor LED display with 1.5mm pixel pitch at 32% margin.
```

### Test 2: Complex
```
Calculate a 50ft by 30ft outdoor LED display with 6mm pixel pitch, new steel, rigging access, and rush timeline at 30% margin.
```

### Test 3: Ribbon Board
```
Calculate a 100ft by 3ft outdoor ribbon board with 10mm pixel pitch and curved access at 35% margin.
```

### Test 4: Audit Export
```
Generate internal audit Excel for this quote.
```

### Test 5: Direct Tool Call
```
@ANC_SYSTEM_INTERNAL_CALCULATOR
width: 24
height: 10
pixelPitch: 1.5mm
environment: indoor
margin: 0.32
```

---

## ✅ SUCCESS CHECKLIST

- [ ] Server starts without errors
- [ ] Login to AnythingLLM works
- [ ] ANC skills visible in Workspace Settings
- [ ] Calculation 1 produces $1,704,294
- [ ] Calculation 2 produces $20,865,638
- [ ] Calculation 3 produces $3,803,077
- [ ] Audit export generates download link
- [ ] Excel file downloads successfully
- [ ] 8 tabs exist in Excel
- [ ] Formula Reference tab complete

---

**Ready? Go! 🚀**

Copy the cheat sheet, open your browser, and start testing!
