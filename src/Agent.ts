export type AgentTrace = {
  tool: string;
  message: string;
  type: 'info' | 'success' | 'error';
};

// ────────────────────────────────────────────────────────────────────
// Helper: Search Google Local via SerpAPI for a single query
// ────────────────────────────────────────────────────────────────────
async function searchGoogleLocal(query: string): Promise<any[]> {
  const url = `/api/search?engine=google_local&q=${encodeURIComponent(query)}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const data = await res.json();
      console.error(`Search error (${res.status}):`, data);
      throw new Error(data.error || `Search provider returned ${res.status}`);
    }
    const data = await res.json();
    return data.local_results || [];
  } catch (err: any) {
    console.error("Fetch error for Search Provider:", err);
    if (err.message === 'Failed to fetch') {
      throw new Error("Connection blocked. Please disable any adblockers or check your network connection.");
    }
    throw err;
  }
}

// ────────────────────────────────────────────────────────────────────
// Helper: Classify each interest into "activity" or "food" category
// ────────────────────────────────────────────────────────────────────
function classifyInterest(interest: string): 'food' | 'activity' {
  const foodKeywords = ['food', 'eat', 'restaurant', 'cafe', 'dining', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'biryani', 'pizza', 'burger', 'dosa', 'thali', 'ice cream', 'dessert', 'coffee', 'tea', 'bakery', 'sweet'];
  const lower = interest.toLowerCase();
  return foodKeywords.some(kw => lower.includes(kw)) ? 'food' : 'activity';
}

// ────────────────────────────────────────────────────────────────────
// Helper: Parse the actual food cost from Google's price string
// Google returns prices like "₹200–1,200" or "₹400–1,400" for Indian results
// We extract the AVERAGE of the range as a per-person meal estimate
// ────────────────────────────────────────────────────────────────────
function parseFoodCost(priceStr: string | undefined | null, fallback: number = 600): number {
  if (!priceStr) return fallback;
  // Extract all numbers from the string (e.g. "₹200–1,200" → [200, 1200])
  const numbers = priceStr.replace(/,/g, '').match(/\d+/g);
  if (!numbers || numbers.length === 0) return fallback;
  const nums = numbers.map(Number);
  if (nums.length >= 2) {
    // Range like "₹200–1200" → take the AVERAGE for a realistic meal cost
    return Math.floor((nums[0] + nums[1]) / 2);
  }
  return nums[0];
}

// ────────────────────────────────────────────────────────────────────
// Helper: Build the right Google Local query for a given interest
// ────────────────────────────────────────────────────────────────────
function buildSearchQuery(interest: string, city: string, dietaryConstraint: string | null, quietModifier: string): string {
  const category = classifyInterest(interest);
  if (category === 'food') {
    // Food interest → search for restaurants matching it + dietary + quiet
    return `${interest} ${dietaryConstraint || ''} ${quietModifier} restaurants in ${city}`.replace(/\s+/g, ' ').trim();
  }
  // Activity interest → search for venues/places matching it + quiet
  return `best ${interest} ${quietModifier} in ${city}`.replace(/\s+/g, ' ').trim();
}

// ────────────────────────────────────────────────────────────────────
// Main Agent
// ────────────────────────────────────────────────────────────────────
export async function runPlannerAgent(input: any, onTrace: (trace: AgentTrace) => void) {
  try {

    // ═══════════════════════════════════════════════════════════════
    // TOOL 1: parseUserPreferences
    // ═══════════════════════════════════════════════════════════════
    onTrace({ tool: 'parseUserPreferences', message: `Analyzing input for ${input.city}...`, type: 'info' });

    const budget = Number(input.budget);
    const interests: string[] = input.interests;
    const constraints: string[] = input.constraints;
    const city: string = input.city;
    const mood: string = input.mood;

    // Extract specific constraint flags
    const isVegetarian = constraints.some((c: string) => c.toLowerCase().includes('veg') && !c.toLowerCase().includes('non-veg'));
    const wantsQuiet = constraints.some((c: string) => /quiet|peace|avoid crowd/i.test(c));
    const dietaryConstraint = isVegetarian ? 'vegetarian' : null;
    // This modifier gets injected into EVERY search query when user wants quiet places
    const quietModifier = wantsQuiet ? 'quiet less crowded' : '';

    // All constraints that are NOT dietary or crowd-related are "custom" constraints
    const customConstraints = constraints.filter((c: string) =>
      !(/veg|quiet|peace|avoid crowd/i.test(c.toLowerCase()))
    );

    onTrace({
      tool: 'parseUserPreferences',
      message: `Parsed: Interests=[${interests.join(', ')}], Mood="${mood}", Vegetarian=${isVegetarian}, Quiet=${wantsQuiet}${customConstraints.length > 0 ? `, Custom=[${customConstraints.join(', ')}]` : ''}, Budget=₹${budget}`,
      type: 'success'
    });

    // ═══════════════════════════════════════════════════════════════
    // TOOL 2: getWeatherContext
    // ═══════════════════════════════════════════════════════════════
    const targetDate = input.date;
    onTrace({ tool: 'getWeatherContext', message: `Fetching forecast for ${city} on ${targetDate}...`, type: 'info' });
    let temp = "pleasant";
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
      const geoData = await geoRes.json();
      if (geoData?.length > 0) {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geoData[0].lat}&longitude=${geoData[0].lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${targetDate}&end_date=${targetDate}`);
        const weatherData = await weatherRes.json();
        if (weatherData.daily?.temperature_2m_max?.length > 0) {
          const max = weatherData.daily.temperature_2m_max[0];
          const min = weatherData.daily.temperature_2m_min[0];
          temp = `High ${max}°C, Low ${min}°C`;
        } else {
          temp = "Forecast unavailable for this date";
        }
        onTrace({ tool: 'getWeatherContext', message: `Forecast: ${temp}`, type: 'success' });
      }
    } catch (e) {
      onTrace({ tool: 'getWeatherContext', message: `Could not fetch weather, using default.`, type: 'info' });
    }

    // ═══════════════════════════════════════════════════════════════
    // TOOL 3: searchPerInterest — THE KEY CHANGE
    // Search Google Local SEPARATELY for EACH user interest so that
    // "movies" returns actual movie theaters, "music" returns music
    // venues, "walks" returns parks, etc. No more mashing them together.
    // ═══════════════════════════════════════════════════════════════

    // Combine mood with interests to create search categories
    // e.g. mood="fun" interests=["movies","music","walks"] → search targets
    const allSearchTargets = [...interests];

    const wantsFood = allSearchTargets.some(i => /food|dining|lunch|dinner|restaurant|cafe|eat|drink/i.test(i));

    // We'll track all discovered venues
    type Venue = {
      name: string;
      type: string;
      rating: number;
      reviews: number;
      cost: number;
      thumbnail: string | null;
      category: 'activity' | 'food';
      matchedInterest: string;
      priceString?: string;
      venueDesc?: string;
      venueType?: string;
      mapUrl?: string;
    };

    const allActivities: Venue[] = [];
    const allFoodOptions: Venue[] = [];

    for (const interest of allSearchTargets) {
      const category = classifyInterest(interest);
      const query = buildSearchQuery(interest, city, dietaryConstraint, quietModifier);

      onTrace({ tool: 'searchPerInterest', message: `Searching for "${interest}" → query: "${query}"...`, type: 'info' });

      const results = await searchGoogleLocal(query);

      // Take top 5 per interest to keep things manageable
      const top = results.slice(0, 5);

      for (let idx = 0; idx < top.length; idx++) {
        const e = top[idx];
        const venue: Venue = {
          name: e.title,
          type: e.type || interest,
          rating: e.rating || 4.0,
          reviews: e.reviews || 50,
          thumbnail: e.thumbnail || null,
          matchedInterest: interest,
          category,
          priceString: e.price,
          venueDesc: e.description,
          venueType: e.type,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.title + ' ' + city)}`,
          // Cost estimation: parse actual Google price for food, calculate realistic premium scale for activities
          cost: category === 'food'
            ? parseFoodCost(e.price, 800)
            : (e.type?.toLowerCase().includes('park') || e.type?.toLowerCase().includes('temple') || e.type?.toLowerCase().includes('garden') || e.type?.toLowerCase().includes('walk') || e.type?.toLowerCase().includes('lake') || e.title?.toLowerCase().includes('park'))
              ? 0
              : Math.min(Math.floor(((e.rating || 4.0) * 150) + ((e.reviews || 100) / 5)), 2500)
        };

        if (category === 'food') {
          allFoodOptions.push(venue);
        } else {
          allActivities.push(venue);
        }
      }

      onTrace({ tool: 'searchPerInterest', message: `Found ${top.length} results for "${interest}" (${category}).`, type: 'success' });
    }

    // ═══════════════════════════════════════════════════════════════
    // If user asked for food but we found none, do a dedicated restaurant search
    // ═══════════════════════════════════════════════════════════════
    if (wantsFood && allFoodOptions.length === 0) {
      const foodQuery = `${dietaryConstraint || 'best'} ${quietModifier} restaurants in ${city}`.replace(/\s+/g, ' ').trim();
      onTrace({ tool: 'getFoodOptions', message: `No food interests specified. Searching: "${foodQuery}"...`, type: 'info' });

      const foodResults = await searchGoogleLocal(foodQuery);
      for (let idx = 0; idx < Math.min(foodResults.length, 10); idx++) {
        const e = foodResults[idx];
        allFoodOptions.push({
          name: e.title,
          type: e.type || 'restaurant',
          rating: e.rating || 4.0,
          reviews: e.reviews || 50,
          thumbnail: e.thumbnail || null,
          matchedInterest: 'dining',
          category: 'food',
          priceString: e.price,
          venueDesc: e.description,
          venueType: e.type,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.title + ' ' + city)}`,
          cost: parseFoodCost(e.price, 800)
        });
      }
      onTrace({ tool: 'getFoodOptions', message: `Found ${allFoodOptions.length} restaurants.`, type: 'success' });
    }

    // If user had NO activity interests, use mood to find places
    if (allActivities.length === 0) {
      const actQuery = `${mood} ${quietModifier} places to visit in ${city}`.replace(/\s+/g, ' ').trim();
      onTrace({ tool: 'getActivityOptions', message: `No activity interests found. Searching: "${actQuery}"...`, type: 'info' });

      const actResults = await searchGoogleLocal(actQuery);
      for (let idx = 0; idx < Math.min(actResults.length, 10); idx++) {
        const e = actResults[idx];
        allActivities.push({
          name: e.title,
          type: e.type || 'attraction',
          rating: e.rating || 4.0,
          reviews: e.reviews || 50,
          thumbnail: e.thumbnail || null,
          matchedInterest: mood,
          category: 'activity',
          priceString: e.price,
          venueDesc: e.description,
          venueType: e.type,
          mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.title + ' ' + city)}`,
          cost: Math.min(Math.floor(((e.rating || 4.0) * 150) + ((e.reviews || 100) / 5)), 2500)
        });
      }
      onTrace({ tool: 'getActivityOptions', message: `Found ${allActivities.length} activity options.`, type: 'success' });
    }

    // ═══════════════════════════════════════════════════════════════
    // TOOL 4: calculateTimeSlots
    // ═══════════════════════════════════════════════════════════════
    const startParts = input.startTime.split(':');
    const endParts = input.endTime.split(':');
    let startHour = parseInt(startParts[0]) + parseInt(startParts[1]) / 60;
    let endHour = parseInt(endParts[0]) + parseInt(endParts[1]) / 60;
    if (endHour <= startHour) endHour += 24;
    const hoursAvailable = endHour - startHour;

    const numMeals = wantsFood ? (hoursAvailable >= 4 ? (hoursAvailable >= 8 ? 2 : 1) : 1) : 0;
    const numActivities = hoursAvailable >= 6 ? (wantsFood ? 2 : 3) : (wantsFood ? 1 : 2);

    onTrace({ tool: 'calculateTimeSlots', message: `${hoursAvailable.toFixed(1)} hours available (${input.startTime}–${input.endTime}). Planning ${numActivities} activities + ${numMeals} meals.`, type: 'success' });

    // ═══════════════════════════════════════════════════════════════
    // TOOL 5: optimizeBudget — Generate TWO plans
    //   Plan A: "Best Experience" — highest rated venues, ignores budget
    //   Plan B: "Within Budget" — strictly fits within user's budget
    // ═══════════════════════════════════════════════════════════════
    onTrace({ tool: 'optimizeBudget', message: `Generating two plans: Best Experience + Within ₹${budget} Budget...`, type: 'info' });

    // Deduplicate venues
    const dedup = (arr: Venue[]) => {
      const seen = new Map<string, Venue>();
      for (const v of arr) {
        const existing = seen.get(v.name);
        if (!existing || v.rating > existing.rating) {
          seen.set(v.name, v);
        }
      }
      return Array.from(seen.values());
    };

    const uniqueActivities = dedup(allActivities);
    const uniqueFood = dedup(allFoodOptions);

    // ── Plan A: BEST EXPERIENCE — Premium high-end venues, no budget limit ──
    const bestActivities: Venue[] = [];
    const bestUsedInterests = new Set<string>();
    
    // Sort by Premium Score (50% rating, 50% high cost) to ensure a luxurious experience
    const maxActCost = Math.max(...uniqueActivities.map(a => a.cost), 1);
    const premiumActSort = [...uniqueActivities].sort((a, b) => {
      const scoreA = (a.rating / 5) * 0.5 + (a.cost / maxActCost) * 0.5;
      const scoreB = (b.rating / 5) * 0.5 + (b.cost / maxActCost) * 0.5;
      return scoreB - scoreA;
    });

    // Pick premium venues from diverse interests first
    for (const act of premiumActSort) {
      if (bestActivities.length >= numActivities) break;
      if (!bestUsedInterests.has(act.matchedInterest)) {
        bestActivities.push(act);
        bestUsedInterests.add(act.matchedInterest);
      }
    }
    // Fill remaining with absolute highest premium score
    for (const act of premiumActSort) {
      if (bestActivities.length >= numActivities) break;
      if (!bestActivities.find(p => p.name === act.name)) {
        bestActivities.push(act);
      }
    }

    const bestMeals: Venue[] = [];
    const maxFoodCost = Math.max(...uniqueFood.map(f => f.cost), 1);
    const premiumFoodSort = [...uniqueFood].sort((a, b) => {
      const scoreA = (a.rating / 5) * 0.5 + (a.cost / maxFoodCost) * 0.5;
      const scoreB = (b.rating / 5) * 0.5 + (b.cost / maxFoodCost) * 0.5;
      return scoreB - scoreA;
    });

    for (const meal of premiumFoodSort) {
      if (bestMeals.length >= numMeals) break;
      bestMeals.push(meal);
    }

    const bestCost = bestActivities.reduce((s, a) => s + a.cost, 0) + bestMeals.reduce((s, m) => s + m.cost, 0);
    onTrace({ tool: 'optimizeBudget', message: `🏆 Best Experience: ₹${bestCost} — top-rated venues, no budget limit.`, type: 'success' });

    // ── Plan B: WITHIN BUDGET — Exhaustive knapsack to MAXIMIZE spend + rating ──
    // Try ALL valid combinations and pick the one that:
    //   1. Fits within budget (hard constraint)
    //   2. Spends as CLOSE to the budget as possible (maximize value)
    //   3. Among similar costs, pick highest rated venues
    onTrace({ tool: 'optimizeBudget', message: `💰 Running knapsack optimizer to maximize your ₹${budget}...`, type: 'info' });

    // Robust combination generator for Knapsack
    const getCombinations = (array: Venue[], k: number): Venue[][] => {
      if (k <= 0) return [[]];
      const validK = Math.min(k, array.length);
      if (validK === 0) return [[]];
      
      const combos: Venue[][] = [];
      const generate = (start: number, curr: Venue[]) => {
        if (curr.length === validK) {
          combos.push([...curr]);
          return;
        }
        for (let i = start; i < array.length; i++) {
          curr.push(array[i]);
          generate(i + 1, curr);
          curr.pop();
        }
      };
      generate(0, []);
      return combos;
    };

    const actCombos = getCombinations(uniqueActivities, numActivities);
    const mealCombos = getCombinations(uniqueFood, numMeals);

    // Score each combination: maximize (spend / budget) * 0.5 + (avgRating / 5) * 0.5
    let bestBudgetPlan: { acts: Venue[]; meals: Venue[]; cost: number; score: number } | null = null;
    let bestOverBudgetPlan: { acts: Venue[]; meals: Venue[]; cost: number; score: number } | null = null;

    for (const acts of actCombos) {
      for (const meals of mealCombos) {
        const totalCost = acts.reduce((s, a) => s + a.cost, 0) + meals.reduce((s, m) => s + m.cost, 0);
        const allItems = [...acts, ...meals];
        const avgRating = allItems.reduce((s, v) => s + v.rating, 0) / allItems.length;
        // Bonus for interest diversity
        const uniqueInterests = new Set(allItems.map(v => v.matchedInterest)).size;
        const diversityBonus = uniqueInterests / allItems.length;

        // Score: 50% how close to budget ceiling + 30% rating + 20% diversity
        const spendRatio = Math.min(totalCost / budget, 1); // caps at 1.0
        const score = spendRatio * 0.5 + (avgRating / 5) * 0.3 + diversityBonus * 0.2;

        if (totalCost <= budget) {
          // Fits within budget — track best
          if (!bestBudgetPlan || score > bestBudgetPlan.score) {
            bestBudgetPlan = { acts, meals, cost: totalCost, score };
          }
        } else {
          // Over budget — track closest over-budget as fallback
          if (!bestOverBudgetPlan || totalCost < bestOverBudgetPlan.cost) {
            bestOverBudgetPlan = { acts, meals, cost: totalCost, score };
          }
        }
      }
    }

    // Use the best within-budget plan, or fall back to closest over-budget plan
    const chosenBudgetPlan = bestBudgetPlan || bestOverBudgetPlan!;
    const budgetActivities = chosenBudgetPlan.acts;
    const budgetMeals = chosenBudgetPlan.meals;
    const budgetCost = chosenBudgetPlan.cost;
    const budgetFits = budgetCost <= budget;

    onTrace({ tool: 'optimizeBudget', message: `💰 Budget plan: ₹${budgetCost}/₹${budget} ${budgetFits ? '✓ Maximized!' : '(closest possible)'} — Score: ${chosenBudgetPlan.score.toFixed(2)}`, type: budgetFits ? 'success' : 'info' });

    // ═══════════════════════════════════════════════════════════════
    // TOOL 6: generateItinerary — Build timelines for BOTH plans
    // ═══════════════════════════════════════════════════════════════
    onTrace({ tool: 'generateItinerary', message: `Building itineraries for both plans...`, type: 'info' });

    const formatTime = (hourNum: number) => {
      if (hourNum >= 24) hourNum -= 24;
      const h = Math.floor(hourNum);
      const m = Math.round((hourNum - h) * 60).toString().padStart(2, '0');
      const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      return `${displayH}:${m} ${ampm}`;
    };

    const buildTimeline = (acts: Venue[], meals: Venue[]) => {
      const timeline: any[] = [];
      let aIdx = 0;
      let mIdx = 0;
      const slots = acts.length + meals.length;
      const step = hoursAvailable / (slots + 1);
      let time = startHour;

      while (aIdx < acts.length || mIdx < meals.length) {
        if (aIdx < acts.length) {
          const act = acts[aIdx];
          const actDesc = act.venueDesc ? ` ${act.venueDesc}` : '';
          const actType = act.venueType ? act.venueType.toLowerCase() : 'spot';
          
          const getPriceRange = (v: Venue) => {
            if (v.priceString && v.priceString.includes('–')) return v.priceString; // Google already gave a range
            if (v.cost === 0) return 'Free';
            const min = Math.floor(v.cost * 0.8);
            const max = Math.ceil(v.cost * 1.3);
            return `₹${min} - ₹${max}`;
          };

          timeline.push({
            time: formatTime(time),
            activity: aIdx === 0 ? `Experience ${act.name}` : `Discover ${act.name}`,
            description: `Visit ${act.name}, a highly-rated ${actType}. ${actDesc}`,
            rationale: `Matched your interest "${act.matchedInterest}".${wantsQuiet ? ' Quiet & less crowded.' : ''}`,
            thumbnail: act.thumbnail,
            cost: act.cost,
            rating: act.rating,
            reviews: act.reviews,
            priceString: getPriceRange(act),
            mapUrl: act.mapUrl
          });
          time += step;
          aIdx++;
        }
        if (mIdx < meals.length) {
          const meal = meals[mIdx];
          const mealDesc = meal.venueDesc ? ` ${meal.venueDesc}` : '';
          const mealType = meal.venueType ? meal.venueType.toLowerCase() : 'local';

          const getPriceRange = (v: Venue) => {
            if (v.priceString && v.priceString.includes('–')) return v.priceString;
            if (v.cost === 0) return 'Free';
            const min = Math.floor(v.cost * 0.8);
            const max = Math.ceil(v.cost * 1.3);
            return `₹${min} - ₹${max}`;
          };

          timeline.push({
            time: formatTime(time),
            activity: mIdx === 0 ? `Meal at ${meal.name}` : `Dinner at ${meal.name}`,
            description: `Head to ${meal.name} for amazing ${mealType} cuisine. ${mealDesc}`,
            rationale: `${isVegetarian ? 'Vegetarian ✓' : ''} Matched "${meal.matchedInterest}".`,
            thumbnail: meal.thumbnail,
            cost: meal.cost,
            rating: meal.rating,
            reviews: meal.reviews,
            priceString: getPriceRange(meal),
            mapUrl: meal.mapUrl
          });
          time += step;
          mIdx++;
        }
      }

      timeline.push({
        time: formatTime(endHour),
        activity: "Evening Stroll & Wind Down",
        description: `Wrap up your perfect Saturday with a peaceful evening stroll.`,
        rationale: "Completely free (₹0) — a relaxing end to your day.",
        cost: 0,
        rating: 5.0,
        reviews: 0,
        priceString: "Free"
      });

      return timeline;
    };

    const bestTimeline = buildTimeline(bestActivities, bestMeals);
    const budgetTimeline = buildTimeline(budgetActivities, budgetMeals);

    onTrace({ tool: 'generateItinerary', message: `✓ Both itineraries ready!`, type: 'success' });

    return {
      title: `The "Perfect Saturday" in ${city}`,
      budget,
      temperature: temp,
      bestExperience: {
        estimatedCost: bestCost,
        isOverBudget: bestCost > budget,
        itinerary: bestTimeline
      },
      withinBudget: {
        estimatedCost: budgetCost,
        isOverBudget: !budgetFits,
        itinerary: budgetTimeline
      }
    };
  } catch (err: any) {
    onTrace({ tool: 'system', message: `Fatal Planning Error: ${err.message}`, type: 'error' });
    throw new Error(`Planning failed: ${err.message}`);
  }
}
