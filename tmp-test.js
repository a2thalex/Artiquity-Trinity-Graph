import fetch from "node-fetch";

const res = await fetch("http://localhost:3001/api/gemini/creative-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    artistName: "Test",
    selectedStrategy: "Strategy",
    identityElements: ["element"],
    inputs: { detail: "some" }
  })
});

console.log(res.status);
console.log(await res.text());
