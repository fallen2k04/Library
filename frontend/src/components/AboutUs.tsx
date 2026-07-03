import { motion } from "motion/react";
import { 
  BookOpen, 
  Landmark, 
  Database, 
  Network, 
  ShieldCheck, 
  Compass, 
  Users, 
  ChevronDown 
} from "lucide-react";

interface AboutUsProps {
  onNavigateView: (view: string, params?: any) => void;
  onOpenAuth?: (mode: "login" | "register") => void;
}

export default function AboutUs({ onNavigateView, onOpenAuth }: AboutUsProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans" id="about-us-view">
      
      {/* 1. HERO BANNER - Parchment / Calligraphy Background */}
      <section className="relative h-[480px] flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Background Image with warm amber/brown overlays */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=1600" 
            alt="Manuscript" 
            className="w-full h-full object-cover opacity-85 scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Subtle gradient overlay mimicking old photo look */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-950/20 via-white/40 to-slate-50" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-3xl px-6 space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#112244] font-serif"
          >
            Our Legacy of Knowledge
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-sm md:text-base text-[#223355]/90 font-medium leading-relaxed max-w-2xl mx-auto font-serif italic"
          >
            Preserving the echoes of the past to illuminate the path forward. Since our inception, Lumina has stood as a bastion for free inquiry and the timeless pursuit of understanding.
          </motion.p>

          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="pt-6 flex justify-center text-[#112244]"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.div>
        </div>
      </section>

      {/* 2. MISSION STATEMENT SECTION */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-indigo-950 dark:text-indigo-300 shadow-xs">
            <BookOpen className="w-7 h-7" />
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-extrabold text-[#112244] dark:text-white font-serif">
          Mission Statement
        </h2>

        <div className="bg-[#f0f7ff]/40 dark:bg-slate-900/60 border-l-4 border-indigo-950 dark:border-indigo-500 p-6 md:p-8 rounded-r-3xl text-left max-w-2xl mx-auto">
          <p className="text-lg md:text-xl font-semibold text-[#112244] dark:text-slate-100 font-serif italic leading-relaxed">
            "To provide universal access to knowledge and inspire a lifelong passion for learning."
          </p>
        </div>
      </section>

      {/* 3. A CENTURY OF SERVICE TIMELINE */}
      <section className="bg-white py-20 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#112244] font-serif">
              A Century of Service
            </h2>
            <p className="text-sm text-slate-500 max-w-lg mx-auto">
              Charting our evolution from a community reading room to a global beacon of modern information.
            </p>
          </div>

          {/* Timeline Component */}
          <div className="relative border-l-2 border-indigo-950/20 md:border-l-0 md:before:absolute md:before:left-1/2 md:before:h-full md:before:w-0.5 md:before:bg-indigo-950/20 space-y-16">
            
            {/* Timeline Item 1 - 1924: The Founding */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between">
              {/* Node Icon on Timeline */}
              <div className="absolute left-[-13px] md:left-1/2 md:-ml-3.5 z-10 p-1.5 bg-indigo-950 text-white rounded-full border border-white">
                <Landmark className="w-4 h-4" />
              </div>

              {/* Content Box (Left side in md) */}
              <div className="pl-6 md:pl-0 md:w-[45%] space-y-3 order-2 md:order-1">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block">1924</span>
                <h3 className="text-xl font-bold text-slate-900 font-serif">The Founding</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  Lumina Library opened its doors with a modest collection of 5,000 volumes, established by a local group of educators dedicated to civic literacy.
                </p>
              </div>

              {/* Image Box (Right side in md) */}
              <div className="pl-6 md:pl-0 md:w-[45%] order-1 md:order-2 mb-4 md:mb-0">
                <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100 aspect-video md:aspect-[16/10]">
                  <img 
                    src="https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800" 
                    alt="Lumina Classics" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            {/* Timeline Item 2 - 1985: Digital Archive Launch */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between">
              {/* Node Icon on Timeline */}
              <div className="absolute left-[-13px] md:left-1/2 md:-ml-3.5 z-10 p-1.5 bg-indigo-950 text-white rounded-full border border-white">
                <Database className="w-4 h-4" />
              </div>

              {/* Image Box (Left side in md) */}
              <div className="pl-6 md:pl-0 md:w-[45%] mb-4 md:mb-0">
                <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100 aspect-video md:aspect-[16/10]">
                  <img 
                    src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800" 
                    alt="Digital Archive" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Content Box (Right side in md) */}
              <div className="pl-6 md:pl-0 md:w-[45%] space-y-3">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block">1985</span>
                <h3 className="text-xl font-bold text-slate-900 font-serif">Digital Archive Launch</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  Leading the digital revolution, we transitioned our card catalogs to electronic databases, ensuring global accessibility to our unique manuscript collection.
                </p>
              </div>
            </div>

            {/* Timeline Item 3 - Today: Modern Hub */}
            <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between">
              {/* Node Icon on Timeline */}
              <div className="absolute left-[-13px] md:left-1/2 md:-ml-3.5 z-10 p-1.5 bg-indigo-950 text-white rounded-full border border-white">
                <Network className="w-4 h-4" />
              </div>

              {/* Content Box (Left side in md) */}
              <div className="pl-6 md:pl-0 md:w-[45%] space-y-3 order-2 md:order-1">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest block">Today</span>
                <h3 className="text-xl font-bold text-slate-900 font-serif">Modern Hub</h3>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
                  Now serving millions annually through virtual programs and our physical campus, Lumina is a global leader in information science and community engagement.
                </p>
              </div>

              {/* Image Box (Right side in md) */}
              <div className="pl-6 md:pl-0 md:w-[45%] order-1 md:order-2 mb-4 md:mb-0">
                <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-100 aspect-video md:aspect-[16/10]">
                  <img 
                    src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800" 
                    alt="Modern Hub" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. VALUES CARDS */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Value Card 1: Accessibility */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-3xs hover:shadow-xs transition-shadow space-y-4">
              <div className="p-3 bg-blue-50 text-indigo-600 rounded-xl w-fit">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-serif">Accessibility</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                We believe information is a fundamental right. Our resources are open to everyone, regardless of background or ability.
              </p>
            </div>

            {/* Value Card 2: Integrity */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-3xs hover:shadow-xs transition-shadow space-y-4">
              <div className="p-3 bg-blue-50 text-indigo-600 rounded-xl w-fit">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-serif">Integrity</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                We are committed to factual accuracy, neutral archiving, and the protection of intellectual freedom in all forms.
              </p>
            </div>

            {/* Value Card 3: Community */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-3xs hover:shadow-xs transition-shadow space-y-4">
              <div className="p-3 bg-blue-50 text-indigo-600 rounded-xl w-fit">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 font-serif">Community</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                Lumina serves as a living room for the world, fostering dialogue, collaboration, and collective growth.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. STAFF/TEAM SECTION: Our Curators of Knowledge */}
      <section className="bg-slate-50 pb-24">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#112244] font-serif">
              Our Curators of Knowledge
            </h2>
            <p className="text-xs md:text-sm text-slate-500 max-w-lg mx-auto">
              Led by a team of world-renowned scholars and information specialists.
            </p>
          </div>

          {/* Curators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Staff Card 1: Dr. Elena Vance */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-3xs text-center pb-6 space-y-3">
              <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400" 
                  alt="Dr. Elena Vance" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 px-4">
                <h4 className="font-bold text-slate-900 font-serif">Dr. Elena Vance</h4>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Chief Librarian</p>
              </div>
            </div>

            {/* Staff Card 2: Marcus Holloway */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-3xs text-center pb-6 space-y-3">
              <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400" 
                  alt="Marcus Holloway" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 px-4">
                <h4 className="font-bold text-slate-900 font-serif">Marcus Holloway</h4>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Director of Archives</p>
              </div>
            </div>

            {/* Staff Card 3: Sarah Jenkins */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-3xs text-center pb-6 space-y-3">
              <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=400" 
                  alt="Sarah Jenkins" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 px-4">
                <h4 className="font-bold text-slate-900 font-serif">Sarah Jenkins</h4>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Head of Collections</p>
              </div>
            </div>

            {/* Staff Card 4: Julian Chen */}
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-3xs text-center pb-6 space-y-3">
              <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400" 
                  alt="Julian Chen" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 px-4">
                <h4 className="font-bold text-slate-900 font-serif">Julian Chen</h4>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Member Services</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. JOIN OUR JOURNEY BANNER */}
      <section className="bg-[#112244] text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl font-extrabold font-serif">
            Join Our Journey
          </h2>
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Become a member today and gain access to a world of exclusive archives, digital collections, and community events.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={() => onOpenAuth?.("register")}
              className="w-full sm:w-auto px-8 py-3 bg-[#fcc04e] hover:bg-[#eab03e] text-slate-950 font-bold rounded-xl transition-all shadow-xs cursor-pointer text-sm"
            >
              Register Now
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
