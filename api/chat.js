```javascript
export default function handler(req, res) {
  console.log("🔥 KIRONG CHAT FUNCTION STARTED");

  return res.status(200).json({
    ok: true,
    message: "🔥 KIRONG BACKEND IS ALIVE",
    method: req.method
  });
}
```
