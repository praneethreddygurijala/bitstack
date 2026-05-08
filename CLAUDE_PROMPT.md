# UI Generation Prompt for Claude

**Instructions for the User:**
Copy everything below the dashed line and paste it directly into Claude or v0 to have it generate the ultimate beautiful UI for our application.

---------------------------------------------------------------------------------------------------

You are an expert front-end developer and UI/UX designer. I have already built the entire backend logic and data orchestrator for a web application called **"Perfect Saturday"**, which is an Agentic Intelligence Planner powered by MCP (Model Context Protocol) servers. 

Your task is to build a stunning, premium, world-class UI in React (using Tailwind CSS and Lucide React icons) that connects to my existing backend structure.

### 1. The Core Concept
The application takes highly specific user constraints (budget, mood, interests, strict dietary needs) and uses a multi-agent workflow to fetch real-time local search data (via SerpAPI) and exact-date weather forecasts (via Open-Meteo) to generate a complete, hour-by-hour weekend itinerary.

It generates **two distinct plans** simultaneously:
1. **Within Budget**: A mathematically optimized knapsack itinerary that perfectly fits the user's spending limit.
2. **Premium Experience**: A budget-agnostic itinerary focusing purely on the highest-rated, most luxurious options available.

### 2. The Data Structures
I already have an `App.tsx` file that handles the React state and calls the backend `runPlannerAgent` function. The state looks like this:

```typescript
const [formData, setFormData] = useState({
  city: 'Bangalore',
  date: '2024-10-12', // YYYY-MM-DD
  budget: 5000,
  startTime: '10:00',
  endTime: '18:00',
  mood: 'tired but wants to do something fun',
  interests: 'food, music, walks',
  constraints: 'vegetarian, avoid crowded places'
});

const [traces, setTraces] = useState<{tool: string, message: string, type: 'info'|'success'|'error'}[]>([]);
const [finalPlan, setFinalPlan] = useState<any>(null); // See structure below
```

The `finalPlan` object returned by the backend looks exactly like this:
```json
{
  "title": "The \"Perfect Saturday\" in Bangalore",
  "budget": 5000,
  "temperature": "High 28.5°C, Low 19.2°C",
  "bestExperience": {
    "estimatedCost": 8500,
    "isOverBudget": true,
    "itinerary": [ /* Array of Venue Objects */ ]
  },
  "withinBudget": {
    "estimatedCost": 4850,
    "isOverBudget": false,
    "itinerary": [ /* Array of Venue Objects */ ]
  }
}
```

**Venue Object Structure (`itinerary` array):**
```json
{
  "time": "10:00 AM",
  "activity": "Discover Rainbow Bridge",
  "description": "Visit Rainbow Bridge, a highly-rated live music venue. 'The acoustics are incredible...'",
  "rationale": "Matched your interest 'music'. Quiet & less crowded.",
  "thumbnail": "https://image-url.com/img.jpg",
  "cost": 1200,
  "rating": 4.8,
  "reviews": 1240,
  "priceString": "₹1000-1500",
  "mapUrl": "https://google.com/maps/..."
}
```

### 3. UI/UX Requirements
I need you to generate a `App.tsx` (or equivalent component code) that provides a breathtaking, premium user interface. 

Please adhere to the following design system requirements:
1. **Aesthetics**: Use a deep dark mode or an incredibly polished, vibrant glassmorphism theme. It should look like a cutting-edge AI startup app (e.g., Vercel, Linear, or Perplexity).
2. **Sidebar Form**: A sticky configuration form on the left where the user inputs the `formData` fields.
3. **Execution Terminal**: An animated, hacker-style terminal block that maps over the `traces` array to show the agent's thought process in real-time.
4. **Plan Toggle**: A very sleek switch or tab system to toggle the view between the `withinBudget` plan and `bestExperience` plan.
5. **Dynamic Header**: Display the plan's Title, the exact Weather (`temperature`), the Total Estimated Cost vs the Budget Limit, and a visual flag (e.g., a green "Within Budget" badge or an orange "Premium Selected" badge).
6. **Vertical Timeline Layout**: Render the `itinerary` array as a beautiful vertical journey map.
7. **Rich Venue Cards**: Each item on the timeline should be a stunning card featuring:
   - A full-width cropped thumbnail image.
   - Beautiful badges for Star Rating + Reviews, Estimated Price String, and a "View on Maps" button.
   - The rich description text.
   - A minimalist "Rationale" callout box explaining why the AI chose it.

Do not write the backend `runPlannerAgent` logic—I already have it. Simply write the frontend React UI that consumes this exact state and renders the most beautiful interface possible.
