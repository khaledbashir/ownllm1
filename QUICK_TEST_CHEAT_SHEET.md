# 🚀 ANC FORMULA BANK - QUICK TEST CHEAT SHEET

## ⚡ 5-MINUTE QUICK TEST

### 1️⃣ Start Server (if not running)
```bash
cd /root/everythingllm/ownllm1/server
yarn dev
```

### 2️⃣ Open Browser
```
http://localhost:3001
```

### 3️⃣ Login & Create Workspace
- Workspace Name: `ANC Test`
- Workspace Type: `Standard`

### 4️⃣ Enable ANC Skills
Go to: Workspace Settings → Agent Skills
- ✅ Turn ON `ANC_SYSTEM_INTERNAL_CALCULATOR`
- ✅ Turn ON `ANC_AUDIT_EXPORT`

### 5️⃣ Test Calculation (Copy & Paste)
```
Calculate a 24ft by 10ft indoor LED display with 1.5mm pixel pitch at 32% margin.
```

**Expected:** $1,704,294 sell price at 32% margin

### 6️⃣ Test Audit Export (Copy & Paste)
```
Generate internal audit Excel for this quote.
```

**Expected:** Download link appears, click it

### 7️⃣ Verify Excel
Open downloaded file and check:
- ✅ 8 tabs exist
- ✅ Formula Reference tab shows all ANC formulas

---

## 📋 EXPECTED VALUES

| Test | Dimensions | Pixel | Environment | Margin | Expected Price |
|------|------------|--------|-------------|---------|---------------|
| 1 | 24' x 10' | 1.5mm | Indoor | 32% | $1,704,294 |
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
