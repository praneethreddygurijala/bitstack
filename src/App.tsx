import { useState } from 'react';
import { Bot, MapPin, Clock, IndianRupee, Smile, Heart, AlertCircle, CheckCircle2, Loader2, Trophy, Wallet, Navigation, Sparkles, Star, Calendar, CloudSun, Phone, Image } from 'lucide-react';
import { runPlannerAgent, type AgentTrace } from './Agent';

function App() {
  const [formData, setFormData] = useState({
    city: '',
    date: '',
    budget: '',
    startTime: '',
    endTime: '',
    mood: '',
    interests: '',
    constraints: ''
  });

  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [finalPlan, setFinalPlan] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<'budget' | 'best'>('budget');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlanning(true);
    setTraces([]);
    setFinalPlan(null);
    setActivePlan('budget');

    const plan = await runPlannerAgent({
      ...formData,
      interests: formData.interests.split(',').map(i => i.trim()),
      constraints: formData.constraints.split(',').map(c => c.trim())
    }, (trace) => {
      setTraces(prev => [...prev, trace]);
    });

    setFinalPlan(plan);
    setIsPlanning(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const currentPlan = finalPlan ? (activePlan === 'best' ? finalPlan.bestExperience : finalPlan.withinBudget) : null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans">
      
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-[#F26C24] p-1.5 rounded-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">PerfectSaturday</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <span className="cursor-pointer hover:text-[#F26C24]">Destinations</span>
          <span className="cursor-pointer hover:text-[#F26C24]">Experiences</span>
          <span className="cursor-pointer hover:text-[#F26C24]">About Us</span>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ── Sidebar Filters (Search Widget) ── */}
          <div className="lg:w-[320px] shrink-0 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6 text-gray-900">Plan Your Trip</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">City</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input required name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Bangalore, Goa, Mumbai" className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-md focus:border-[#F26C24] focus:ring-1 focus:ring-[#F26C24] outline-none text-sm font-medium" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      required 
                      type="date" 
                      name="date" 
                      value={formData.date} 
                      onChange={handleChange} 
                      onClick={(e) => (e.target as any).showPicker?.()}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-md focus:border-[#F26C24] focus:ring-1 focus:ring-[#F26C24] outline-none text-sm font-medium cursor-pointer" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Budget Ceiling (INR)</label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input required type="number" name="budget" value={formData.budget} onChange={handleChange} placeholder="e.g. 5000" className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-md focus:border-[#F26C24] focus:ring-1 focus:ring-[#F26C24] outline-none text-sm font-medium" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Start</label>
                    <input 
                      required 
                      type="time" 
                      name="startTime" 
                      value={formData.startTime} 
                      onChange={handleChange} 
                      onClick={(e) => (e.target as any).showPicker?.()}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:border-[#F26C24] focus:ring-1 focus:ring-[#F26C24] outline-none text-sm font-medium cursor-pointer" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">End</label>
                    <input 
                      required 
                      type="time" 
                      name="endTime" 
                      value={formData.endTime} 
                      onChange={handleChange} 
                      onClick={(e) => (e.target as any).showPicker?.()}
                      className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md focus:border-[#F26C24] focus:ring-1 focus:ring-[#F26C24] outline-none text-sm font-medium cursor-pointer" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Mood</label>
                  <input required name="mood" value={formData.mood} onChange={handleChange} placeholder="e.g. Adventurous, Relaxed" className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:border-[#F26C24] focus:ring-1 focus:ring-[#F26C24] outline-none text-sm font-medium" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Interests</label>
                  <textarea required name="interests" value={formData.interests} onChange={handleChange} placeholder="e.g. Trekking, Cafes, Museums" rows={2} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:border-[#F26C24] focus:ring-1 focus:ring-[#F26C24] outline-none text-sm font-medium resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Constraints</label>
                  <textarea name="constraints" value={formData.constraints} onChange={handleChange} placeholder="e.g. Vegetarian, Pet friendly" rows={2} className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-md focus:border-[#F26C24] focus:ring-1 focus:ring-[#F26C24] outline-none text-sm font-medium resize-none" />
                </div>

                <button 
                  disabled={isPlanning}
                  type="submit" 
                  className="w-full mt-4 bg-[#F26C24] hover:bg-[#d95f1d] disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-md transition-colors flex justify-center items-center gap-2 text-sm uppercase tracking-wide"
                >
                  {isPlanning ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                  ) : (
                    <>Search Itinerary</>
                  )}
                </button>
              </form>
            </div>

            {/* Trace Log - Simple white card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-gray-800 text-xs font-bold uppercase tracking-wide">
                <Bot className="w-4 h-4 text-[#F26C24]" /> Execution Logs
              </div>
              <div className="space-y-2 font-mono text-[11px] max-h-48 overflow-y-auto custom-scrollbar pr-2 leading-relaxed">
                {traces.length === 0 && !isPlanning && (
                  <div className="text-gray-400">Ready for search parameters...</div>
                )}
                {traces.map((trace, i) => (
                  <div key={i} className={`flex gap-2 items-start ${trace.type === 'error' ? 'text-red-500' : trace.type === 'success' ? 'text-green-600' : 'text-gray-500'}`}>
                    <span className="font-semibold text-gray-700 shrink-0">{trace.tool}:</span> 
                    <span>{trace.message}</span>
                  </div>
                ))}
                {isPlanning && (
                  <div className="flex gap-2 items-center text-[#F26C24] animate-pulse mt-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> <span>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Main Content Area (Cards Grid) ── */}
          <div className="flex-1">
            
            {finalPlan && currentPlan ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header & Toggle */}
                {/* Header & Toggles Row */}
                <div className="flex flex-col xl:flex-row gap-6 mb-10 items-start xl:items-end justify-between border-b border-gray-200 pb-8">
                  {/* Left: Title & Weather */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-5">{finalPlan.title}</h1>
                    
                    {/* Creative Date & Weather Widget */}
                    {finalPlan.temperature && (
                      <div className="inline-flex flex-wrap items-center p-1.5 pr-6 bg-white rounded-full border border-gray-200 shadow-sm gap-4">
                        {/* Date Section */}
                        <div className="flex items-center gap-3 pl-2 border-r border-gray-200 pr-4">
                          <div className="bg-orange-50 p-2 rounded-full">
                            <Calendar className="w-4 h-4 text-[#F26C24]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                              {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                            <span className="text-sm font-extrabold text-gray-800">
                              {new Date(formData.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Weather Section */}
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-br from-sky-400 to-blue-500 p-2 rounded-full shadow-inner">
                            <CloudSun className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Forecast</span>
                            <span className="text-sm font-extrabold text-gray-800">{finalPlan.temperature}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Plan Toggles */}
                  <div className="flex gap-4 shrink-0 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
                    <button
                      onClick={() => setActivePlan('budget')}
                      className={`relative p-4 rounded-xl border-2 text-left min-w-[240px] transition-all duration-300 ${
                        activePlan === 'budget' 
                          ? 'border-[#00A650] bg-green-50/50 shadow-md ring-2 ring-green-500/20' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold flex items-center gap-1.5 ${activePlan === 'budget' ? 'text-[#00A650]' : 'text-gray-500'}`}>
                          <CheckCircle2 className="w-4 h-4" /> Within Budget
                        </span>
                        {activePlan === 'budget' && (
                          <span className="bg-[#00A650] text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">Active</span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-gray-900 mb-1">
                        INR {finalPlan.withinBudget.estimatedCost}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Optimized to fit your limit.
                      </div>
                    </button>

                    <button
                      onClick={() => setActivePlan('best')}
                      className={`relative p-4 rounded-xl border-2 text-left min-w-[240px] transition-all duration-300 ${
                        activePlan === 'best' 
                          ? 'border-[#F26C24] bg-orange-50/50 shadow-md ring-2 ring-orange-500/20' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold flex items-center gap-1.5 ${activePlan === 'best' ? 'text-[#F26C24]' : 'text-gray-500'}`}>
                          <Trophy className="w-4 h-4" /> Premium Top-Rated
                        </span>
                        {activePlan === 'best' && (
                          <span className="bg-[#F26C24] text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">Active</span>
                        )}
                      </div>
                      <div className="text-2xl font-black text-gray-900 mb-1">
                        INR {finalPlan.bestExperience.estimatedCost}
                      </div>
                      <div className="text-xs font-medium text-gray-500">
                        Highest rated, ignoring budget.
                      </div>
                    </button>
                  </div>
                </div>

                {/* Thrillophilia Style Vertical Timeline */}
                <div className="relative max-w-5xl mx-auto">
                  {/* Vertical connecting line */}
                  <div className="absolute left-8 top-10 bottom-10 w-1 bg-gray-200 hidden md:block rounded-full"></div>
                  
                  <div className="flex flex-col gap-8">
                    {currentPlan.itinerary.map((item: any, i: number) => (
                      <div key={i} className="relative flex flex-col md:flex-row gap-6 items-start group">
                        
                        {/* Timeline Node (Time + Circle) */}
                        <div className="hidden md:flex flex-col items-center shrink-0 w-16 z-10 pt-6">
                          <div className="w-5 h-5 rounded-full bg-[#F26C24] ring-4 ring-orange-100 mb-3 group-hover:scale-125 group-hover:bg-[#FFB700] transition-all duration-300 shadow-md"></div>
                          <div className="text-sm font-black text-gray-900 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm border border-gray-100">{item.time}</div>
                        </div>

                        {/* Timeline Card */}
                        <div className="flex-1 w-full bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col md:flex-row group/card">
                          
                          {/* Mobile Time Tag (Hidden on desktop) */}
                          <div className="md:hidden bg-[#F26C24] text-white text-sm font-bold px-4 py-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> {item.time}
                          </div>

                          {/* Left: Thumbnail */}
                          <div className="relative h-60 md:h-auto md:w-72 shrink-0 bg-gray-100 overflow-hidden">
                            {item.thumbnail ? (
                              <img 
                                src={item.thumbnail} 
                                alt={item.activity} 
                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" 
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/50 relative overflow-hidden group-hover/card:bg-gray-100/50 transition-colors">
                                {/* Stacked Photo Effect */}
                                <div className="relative w-24 h-24 mb-6">
                                  {/* Background card */}
                                  <div className="absolute top-0 right-0 w-20 h-20 bg-white border border-gray-100 rounded-xl shadow-sm rotate-12 transition-transform group-hover/card:rotate-[15deg]"></div>
                                  {/* Middle card */}
                                  <div className="absolute top-1 right-2 w-20 h-20 bg-white border border-gray-100 rounded-xl shadow-sm -rotate-6 transition-transform group-hover/card:-rotate-[8deg]"></div>
                                  {/* Front card */}
                                  <div className="absolute top-2 right-4 w-20 h-20 bg-white border border-gray-200 rounded-xl shadow-md flex items-center justify-center transition-transform group-hover/card:scale-105">
                                    <Image className="w-10 h-10 text-gray-200" />
                                  </div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400 z-10">Memories Await</span>
                              </div>
                            )}
                          </div>

                          {/* Right: Card Body */}
                          <div className="p-6 md:p-8 flex flex-col flex-1">
                            
                            {/* Category & Rating Row */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-orange-600 font-bold uppercase tracking-wider bg-orange-50 px-2.5 py-1 rounded-sm">Activity Slot {i + 1}</span>
                              {item.rating > 0 && (
                                <div className="flex items-center gap-1.5 text-[#00A650] text-sm font-bold bg-green-50 px-2 py-1 rounded">
                                  <Star className="w-4 h-4 fill-[#00A650]" />
                                  {item.rating} <span className="text-gray-500 font-medium text-xs ml-0.5">({item.reviews})</span>
                                </div>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="text-2xl font-bold text-gray-900 leading-snug mb-3">
                              {item.activity}
                            </h3>

                            {/* Bullet / Rationale */}
                            <div className="text-sm text-gray-700 font-medium mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                              <span className="font-bold text-gray-900 flex items-center gap-1.5 mb-1"><Sparkles className="w-4 h-4 text-[#F26C24]"/> Why selected:</span> {item.rationale}
                            </div>

                            {/* Description */}
                            <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                              {item.description}
                            </p>

                            {/* Spacer to push pricing down */}
                            <div className="flex-1" />

                            {/* Bottom Row: Pricing & Button */}
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-auto pt-4 border-t border-gray-100">
                              {/* Pricing */}
                              <div>
                                <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-wider">Est. Budget</div>
                                <div className="text-2xl font-black text-gray-900">
                                  INR {item.cost} <span className="text-sm font-medium text-gray-500">/person</span>
                                </div>
                                {item.priceString && (
                                  <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">
                                    GOOGLE ESTIMATE: {item.priceString}
                                  </div>
                                )}
                              </div>

                              {/* Action Button */}
                              <a 
                                href={item.mapUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="sm:w-auto w-full bg-gradient-to-r from-[#F26C24] to-[#FF8A4C] hover:from-[#d95f1d] hover:to-[#F26C24] text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
                              >
                                <Navigation className="w-4 h-4" />
                                View on Google Maps
                              </a>
                            </div>
                            
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center flex flex-col items-center justify-center h-[600px] overflow-hidden relative">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-50/50 via-white to-white" />
                
                {/* Animated Map Pin Container */}
                <div className="relative mb-8 mt-4 z-10">
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 bg-[#F26C24] rounded-full opacity-20 animate-ping" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute -inset-4 bg-[#F26C24] rounded-full opacity-10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
                  
                  {/* Floating Icon */}
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#F26C24] to-[#FFB700] rounded-full flex items-center justify-center shadow-xl animate-bounce" style={{ animationDuration: '2s' }}>
                    <MapPin className="w-8 h-8 text-white drop-shadow-md" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3 z-10 tracking-tight">Ready to explore?</h3>
                <p className="text-gray-500 max-w-sm z-10 leading-relaxed">
                  Enter your destination, dates, and budget on the left to generate your perfect travel itinerary.
                </p>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
