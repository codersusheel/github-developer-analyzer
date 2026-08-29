# GitHub Developer Analyzer — Run Guide

## Windows पर Project Run करें

### Step 1 — CMD खोलें

Keyboard से:

```text
Windows + R
```

फिर लिखें:

```text
cmd
```

और **Enter** दबाएँ।

---

### Step 2 — Project Folder में जाएँ

CMD में:

```bash
cd Windows + R
↓
cmd
↓
cd  D:\GitHub\project-t\github-developer-analyzer
↓
npm install
↓
npm run dev
↓
Browser → http://localhost:3000
```

फिर **Enter** दबाएँ।

---

### Step 3 — Dependencies Install करें

```bash
npm install
```

फिर **Enter** दबाएँ।

> यह पहली बार project setup करते समय करना है।

---

### Step 4 — Server Run करें

```bash
npm run dev
```

फिर **Enter** दबाएँ।

अगर server successfully start हो गया है, तो CMD को बंद न करें।

---

### Step 5 — Browser में Page खोलें

Chrome खोलें और लिखें:

```text
http://localhost:3000
```

फिर **Enter** दबाएँ।

---

## File से Run करना हो

अगर project किसी दूसरी location पर है, तो पहले उस folder में जाएँ:

```bash
cd "PROJECT_FOLDER_PATH"
```

फिर:

```bash
npm run dev
```

---

## Quick Method

```text
Windows + R
      ↓
cmd
      ↓
cd C:\Users\MSI-1\github-developer-analyzer
      ↓
npm run dev
      ↓
http://localhost:3000
```

---

## Server बंद करना

CMD में:

```text
Ctrl + C
```

---

## अगली बार केवल

```text
Windows + R
      ↓
cmd
      ↓
cd C:\Users\MSI-1\github-developer-analyzer
      ↓
npm run dev
      ↓
http://localhost:3000
```
